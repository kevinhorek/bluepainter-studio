export const PRODUCT_SPEC_SECTIONS = [
  {
    id: 'problem',
    title: 'Problem',
    body: 'Design-to-code handoff is lossy. Incumbents can generate UI, but they don\'t preserve team formatting, design-system policy, or bidirectional editability inside your repo.'
  },
  {
    id: 'wedge',
    title: 'Wedge',
    bullets: [
      'AST-preserving canvas ↔ code round-trip',
      'Designer\'s Receipts as team policy (not demo lint)',
      'Learning loop: fixes, dismissals, and policy compound over time',
      'NOT an LLM wrapper — workflow + repo integration is the moat'
    ]
  },
  {
    id: 'moat',
    title: 'Learning loop moat',
    bullets: [
      'Log: receipt fixes, dismissals, policy changes, round-trips',
      'Output: team-weighted suggestions and custom rules',
      'Requirement: product gets better with usage; models can\'t replace this overnight'
    ]
  },
  {
    id: 'bear',
    title: 'Bear case test',
    body: 'For every feature: "If Figma + Cursor shipped this in 90 days, would we still win?" If the answer is "our UI is nicer," don\'t build it.'
  },
  {
    id: 'v1',
    title: 'v1 scope',
    bullets: [
      'Ship: VS Code / Cursor extension, real Recast/Babel sync, configurable receipts',
      'Defer: Tauri, Figma bidirectional, responsive canvas, AI app generator',
      'Prototype regex syncEngine must be replaced before any paid pilot'
    ]
  },
  {
    id: 'metrics',
    title: 'Success & kill criteria',
    bullets: [
      'Activation: one full canvas ↔ code round-trip',
      'Moat signal: team customizes receipt policy and repeats fixes',
      'Validation gate: 3+ "very interested" willing to pilot in real repo → build v1',
      'Kill: <3 after 10 sessions, or users say Cursor/Figma is good enough'
    ]
  },
  {
    id: 'not',
    title: 'We are NOT building',
    bullets: [
      'Website builder or Figma replacement',
      'AI whole-app generator',
      'Four platform shells in v1',
      'Hosted proprietary runtime',
      'Features with no defense against incumbents'
    ]
  }
];
