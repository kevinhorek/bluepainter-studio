import { DEMO_APP, DEMO_HOME, DEMO_URL, REPO_URL, SITE_URL } from './constants';

export const knowledgeCatalog = {
  brand: 'BluePainter',
  status: 'validation_prototype',
  updated: '2026-07-21',
  urls: {
    site: SITE_URL,
    demo: DEMO_URL,
    demoApp: DEMO_APP,
    demoHome: DEMO_HOME,
    repo: REPO_URL,
    pricing: `${SITE_URL}/pricing`,
    pilot: `${SITE_URL}/pilot`,
    faq: `${SITE_URL}/faq`,
    knowledge: `${SITE_URL}/knowledge`,
    llms: `${SITE_URL}/llms.txt`,
    knowledgeJson: `${SITE_URL}/knowledge.json`
  },
  pricing: {
    model: 'validation',
    plans: [
      {
        id: 'demo',
        name: 'Free live demo',
        price: 0,
        currency: 'USD',
        includes: ['Interactive studio', 'Receipts', 'Export/deploy', 'Marketing kit'],
        access: 'open'
      },
      {
        id: 'pilot',
        name: 'Facilitated pilot',
        price: 0,
        currency: 'USD',
        includes: ['Guided session 30–45m', 'Scorecard export', 'Priority feedback'],
        access: 'capacity_limited',
        capacityPerWave: 8
      }
    ],
    paidSkus: false,
    postValidationCandidates: ['per-seat', 'per-repo', 'open-core']
  },
  services: [
    {
      id: 'ast-sync',
      name: 'AST canvas ↔ TSX sync',
      description: 'Bidirectional edits via Recast/Babel on elements with stable id attributes.'
    },
    {
      id: 'receipts',
      name: "Designer's Receipts",
      description: 'Contrast, spacing, CTA copy, radius, clutter checks with one-click fixes.'
    },
    {
      id: 'figma-import',
      name: 'Figma import',
      description: 'Import frames via URL or JSON into the canvas.'
    },
    {
      id: 'export-deploy',
      name: 'Export & deploy',
      description: 'Vite zip, GitHub push, Vercel deploy.'
    },
    {
      id: 'vscode-extension',
      name: 'VS Code extension',
      description: 'Sidebar canvas, inspector, receipts, AST write-back (v0.2 scaffold).'
    },
    {
      id: 'mcp',
      name: 'MCP server',
      description: 'Agent tools for demo links, TSX analysis, receipts, knowledge, pilot requests.'
    }
  ],
  processes: {
    syncContract:
      'JSX elements must use id="node-id" matching the canvas node map. Synced fields: inline style, text, img src.',
    pilotProcess:
      'Submit /pilot → wait for seat → 30–45m facilitated session → scorecard JSON export → feedback.',
    validationGoal: 'Decide go/no-go after ~8 structured sessions.'
  },
  credentials: {
    liveDemo: DEMO_URL,
    repository: REPO_URL,
    stage: 'Validation prototype — not a production SLA product'
  }
};
