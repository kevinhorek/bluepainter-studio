import { initialMarketingNodes } from '../data/marketingPage';

export const COPY_TONES = [
  { id: 'default', label: 'Default', description: 'As designed on canvas' },
  { id: 'enterprise', label: 'Enterprise', description: 'Formal, trust-focused' },
  { id: 'playful', label: 'Playful', description: 'Friendly with energy' },
  { id: 'minimal', label: 'Minimal', description: 'Short and direct' }
];

function toneHeadline(ctx, tone) {
  if (tone === 'enterprise') return `Enterprise-ready ${ctx.heroTitle.toLowerCase()}`;
  if (tone === 'playful') return `${ctx.heroTitle} — let's go! 🚀`;
  if (tone === 'minimal') return ctx.heroTitle.split(',')[0].split('—')[0].trim();
  return ctx.heroTitle;
}

function toneSubhead(ctx, tone) {
  if (tone === 'enterprise') return `Trusted by teams who need ${ctx.heroSubtitle.toLowerCase().replace(/\.$/, '')} at scale.`;
  if (tone === 'playful') return `${ctx.heroSubtitle.replace(/\./g, '')} — and yes, it's as fun as it sounds.`;
  if (tone === 'minimal') return `${ctx.heroSubtitle.split('.')[0]}.`;
  return ctx.heroSubtitle;
}

/** Apply tone variant to generated copy (canvas text stays unchanged). */
export function applyCopyTone(ctx, copy, toneId = 'default') {
  if (toneId === 'default') return copy;

  const headline = toneHeadline(ctx, toneId);
  const subheadline = toneSubhead(ctx, toneId);
  const priceLine = `${ctx.price}${ctx.period}`;

  const variants = {
    enterprise: {
      twitterPost: `${ctx.brandName} for enterprise teams.\n\n${headline}\n\n${subheadline}\n\n${priceLine} · Request a demo → ${copy.siteUrl || 'https://yoursite.com'}`,
      linkedInPost: `${ctx.brandName} is built for organizations that need governance, reliability, and speed.\n\n${headline}\n\n${subheadline}\n\n${ctx.planName} from ${priceLine}.`,
      emailSubject: `${ctx.brandName} — enterprise-grade visual development`,
      blogLede: `${ctx.brandName} launches today with a focus on enterprise teams shipping governed React UI at scale. ${subheadline}`,
      pressHeadline: `${ctx.brandName} unveils enterprise visual development platform for React teams`
    },
    playful: {
      twitterPost: `Big news from ${ctx.brandName}! 🎉\n\n${headline}\n\n${subheadline}\n\nOnly ${priceLine} — ${ctx.heroCta} → ${copy.siteUrl || 'https://yoursite.com'}`,
      linkedInPost: `We built ${ctx.brandName} because design-dev handoff shouldn't be painful 😅\n\n${headline}\n\n${subheadline}`,
      emailSubject: `You're gonna love ${ctx.brandName} ✨`,
      blogLede: `We're so excited to launch ${ctx.brandName}! ${subheadline} Here's the story behind it.`,
      pressHeadline: `${ctx.brandName} launches with a fresh take on design-to-code for React teams`
    },
    minimal: {
      twitterPost: `${ctx.brandName}. ${headline}. ${priceLine}. → ${copy.siteUrl || 'https://yoursite.com'}`,
      linkedInPost: `${ctx.brandName} — ${headline}\n${priceLine}. ${ctx.features.slice(0, 2).join(' · ')}.`,
      emailSubject: `${ctx.brandName} is live`,
      blogLede: `${ctx.brandName} launches today. ${headline}.`,
      pressHeadline: `${ctx.brandName} launches visual dev tool for React`
    }
  };

  const v = variants[toneId] || {};
  return {
    ...copy,
    headline,
    subheadline,
    tagline: subheadline.split('.')[0] + '.',
    metaTitle: toneId === 'minimal' ? `${ctx.brandName} — ${headline}` : copy.metaTitle,
    metaDescription: toneId === 'enterprise'
      ? `${subheadline} ${ctx.planName} from ${priceLine}.`
      : copy.metaDescription,
    ...v
  };
}

/** Regenerate canvas copy nodes from current design context. */
export function syncMarketingCopyNodes(nodesByFile, { overwrite = false } = {}) {
  const marketing = { ...(nodesByFile.marketing || {}) };
  const hero = nodesByFile.hero || {};
  const pricing = nodesByFile.pricing || {};
  const brand = marketing['mkt-brand']?.text || 'Acme Studio';
  const heroTitle = hero['hero-title']?.text || '';
  const heroSubtitle = hero['hero-subtitle']?.text || '';
  const price = pricing['price-amount']?.text || '$29';
  const period = pricing['price-period']?.text || '/month';
  const planName = pricing['header-text']?.text || 'STUDIO';
  const siteUrl = marketing['mkt-site-url']?.text || 'https://yoursite.com';

  const updates = {
    'mkt-seo-title': `${brand} — ${heroTitle}`,
    'mkt-seo-desc': `${heroSubtitle} Starting at ${price}${period}.`,
    'mkt-twitter': `Introducing ${brand} — ${heroTitle}. ${heroSubtitle.slice(0, 80)}… → ${siteUrl}`,
    'mkt-linkedin': `We're launching ${brand}. ${heroTitle}. ${planName} from ${price}${period}.`,
    'mkt-email-subject': `${brand} is live — ${heroTitle}`,
    'mkt-blog-lede': `Today we are launching ${brand} — ${heroSubtitle.split('.')[0].toLowerCase()}.`,
    'mkt-press-headline': `${brand} launches ${heroTitle.toLowerCase()} for modern teams`
  };

  Object.entries(updates).forEach(([nodeId, text]) => {
    if (!marketing[nodeId]) return;
    if (!overwrite && marketing[nodeId].text && marketing[nodeId].text !== initialMarketingNodes[nodeId]?.text) return;
    marketing[nodeId] = { ...marketing[nodeId], text };
  });

  return marketing;
}
