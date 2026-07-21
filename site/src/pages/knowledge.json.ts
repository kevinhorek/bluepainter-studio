import { knowledgeCatalog } from '../lib/knowledge';
import { FAQ_ITEMS } from '../lib/faq';

export async function GET() {
  const payload = { ...knowledgeCatalog, faq: FAQ_ITEMS };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
