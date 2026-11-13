import { handleOAuthConfig } from '../_lib/oauth.js';

// GET /api/oauth/config → { github: boolean, vercel: boolean }. Never returns secrets.
export default function handler(req, res) {
  return handleOAuthConfig(req, res);
}
