/** Maps each marketing kit field to its canvas source for edit + export sync. */
export const MARKETING_FIELD_GROUPS = [
  {
    id: 'brand',
    label: 'Brand & header',
    fields: [
      { id: 'brandName', label: 'Brand name', fileId: 'marketing', nodeId: 'mkt-brand', multiline: false },
      { id: 'headerCta', label: 'Header CTA', fileId: 'marketing', nodeId: 'mkt-header-cta', multiline: false }
    ]
  },
  {
    id: 'hero',
    label: 'Hero (HeroSection.tsx)',
    fields: [
      { id: 'heroTitle', label: 'Headline', fileId: 'hero', nodeId: 'hero-title', multiline: false },
      { id: 'heroSubtitle', label: 'Subheadline', fileId: 'hero', nodeId: 'hero-subtitle', multiline: true },
      { id: 'heroCta', label: 'Hero button', fileId: 'hero', nodeId: 'hero-button', multiline: false }
    ]
  },
  {
    id: 'features',
    label: 'Landing features (MarketingPage)',
    fields: [
      { id: 'feature1', label: 'Feature card 1', fileId: 'marketing', nodeId: 'mkt-feat-1', multiline: false },
      { id: 'feature2', label: 'Feature card 2', fileId: 'marketing', nodeId: 'mkt-feat-2', multiline: false },
      { id: 'feature3', label: 'Feature card 3', fileId: 'marketing', nodeId: 'mkt-feat-3', multiline: false }
    ]
  },
  {
    id: 'pricing',
    label: 'Pricing (PricingCard.tsx)',
    fields: [
      { id: 'planName', label: 'Plan name', fileId: 'pricing', nodeId: 'header-text', multiline: false },
      { id: 'price', label: 'Price', fileId: 'pricing', nodeId: 'price-amount', multiline: false },
      { id: 'period', label: 'Period', fileId: 'pricing', nodeId: 'price-period', multiline: false },
      { id: 'pricingCta', label: 'Pricing CTA', fileId: 'pricing', nodeId: 'cta-button', multiline: false }
    ]
  },
  {
    id: 'seo',
    label: 'SEO & social copy',
    fields: [
      { id: 'metaTitle', label: 'SEO title', fileId: 'marketing', nodeId: 'mkt-seo-title', multiline: false },
      { id: 'metaDescription', label: 'SEO description', fileId: 'marketing', nodeId: 'mkt-seo-desc', multiline: true },
      { id: 'twitterPost', label: 'Twitter / X', fileId: 'marketing', nodeId: 'mkt-twitter', multiline: true },
      { id: 'linkedInPost', label: 'LinkedIn', fileId: 'marketing', nodeId: 'mkt-linkedin', multiline: true },
      { id: 'emailSubject', label: 'Email subject', fileId: 'marketing', nodeId: 'mkt-email-subject', multiline: false },
      { id: 'siteUrl', label: 'Site URL', fileId: 'marketing', nodeId: 'mkt-site-url', multiline: false }
    ]
  },
  {
    id: 'content',
    label: 'Blog & press',
    fields: [
      { id: 'blogLede', label: 'Blog intro', fileId: 'marketing', nodeId: 'mkt-blog-lede', multiline: true },
      { id: 'pressHeadline', label: 'Press headline', fileId: 'marketing', nodeId: 'mkt-press-headline', multiline: false }
    ]
  }
];

export const ALL_MARKETING_FIELDS = MARKETING_FIELD_GROUPS.flatMap((g) => g.fields);

export function getFieldText(nodesByFile, field) {
  const node = nodesByFile[field.fileId]?.[field.nodeId];
  return node?.text ?? '';
}

export function getFieldFileLabel(fileId) {
  const labels = {
    marketing: 'MarketingPage.tsx',
    hero: 'HeroSection.tsx',
    pricing: 'PricingCard.tsx',
    dashboard: 'DashboardPage.tsx'
  };
  return labels[fileId] || fileId;
}
