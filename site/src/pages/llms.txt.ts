import { knowledgeCatalog } from '../lib/knowledge';
import { FAQ_ITEMS } from '../lib/faq';
import { BRAND } from '../lib/constants';

export async function GET() {
  const lines = [
    `# ${BRAND.name}`,
    `> ${BRAND.description}`,
    '',
    `Status: ${knowledgeCatalog.status}`,
    `Demo: ${knowledgeCatalog.urls.demo}`,
    `Site: ${knowledgeCatalog.urls.site}`,
    `Repo: ${knowledgeCatalog.urls.repo}`,
    '',
    '## Pricing',
    ...knowledgeCatalog.pricing.plans.map(
      (p) => `- ${p.name}: $${p.price} ${p.currency} (${p.access})`
    ),
    `- Paid SKUs available: ${knowledgeCatalog.pricing.paidSkus}`,
    '',
    '## Services',
    ...knowledgeCatalog.services.map((s) => `- ${s.name}: ${s.description}`),
    '',
    '## Processes',
    `- Sync: ${knowledgeCatalog.processes.syncContract}`,
    `- Pilot: ${knowledgeCatalog.processes.pilotProcess}`,
    '',
    '## FAQ',
    ...FAQ_ITEMS.flatMap((f) => [`### ${f.q}`, f.a, '']),
    '## Optional',
    `- Full JSON: ${knowledgeCatalog.urls.knowledgeJson}`,
    `- MCP docs: ${knowledgeCatalog.urls.site}/knowledge/mcp`
  ].join('\n');

  return new Response(lines, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
