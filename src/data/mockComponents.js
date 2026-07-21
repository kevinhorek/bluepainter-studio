export const initialPricingNodes = {
  'pricing-card-frame': {
    id: 'pricing-card-frame',
    type: 'frame',
    name: 'PricingCard Frame',
    tag: 'div',
    style: {
      position: 'absolute',
      left: 100,
      top: 60,
      padding: 32,
      borderRadius: 12,
      background: '#ffffff',
      color: '#1e293b',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderStyle: 'solid',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      width: 320,
      height: 'auto'
    },
    children: ['header-text', 'price-container', 'features-list', 'cta-button']
  },
  'header-text': {
    id: 'header-text',
    type: 'text',
    name: 'Header Label',
    tag: 'h3',
    style: {
      textTransform: 'uppercase',
      fontSize: 12,
      fontWeight: 700,
      color: '#64748b'
    },
    text: 'PRO'
  },
  'price-container': {
    id: 'price-container',
    type: 'frame',
    name: 'Price Container',
    tag: 'div',
    style: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4
    },
    children: ['price-amount', 'price-period']
  },
  'price-amount': {
    id: 'price-amount',
    type: 'text',
    name: 'Price Amount',
    tag: 'span',
    style: {
      fontSize: 36,
      fontWeight: 800,
      color: '#0f172a'
    },
    text: '$29'
  },
  'price-period': {
    id: 'price-period',
    type: 'text',
    name: 'Price Period',
    tag: 'span',
    style: {
      fontSize: 14,
      color: '#64748b'
    },
    text: '/month'
  },
  'features-list': {
    id: 'features-list',
    type: 'list',
    name: 'Features List',
    tag: 'ul',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      listStyle: 'none'
    },
    children: ['feature-item-1', 'feature-item-2', 'feature-item-3']
  },
  'feature-item-1': {
    id: 'feature-item-1',
    type: 'list-item',
    name: 'Feature 1',
    tag: 'li',
    style: {
      fontSize: 14,
      color: '#475569'
    },
    text: 'Unlimited projects'
  },
  'feature-item-2': {
    id: 'feature-item-2',
    type: 'list-item',
    name: 'Feature 2',
    tag: 'li',
    style: {
      fontSize: 14,
      color: '#475569'
    },
    text: 'Priority support'
  },
  'feature-item-3': {
    id: 'feature-item-3',
    type: 'list-item',
    name: 'Feature 3',
    tag: 'li',
    style: {
      fontSize: 14,
      color: '#475569'
    },
    text: 'Custom domain'
  },
  'cta-button': {
    id: 'cta-button',
    type: 'button',
    name: 'CTA Button',
    tag: 'button',
    style: {
      width: '100%',
      background: '#1E40AF',
      color: '#ffffff',
      borderWidth: 0,
      padding: 12,
      borderRadius: 8,
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer'
    },
    text: 'Start free trial'
  }
};

export const initialHeroNodes = {
  'hero-frame': {
    id: 'hero-frame',
    type: 'frame',
    name: 'Hero Frame',
    tag: 'div',
    style: {
      position: 'absolute',
      left: 60,
      top: 40,
      padding: 48,
      borderRadius: 8,
      background: '#0f172a',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      alignItems: 'center',
      width: 450,
      height: 'auto',
      borderWidth: 1,
      borderColor: '#1e293b',
      borderStyle: 'solid'
    },
    children: ['hero-title', 'hero-subtitle', 'hero-button']
  },
  'hero-title': {
    id: 'hero-title',
    type: 'text',
    name: 'Hero Title',
    tag: 'h1',
    style: {
      fontSize: 28,
      fontWeight: 800,
      textAlign: 'center'
    },
    text: 'Three surfaces, one source of truth'
  },
  'hero-subtitle': {
    id: 'hero-subtitle',
    type: 'text',
    name: 'Hero Subtitle',
    tag: 'p',
    style: {
      fontSize: 14,
      color: '#94a3b8',
      textAlign: 'center',
      lineHeight: '1.5'
    },
    text: 'Edits in visual canvas, code editor, or designer receipts update each other in real time.'
  },
  'hero-button': {
    id: 'hero-button',
    type: 'button',
    name: 'CTA Button',
    tag: 'button',
    style: {
      background: '#2563eb',
      color: '#ffffff',
      borderWidth: 0,
      padding: 10,
      borderRadius: 6,
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer'
    },
    text: 'Get Started Free'
  }
};

export function cloneNodes(nodes) {
  return JSON.parse(JSON.stringify(nodes));
}
