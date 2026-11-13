import type { SharePayload } from '../components/ShareCard.astro';

/** Sample cards served at /s/<id> and used as the fallback on /s when a link is missing or invalid. */
export const DEMO_SHARE_CARDS: Record<string, SharePayload> = {
  'demo-scorecard': {
    type: 'scorecard',
    score: 92,
    label: 'Design policy score',
    nodes: 24,
    fixes: 3,
    contrastPasses: 5,
    name: 'Validation session'
  },
  'demo-wrapped': {
    type: 'wrapped',
    score: 88,
    label: 'Sync Wrapped',
    nodes: 41,
    fixes: 7,
    contrastPasses: 12,
    name: 'Weekly sync'
  }
};
