import { handleOAuth } from '../../_lib/oauth.js';

// GET /api/oauth/<github|vercel>/<start|callback>. One dynamic route instead of four files
// keeps the deployment's function count down; Vercel puts the segments in req.query.
export default function handler(req, res) {
  return handleOAuth(req, res);
}
