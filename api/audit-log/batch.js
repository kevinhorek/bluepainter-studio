/**
 * Team Audit Log - Batch Event Submission (v1)
 * 
 * POST /api/audit-log/batch
 * 
 * Accept batches of learning loop events for team audit trail.
 * Implements contract from docs/AUDIT_LOG.md §Backend Requirements
 * 
 * Soft-fail when DATABASE_URL is not configured (graceful degradation).
 */

const MAX_BATCH_SIZE = 100;

/**
 * Validate event schema per docs/AUDIT_LOG.md
 */
function validateEvent(event, index) {
  const errors = [];
  
  if (!event.eventId || typeof event.eventId !== 'string') {
    errors.push(`events[${index}].eventId is required and must be a string`);
  }
  
  if (!event.timestamp || typeof event.timestamp !== 'number') {
    errors.push(`events[${index}].timestamp is required and must be a number`);
  }
  
  if (!event.type || typeof event.type !== 'string') {
    errors.push(`events[${index}].type is required and must be a string`);
  }
  
  if (!event.data || typeof event.data !== 'object') {
    errors.push(`events[${index}].data is required and must be an object`);
  }
  
  if (!event.context || typeof event.context !== 'object') {
    errors.push(`events[${index}].context is required and must be an object`);
  }
  
  return errors;
}

/**
 * Insert events into Postgres (when configured).
 * Uses pg client from environment.
 */
async function insertEvents(events) {
  // Soft-fail: check if database is configured
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    console.log('[AuditLog] DATABASE_URL not configured — skipping persistence (soft-fail mode)');
    return {
      accepted: events.length,
      rejected: 0,
      errors: [],
      mode: 'soft-fail'
    };
  }
  
  // Import pg dynamically (only when needed)
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  const client = await pool.connect();
  
  try {
    const accepted = [];
    const rejected = [];
    const errors = [];
    
    for (const event of events) {
      try {
        // Idempotent insert (ignore duplicates)
        await client.query(
          `INSERT INTO audit_events (event_id, team_id, user_id, timestamp, event_type, data, context)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (event_id) DO NOTHING`,
          [
            event.eventId,
            event.context?.teamId || null,
            event.context?.userId || null,
            event.timestamp,
            event.type,
            JSON.stringify(event.data),
            JSON.stringify(event.context)
          ]
        );
        accepted.push(event.eventId);
      } catch (insertErr) {
        rejected.push(event.eventId);
        errors.push({
          eventId: event.eventId,
          error: insertErr.message
        });
      }
    }
    
    return {
      accepted: accepted.length,
      rejected: rejected.length,
      errors
    };
  } finally {
    client.release();
    await pool.end();
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { events = [] } = body || {};
    
    // Validate batch size
    if (!Array.isArray(events)) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'events must be an array'
      });
    }
    
    if (events.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'events array cannot be empty'
      });
    }
    
    if (events.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        error: 'Batch too large',
        details: `Maximum ${MAX_BATCH_SIZE} events per batch`
      });
    }
    
    // Validate each event
    const validationErrors = [];
    events.forEach((event, index) => {
      const errors = validateEvent(event, index);
      validationErrors.push(...errors);
    });
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Invalid event schema',
        details: validationErrors.join('; ')
      });
    }
    
    // Insert events (soft-fail when DATABASE_URL missing)
    const result = await insertEvents(events);
    
    return res.status(200).json({
      accepted: result.accepted,
      rejected: result.rejected,
      errors: result.errors,
      mode: result.mode // 'soft-fail' when DATABASE_URL missing
    });
    
  } catch (err) {
    console.error('[AuditLog] Batch submission error:', err);
    return res.status(500).json({
      error: 'Server error',
      details: err.message
    });
  }
}
