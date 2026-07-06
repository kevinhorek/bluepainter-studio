import { cloneNodes } from './mockComponents';

export const initialMarketingNodes = {
  'marketing-page': {
    id: 'marketing-page',
    type: 'frame',
    name: 'Marketing Page',
    tag: 'div',
    style: {
      position: 'relative',
      width: 1280,
      height: 1680,
      display: 'flex',
      flexDirection: 'column',
      background: '#f8fafc',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderStyle: 'solid'
    },
    children: ['mkt-header', 'mkt-hero-wrap', 'mkt-features', 'mkt-pricing-wrap', 'mkt-copy-panel']
  },

  'mkt-header': {
    id: 'mkt-header',
    type: 'frame',
    name: 'Landing Header',
    tag: 'header',
    style: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 48px',
      background: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      borderBottomStyle: 'solid'
    },
    children: ['mkt-brand-row', 'mkt-header-cta']
  },
  'mkt-brand-row': {
    id: 'mkt-brand-row',
    type: 'frame',
    name: 'Brand Row',
    tag: 'div',
    style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 },
    children: ['mkt-brand-dot', 'mkt-brand']
  },
  'mkt-brand-dot': {
    id: 'mkt-brand-dot',
    type: 'frame',
    name: 'Logo',
    tag: 'div',
    style: { width: 28, height: 28, borderRadius: 6, background: '#2563eb' },
    children: []
  },
  'mkt-brand': {
    id: 'mkt-brand',
    type: 'text',
    name: 'Brand Name',
    tag: 'span',
    style: { fontSize: 18, fontWeight: 800, color: '#0f172a' },
    text: 'Acme Studio'
  },
  'mkt-header-cta': {
    id: 'mkt-header-cta',
    type: 'button',
    name: 'Header CTA',
    tag: 'button',
    style: {
      background: '#2563eb',
      color: '#ffffff',
      borderWidth: 0,
      padding: '10px 20px',
      borderRadius: 8,
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer'
    },
    text: 'Get Started Free'
  },

  'mkt-hero-wrap': {
    id: 'mkt-hero-wrap',
    type: 'frame',
    name: 'Hero Section',
    tag: 'section',
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 32px',
      background: '#0f172a'
    },
    children: ['mkt-hero-instance']
  },
  'mkt-hero-instance': {
    id: 'mkt-hero-instance',
    type: 'component-instance',
    name: 'HeroSection',
    refFile: 'hero',
    tag: 'div',
    style: { maxWidth: 520 }
  },

  'mkt-features': {
    id: 'mkt-features',
    type: 'frame',
    name: 'Feature Cards',
    tag: 'section',
    style: {
      display: 'flex',
      flexDirection: 'row',
      gap: 20,
      padding: '32px 48px',
      marginTop: -24
    },
    children: ['mkt-feat-card-1', 'mkt-feat-card-2', 'mkt-feat-card-3']
  },
  'mkt-feat-card-1': {
    id: 'mkt-feat-card-1',
    type: 'frame',
    name: 'Feature Card 1',
    tag: 'div',
    style: {
      flex: 1,
      background: '#ffffff',
      borderRadius: 12,
      padding: 24,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
    },
    children: ['mkt-feat-1']
  },
  'mkt-feat-1': {
    id: 'mkt-feat-1',
    type: 'text',
    name: 'Feature 1',
    tag: 'p',
    style: { fontSize: 14, color: '#475569', lineHeight: '1.5' },
    text: 'Unlimited projects'
  },
  'mkt-feat-card-2': {
    id: 'mkt-feat-card-2',
    type: 'frame',
    name: 'Feature Card 2',
    tag: 'div',
    style: {
      flex: 1,
      background: '#ffffff',
      borderRadius: 12,
      padding: 24,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
    },
    children: ['mkt-feat-2']
  },
  'mkt-feat-2': {
    id: 'mkt-feat-2',
    type: 'text',
    name: 'Feature 2',
    tag: 'p',
    style: { fontSize: 14, color: '#475569', lineHeight: '1.5' },
    text: 'Priority support'
  },
  'mkt-feat-card-3': {
    id: 'mkt-feat-card-3',
    type: 'frame',
    name: 'Feature Card 3',
    tag: 'div',
    style: {
      flex: 1,
      background: '#ffffff',
      borderRadius: 12,
      padding: 24,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
    },
    children: ['mkt-feat-3']
  },
  'mkt-feat-3': {
    id: 'mkt-feat-3',
    type: 'text',
    name: 'Feature 3',
    tag: 'p',
    style: { fontSize: 14, color: '#475569', lineHeight: '1.5' },
    text: 'Custom domain'
  },

  'mkt-pricing-wrap': {
    id: 'mkt-pricing-wrap',
    type: 'frame',
    name: 'Pricing Section',
    tag: 'section',
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '48px 32px 64px'
    },
    children: ['mkt-pricing-instance']
  },
  'mkt-pricing-instance': {
    id: 'mkt-pricing-instance',
    type: 'component-instance',
    name: 'PricingCard',
    refFile: 'pricing',
    tag: 'div',
    style: { maxWidth: 360 }
  },

  'mkt-copy-panel': {
    id: 'mkt-copy-panel',
    type: 'frame',
    name: 'Marketing Copy Panel',
    tag: 'aside',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: 24,
      margin: '0 48px 48px',
      background: '#f5f3ff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#ddd6fe',
      borderStyle: 'solid'
    },
    children: [
      'mkt-copy-heading',
      'mkt-seo-title',
      'mkt-seo-desc',
      'mkt-twitter',
      'mkt-linkedin',
      'mkt-email-subject',
      'mkt-blog-lede',
      'mkt-press-headline',
      'mkt-site-url'
    ]
  },
  'mkt-copy-heading': {
    id: 'mkt-copy-heading',
    type: 'text',
    name: 'Copy Panel Label',
    tag: 'p',
    style: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c3aed', marginBottom: 4 },
    text: 'Marketing copy — select layers here or in the kit panel'
  },
  'mkt-seo-title': {
    id: 'mkt-seo-title',
    type: 'text',
    name: 'SEO Title',
    tag: 'p',
    style: { fontSize: 13, fontWeight: 600, color: '#1e293b' },
    text: 'Acme Studio — Three surfaces, one source of truth'
  },
  'mkt-seo-desc': {
    id: 'mkt-seo-desc',
    type: 'text',
    name: 'SEO Description',
    tag: 'p',
    style: { fontSize: 12, color: '#64748b', lineHeight: '1.5' },
    text: 'Edits in visual canvas, code editor, or designer receipts update each other in real time. Starting at $29/month.'
  },
  'mkt-twitter': {
    id: 'mkt-twitter',
    type: 'text',
    name: 'Twitter Post',
    tag: 'p',
    style: { fontSize: 12, color: '#334155', lineHeight: '1.5' },
    text: 'Introducing Acme Studio — Three surfaces, one source of truth. Get started → https://yoursite.com'
  },
  'mkt-linkedin': {
    id: 'mkt-linkedin',
    type: 'text',
    name: 'LinkedIn Post',
    tag: 'p',
    style: { fontSize: 12, color: '#334155', lineHeight: '1.5' },
    text: "We're launching Acme Studio. Three surfaces, one source of truth. Pro plan from $29/month."
  },
  'mkt-email-subject': {
    id: 'mkt-email-subject',
    type: 'text',
    name: 'Email Subject',
    tag: 'p',
    style: { fontSize: 12, fontWeight: 600, color: '#1e293b' },
    text: 'Acme Studio is live — Three surfaces, one source of truth'
  },
  'mkt-blog-lede': {
    id: 'mkt-blog-lede',
    type: 'text',
    name: 'Blog Lede',
    tag: 'p',
    style: { fontSize: 12, color: '#475569', lineHeight: '1.55' },
    text: 'Today we are launching Acme Studio — a new way for teams to design and ship React UI with bidirectional canvas-code sync.'
  },
  'mkt-press-headline': {
    id: 'mkt-press-headline',
    type: 'text',
    name: 'Press Headline',
    tag: 'p',
    style: { fontSize: 13, fontWeight: 700, color: '#0f172a' },
    text: 'Acme Studio launches visual development platform for React teams'
  },
  'mkt-site-url': {
    id: 'mkt-site-url',
    type: 'text',
    name: 'Site URL',
    tag: 'p',
    style: { fontSize: 11, color: '#6366f1', fontWeight: 600 },
    text: 'https://yoursite.com'
  }
};

export function getFreshMarketingNodes() {
  return cloneNodes(initialMarketingNodes);
}
