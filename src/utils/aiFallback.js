import { getAllowedNodeKeys, GENERATION_SCHEMAS } from './aiPrompts';

function pickKeywords(prompt) {
  const p = prompt.toLowerCase();
  const verticals = [
    { match: /health|medical|hipaa|clinic/, brand: 'MedFlow', tone: 'secure and compliant' },
    { match: /finance|fintech|bank|payment/, brand: 'Ledger Studio', tone: 'trusted and precise' },
    { match: /fitness|workout|gym/, brand: 'PulseFit', tone: 'energetic and motivating' },
    { match: /enterprise|b2b|team/, brand: 'Acme Enterprise', tone: 'professional and scalable' },
    { match: /developer|dev tool|code|react/, brand: 'DevCanvas', tone: 'technical and fast' },
    { match: /ai|ml|machine learning/, brand: 'Neural Studio', tone: 'intelligent and modern' }
  ];
  const hit = verticals.find((v) => v.match.test(p));
  return hit || { brand: 'Acme Studio', tone: 'modern and clear' };
}

function updatesForType(type, prompt, context) {
  const { brand, tone } = pickKeywords(prompt);
  const topic = prompt.slice(0, 80).trim() || `${brand} product`;

  const hero = [
    { fileId: 'hero', nodeId: 'hero-title', text: `${brand}: ${topic.split(' ').slice(0, 5).join(' ')}` },
    { fileId: 'hero', nodeId: 'hero-subtitle', text: `A ${tone} platform built for teams who ship fast. Edit on canvas or in code — always in sync.` },
    { fileId: 'hero', nodeId: 'hero-button', text: 'Start free trial', style: { background: '#2563eb' } }
  ];

  const pricing = [
    { fileId: 'pricing', nodeId: 'header-text', text: 'PRO' },
    { fileId: 'pricing', nodeId: 'price-amount', text: prompt.match(/\$\d+/)?.[0] || '$29' },
    { fileId: 'pricing', nodeId: 'price-period', text: '/month' },
    { fileId: 'pricing', nodeId: 'feature-item-1', text: 'Unlimited projects' },
    { fileId: 'pricing', nodeId: 'feature-item-2', text: 'Priority support' },
    { fileId: 'pricing', nodeId: 'feature-item-3', text: 'Advanced analytics' },
    { fileId: 'pricing', nodeId: 'cta-button', text: 'Get started' }
  ];

  const features = [
    { fileId: 'marketing', nodeId: 'mkt-feat-1', text: `Ship ${topic.toLowerCase()} 2× faster` },
    { fileId: 'marketing', nodeId: 'mkt-feat-2', text: `${tone.charAt(0).toUpperCase()}${tone.slice(1)} workflows` },
    { fileId: 'marketing', nodeId: 'mkt-feat-3', text: 'Canvas ↔ code sync' }
  ];

  const brandUpdates = [
    { fileId: 'marketing', nodeId: 'mkt-brand', text: brand },
    { fileId: 'marketing', nodeId: 'mkt-header-cta', text: 'Get started' },
    { fileId: 'dashboard', nodeId: 'sidebar-brand-text', text: brand }
  ];

  const copy = [
    { fileId: 'marketing', nodeId: 'mkt-seo-title', text: `${brand} — ${hero[0].text}` },
    { fileId: 'marketing', nodeId: 'mkt-seo-desc', text: `${hero[1].text} Starting at ${pricing[1].text}${pricing[2].text}.` },
    { fileId: 'marketing', nodeId: 'mkt-twitter', text: `Introducing ${brand} 🚀 ${hero[0].text}. ${context.siteUrl || 'https://yoursite.com'}` },
    { fileId: 'marketing', nodeId: 'mkt-linkedin', text: `We're launching ${brand}. ${hero[0].text}. ${hero[1].text}` },
    { fileId: 'marketing', nodeId: 'mkt-email-subject', text: `${brand} is live — ${hero[0].text}` },
    { fileId: 'marketing', nodeId: 'mkt-blog-lede', text: `Today we're launching ${brand} — ${hero[1].text}` },
    { fileId: 'marketing', nodeId: 'mkt-press-headline', text: `${brand} launches ${topic.toLowerCase()} for modern teams` }
  ];

  const byType = {
    hero,
    pricing,
    'feature-cards': features,
    brand: brandUpdates,
    'marketing-copy': copy,
    'full-marketing': [...brandUpdates, ...hero, ...features, ...pricing, ...copy],
    custom: [...hero.slice(0, 2), ...features.slice(0, 1)]
  };

  const raw = byType[type] || byType.custom;
  const allowed = getAllowedNodeKeys(type);
  return raw.filter((u) => allowed.has(`${u.fileId}:${u.nodeId}`));
}

export function generateFallback({ type, prompt, context }) {
  const updates = updatesForType(type, prompt, context);
  const schema = GENERATION_SCHEMAS[type];
  return {
    message: `Generated ${schema?.description || type} (demo mode — add OpenAI key for real AI)`,
    updates,
    source: 'fallback'
  };
}
