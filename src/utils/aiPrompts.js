/** AI generation schemas — node targets the model may update per type. */
export const GENERATION_TYPES = [
  { id: 'hero', label: 'Hero section', description: 'Headline, subhead, CTA button' },
  { id: 'pricing', label: 'Pricing card', description: 'Plan name, price, features, CTA' },
  { id: 'marketing-copy', label: 'Marketing copy', description: 'SEO, social, email, blog, press' },
  { id: 'feature-cards', label: 'Feature cards', description: 'Three landing page feature bullets' },
  { id: 'full-marketing', label: 'Full landing', description: 'Hero + pricing + features + all copy' },
  { id: 'brand', label: 'Brand & header', description: 'Brand name and header CTA' },
  { id: 'custom', label: 'Custom', description: 'Describe any element or layout change' }
];

const HERO_ALLOWED = [
  { fileId: 'hero', nodeId: 'hero-title', label: 'Headline' },
  { fileId: 'hero', nodeId: 'hero-subtitle', label: 'Subheadline' },
  { fileId: 'hero', nodeId: 'hero-button', label: 'CTA button text' },
  { fileId: 'hero', nodeId: 'hero-frame', label: 'Hero background (style.background)' },
  { fileId: 'hero', nodeId: 'hero-button', label: 'CTA color (style.background)' }
];

const PRICING_ALLOWED = [
  { fileId: 'pricing', nodeId: 'header-text', label: 'Plan label' },
  { fileId: 'pricing', nodeId: 'price-amount', label: 'Price' },
  { fileId: 'pricing', nodeId: 'price-period', label: 'Period' },
  { fileId: 'pricing', nodeId: 'feature-item-1', label: 'Feature 1' },
  { fileId: 'pricing', nodeId: 'feature-item-2', label: 'Feature 2' },
  { fileId: 'pricing', nodeId: 'feature-item-3', label: 'Feature 3' },
  { fileId: 'pricing', nodeId: 'cta-button', label: 'CTA button' }
];

const MARKETING_COPY_ALLOWED = [
  { fileId: 'marketing', nodeId: 'mkt-seo-title', label: 'SEO title' },
  { fileId: 'marketing', nodeId: 'mkt-seo-desc', label: 'SEO description' },
  { fileId: 'marketing', nodeId: 'mkt-twitter', label: 'Twitter post' },
  { fileId: 'marketing', nodeId: 'mkt-linkedin', label: 'LinkedIn post' },
  { fileId: 'marketing', nodeId: 'mkt-email-subject', label: 'Email subject' },
  { fileId: 'marketing', nodeId: 'mkt-blog-lede', label: 'Blog intro' },
  { fileId: 'marketing', nodeId: 'mkt-press-headline', label: 'Press headline' },
  { fileId: 'marketing', nodeId: 'mkt-site-url', label: 'Site URL' }
];

const FEATURE_CARDS_ALLOWED = [
  { fileId: 'marketing', nodeId: 'mkt-feat-1', label: 'Feature card 1' },
  { fileId: 'marketing', nodeId: 'mkt-feat-2', label: 'Feature card 2' },
  { fileId: 'marketing', nodeId: 'mkt-feat-3', label: 'Feature card 3' }
];

const BRAND_ALLOWED = [
  { fileId: 'marketing', nodeId: 'mkt-brand', label: 'Brand name' },
  { fileId: 'marketing', nodeId: 'mkt-header-cta', label: 'Header CTA' },
  { fileId: 'dashboard', nodeId: 'sidebar-brand-text', label: 'Dashboard brand' }
];

export const GENERATION_SCHEMAS = {
  hero: {
    description: 'Generate a hero section for a marketing or app landing page.',
    allowed: HERO_ALLOWED
  },
  pricing: {
    description: 'Generate a pricing card with plan details.',
    allowed: PRICING_ALLOWED
  },
  'marketing-copy': {
    description: 'Generate SEO meta, social posts, email subject, blog lede, press headline.',
    allowed: MARKETING_COPY_ALLOWED
  },
  'feature-cards': {
    description: 'Generate three short feature highlights for the marketing landing page.',
    allowed: FEATURE_CARDS_ALLOWED
  },
  brand: {
    description: 'Generate brand name and header call-to-action.',
    allowed: BRAND_ALLOWED
  },
  'full-marketing': {
    description: 'Generate a complete marketing landing: hero, pricing, features, and all copy nodes.',
    allowed: [
      ...BRAND_ALLOWED.filter((a) => a.nodeId !== 'sidebar-brand-text'),
      ...HERO_ALLOWED,
      ...FEATURE_CARDS_ALLOWED,
      ...PRICING_ALLOWED,
      ...MARKETING_COPY_ALLOWED
    ]
  },
  custom: {
    description: 'Generate updates for any allowed canvas nodes based on the user request.',
    allowed: [
      ...HERO_ALLOWED,
      ...PRICING_ALLOWED,
      ...FEATURE_CARDS_ALLOWED,
      ...MARKETING_COPY_ALLOWED,
      ...BRAND_ALLOWED
    ]
  }
};

export function getAllowedNodeKeys(type) {
  const schema = GENERATION_SCHEMAS[type] || GENERATION_SCHEMAS.custom;
  return new Set(schema.allowed.map((a) => `${a.fileId}:${a.nodeId}`));
}

export const PROMPT_SUGGESTIONS = {
  hero: [
    'B2B SaaS for design teams — bold and confident',
    'Consumer fitness app — energetic and friendly',
    'Developer tool — minimal and technical'
  ],
  pricing: [
    'Freemium with Pro at $19/month for startups',
    'Enterprise tier at $99/month with SSO and audit logs',
    'Simple single plan at $29/month'
  ],
  'marketing-copy': [
    'Launch announcement for Product Hunt',
    'Enterprise-focused LinkedIn campaign',
    'Short SEO copy for a React UI builder'
  ],
  'full-marketing': [
    'Complete landing for an AI design-to-code tool',
    'Marketing site for a team analytics dashboard',
    'Launch kit for a no-code form builder'
  ],
  custom: [
    'Make the dashboard feel more enterprise',
    'Rewrite everything for a healthcare startup',
    'Dark mode fintech aesthetic with trust-focused copy'
  ]
};
