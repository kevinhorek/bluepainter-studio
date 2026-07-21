import { GENERATION_SCHEMAS } from '../src/utils/aiPrompts.js';

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function buildSystemPrompt(type) {
  const schema = GENERATION_SCHEMAS[type] || GENERATION_SCHEMAS.custom;
  return `You are a product designer and copywriter for BluePainter, a visual React design tool.

Return ONLY valid JSON matching this shape:
{
  "message": "short summary of what you generated",
  "updates": [
    { "fileId": "hero", "nodeId": "hero-title", "text": "..." }
  ]
}

Rules:
- Only use fileId/nodeId pairs from the allowed list below.
- "text" is required for text/button nodes. Optional "style" object with camelCase CSS keys (background, color, fontSize, etc.).
- Keep copy concise and shippable. Match the user's brand tone from context.
- Do not invent node IDs outside the schema.

${schema.description}

Allowed updates:
${schema.allowed.map((a) => `- ${a.fileId}.${a.nodeId} (${a.label})`).join('\n')}`;
}

function buildUserPrompt(type, prompt, context) {
  return `Generation type: ${type}

User request:
${prompt}

Current design context:
${JSON.stringify(context, null, 2)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-OpenAI-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { type = 'custom', prompt = '', context = {} } = body || {};

    if (!prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const userKey = req.headers['x-openai-key'];
    const apiKey = process.env.OPENAI_API_KEY || userKey;

    if (!apiKey) {
      return res.status(503).json({ error: 'AI not configured', code: 'NO_KEY' });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt(type) },
          { role: 'user', content: buildUserPrompt(type, prompt, context) }
        ],
        temperature: 0.75
      })
    });

    if (!openaiRes.ok) {
      const details = await openaiRes.text();
      return res.status(502).json({ error: 'OpenAI request failed', details });
    }

    const data = await openaiRes.json();
    const content = JSON.parse(data.choices[0].message.content);

    if (!Array.isArray(content.updates)) {
      return res.status(502).json({ error: 'Invalid AI response shape' });
    }

    return res.status(200).json({
      message: content.message || 'Generated successfully',
      updates: content.updates,
      source: 'openai'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
}
