/**
 * Team Audit Log - Query Events (v1)
 * 
 * GET /api/audit-log/query
 * 
 * Query audit events with team-scoped filtering.
 * Implements contract from docs/AUDIT_LOG.md §Backend Requirements
 * 
 * Soft-fail when DATABASE_URL is not configured (returns empty result).
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

/**
 * Parse query parameters and build SQL query
 */
function buildQuery(params) {
  const {
    teamId,
    startDate,
    endDate,
    userId,
    eventType,
    filePath,
    limit = DEFAULT_LIMIT,
    offset = 0
  } = params;
  
  const conditions = [];
  const values = [];
  let valueIndex = 1;
  
  // teamId is required for team-scoped queries
  if (teamId) {
    conditions.push(`team_id = $${valueIndex++}`);
    values.push(teamId);
  }
  
  // Date range filtering
  if (startDate) {
    conditions.push(`timestamp >= $${valueIndex++}`);
    values.push(parseInt(startDate, 10));
  }
  
  if (endDate) {
    conditions.push(`timestamp <= $${valueIndex++}`);
    values.push(parseInt(endDate, 10));
  }
  
  // User filtering
  if (userId) {
    conditions.push(`user_id = $${valueIndex++}`);
    values.push(userId);
  }
  
  // Event type filtering (comma-separated)
  if (eventType) {
    const types = eventType.split(',').map(t => t.trim());
    conditions.push(`event_type = ANY($${valueIndex++})`);
    values.push(types);
  }
  
  // File path filtering (supports wildcards)
  if (filePath) {
    conditions.push(`context->>'filePath' LIKE $${valueIndex}`);
    values.push(filePath.replace('*', '%'));
    valueIndex++;
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const parsedLimit = Math.min(parseInt(limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const parsedOffset = parseInt(offset, 10) || 0;
  
  const limitParamIndex = valueIndex++;
  const offsetParamIndex = valueIndex;
  
  values.push(parsedLimit + 1); // Fetch one extra to check hasMore
  values.push(parsedOffset);
  
  const query = `
    SELECT event_id, team_id, user_id, timestamp, event_type, data, context, created_at
    FROM audit_events
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT $${limitParamIndex}
    OFFSET $${offsetParamIndex}
  `;
  
  return { query, values, limit: parsedLimit, offset: parsedOffset };
}

/**
 * Query events from Postgres (when configured)
 */
async function queryEvents(params) {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    console.log('[AuditLog] DATABASE_URL not configured — returning empty result (soft-fail mode)');
    return {
      events: [],
      total: 0,
      limit: parseInt(params.limit, 10) || DEFAULT_LIMIT,
      offset: parseInt(params.offset, 10) || 0,
      hasMore: false,
      mode: 'soft-fail'
    };
  }
  
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  const client = await pool.connect();
  
  try {
    const { query, values, limit, offset } = buildQuery(params);
    
    // Execute query
    const result = await client.query(query, values);
    
    // Check if there are more results
    const hasMore = result.rows.length > limit;
    const events = result.rows.slice(0, limit);
    
    // Transform rows to match API schema
    const transformedEvents = events.map(row => ({
      eventId: row.event_id,
      timestamp: row.timestamp,
      type: row.event_type,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context
    }));
    
    // Get total count for team (expensive, only for first page)
    let total = transformedEvents.length + offset;
    if (offset === 0 && params.teamId) {
      const countResult = await client.query(
        'SELECT COUNT(*) FROM audit_events WHERE team_id = $1',
        [params.teamId]
      );
      total = parseInt(countResult.rows[0].count, 10);
    }
    
    return {
      events: transformedEvents,
      total,
      limit,
      offset,
      hasMore
    };
    
  } finally {
    client.release();
    await pool.end();
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const params = req.query || {};
    
    // Query events (soft-fail when DATABASE_URL missing)
    const result = await queryEvents(params);
    
    return res.status(200).json(result);
    
  } catch (err) {
    console.error('[AuditLog] Query error:', err);
    return res.status(500).json({
      error: 'Server error',
      details: err.message
    });
  }
}
