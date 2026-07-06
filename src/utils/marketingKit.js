import JSZip from 'jszip';
import { generateTSX } from './syncEngine';
import { WORKSPACE_FILES, APP_EXPORT_FILE_IDS } from '../data/workspaceFiles';
import { applyCopyTone } from './copyToneVariants';

function exportFilename(label) {
  return label.replace(/\.tsx$/, '.jsx');
}

function fixImportPaths(code) {
  return code.replace(/from '\.\/([^']+)'/g, (_, name) => `from './${name}.jsx'`);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Pull brand, hero, pricing, landing features, and copy nodes from canvas. */
export function extractMarketingContext(nodesByFile) {
  const hero = nodesByFile.hero || {};
  const pricing = nodesByFile.pricing || {};
  const marketing = nodesByFile.marketing || {};

  const heroTitle = hero['hero-title']?.text || 'Build faster with your team';
  const heroSubtitle = hero['hero-subtitle']?.text || 'The modern platform for shipping great products.';
  const heroCta = hero['hero-button']?.text || 'Get started';

  const planName = pricing['header-text']?.text || 'Pro';
  const price = pricing['price-amount']?.text || '$29';
  const period = pricing['price-period']?.text || '/month';
  const pricingCta = pricing['cta-button']?.text || 'Start free trial';
  const pricingFeatures = Object.values(pricing)
    .filter((n) => n?.type === 'list-item' && n.text)
    .map((n) => n.text);

  const landingFeatures = [
    marketing['mkt-feat-1']?.text,
    marketing['mkt-feat-2']?.text,
    marketing['mkt-feat-3']?.text
  ].filter(Boolean);

  const brandName = marketing['mkt-brand']?.text || 'Your Product';
  const headerCta = marketing['mkt-header-cta']?.text || heroCta;
  const siteUrl = marketing['mkt-site-url']?.text || 'https://yoursite.com';

  const primaryColor = pricing['cta-button']?.style?.background
    || marketing['mkt-header-cta']?.style?.background
    || hero['hero-button']?.style?.background
    || '#2563eb';
  const heroBg = hero['hero-frame']?.style?.background || '#0f172a';

  return {
    brandName,
    headerCta,
    heroTitle,
    heroSubtitle,
    heroCta,
    planName,
    price,
    period,
    pricingCta,
    features: landingFeatures.length ? landingFeatures : (pricingFeatures.length ? pricingFeatures : ['Unlimited projects', 'Priority support', 'Custom domain']),
    siteUrl,
    primaryColor,
    heroBg,
    copyNodes: {
      metaTitle: marketing['mkt-seo-title']?.text,
      metaDescription: marketing['mkt-seo-desc']?.text,
      twitterPost: marketing['mkt-twitter']?.text,
      linkedInPost: marketing['mkt-linkedin']?.text,
      emailSubject: marketing['mkt-email-subject']?.text,
      blogLede: marketing['mkt-blog-lede']?.text,
      pressHeadline: marketing['mkt-press-headline']?.text
    }
  };
}

/** Build export copy from canvas nodes + optional tone variant. */
export function generateMarketingCopy(ctx, toneId = 'default') {
  const tagline = ctx.heroSubtitle.split('.')[0] + '.';
  const priceLine = `${ctx.price}${ctx.period}`;
  const cn = ctx.copyNodes || {};

  const base = {
    headline: ctx.heroTitle,
    subheadline: ctx.heroSubtitle,
    tagline,
    metaTitle: cn.metaTitle || `${ctx.brandName} — ${ctx.heroTitle}`,
    metaDescription: cn.metaDescription || `${ctx.heroSubtitle} Starting at ${priceLine}. ${ctx.heroCta} today.`,
    ogTitle: cn.metaTitle || `${ctx.brandName}: ${ctx.heroTitle}`,
    ogDescription: cn.metaDescription || ctx.heroSubtitle,
    twitterPost: cn.twitterPost || `Introducing ${ctx.brandName} 🚀\n\n${ctx.heroTitle}\n\n${ctx.heroSubtitle}\n\n${priceLine} · ${ctx.heroCta} → ${ctx.siteUrl}`,
    linkedInPost: cn.linkedInPost || `We're launching ${ctx.brandName}.\n\n${ctx.heroTitle}\n\n${ctx.heroSubtitle}\n\nOur ${ctx.planName} plan starts at ${priceLine} and includes:\n${ctx.features.map((f) => `• ${f}`).join('\n')}\n\n${ctx.heroCta}: ${ctx.siteUrl}`,
    emailSubject: cn.emailSubject || `${ctx.brandName} is live — ${ctx.heroTitle}`,
    emailBody: `Hi there,\n\n${ctx.heroTitle}\n\n${ctx.heroSubtitle}\n\nWhat you get with ${ctx.planName} (${priceLine}):\n${ctx.features.map((f) => `• ${f}`).join('\n')}\n\n${ctx.heroCta}: ${ctx.siteUrl}\n\n— The ${ctx.brandName} team`,
    blogLede: cn.blogLede || `Today we're launching ${ctx.brandName}. ${ctx.heroSubtitle}`,
    pressHeadline: cn.pressHeadline || `${ctx.brandName} launches ${ctx.heroTitle.toLowerCase()} for modern teams`,
    blogPost: buildBlogPost(ctx, cn),
    pressRelease: buildPressRelease(ctx, cn),
    ctaPrimary: ctx.headerCta || ctx.heroCta,
    ctaPricing: ctx.pricingCta,
    featureBullets: ctx.features,
    pricingHeadline: `${ctx.planName} — ${priceLine}`,
    siteUrl: ctx.siteUrl
  };

  return applyCopyTone(ctx, base, toneId);
}

function buildBlogPost(ctx, cn) {
  const lede = cn.blogLede || `Today we're launching ${ctx.brandName}. ${ctx.heroSubtitle}`;
  return `# ${ctx.heroTitle}\n\n${lede}\n\n## Why we built ${ctx.brandName}\n\n${ctx.heroSubtitle}\n\n## What's included\n\n${ctx.features.map((f) => `- ${f}`).join('\n')}\n\n## Pricing\n\n${ctx.planName} starts at ${ctx.price}${ctx.period}.\n\n[${ctx.heroCta}](${ctx.siteUrl})`;
}

function buildPressRelease(ctx, cn) {
  const headline = cn.pressHeadline || `${ctx.brandName} launches platform for React teams`;
  return `FOR IMMEDIATE RELEASE\n\n${headline}\n\n${ctx.brandName} today announced the launch of its visual development platform. ${ctx.heroSubtitle}\n\nThe ${ctx.planName} plan is available from ${ctx.price}${ctx.period} and includes ${ctx.features.join(', ')}.\n\nLearn more at ${ctx.siteUrl}.\n\n### About ${ctx.brandName}\n\n${ctx.brandName} helps teams ship React UI with design-code sync.\n\n### Media contact\n\npress@${ctx.brandName.toLowerCase().replace(/\s+/g, '')}.com`;
}

function buildContentMarkdown(ctx, copy) {
  return `# ${ctx.brandName} — Marketing Content Pack

Generated from your BluePainter design (hero, pricing, brand).

## Headlines
- **Primary:** ${copy.headline}
- **Subhead:** ${copy.subheadline}
- **Tagline:** ${copy.tagline}

## SEO
- **Title:** ${copy.metaTitle}
- **Description:** ${copy.metaDescription}

## Social
### Twitter / X
\`\`\`
${copy.twitterPost}
\`\`\`

### LinkedIn
\`\`\`
${copy.linkedInPost}
\`\`\`

## Email
- **Subject:** ${copy.emailSubject}
- **Body:**

\`\`\`
${copy.emailBody}
\`\`\`

## Blog post
\`\`\`markdown
${copy.blogPost}
\`\`\`

## Press release
\`\`\`
${copy.pressRelease}
\`\`\`

## CTAs
- Hero: "${copy.ctaPrimary}"
- Pricing: "${copy.ctaPricing}"

## Pricing
- **Plan:** ${ctx.planName}
- **Price:** ${ctx.price}${ctx.period}
- **Features:** ${ctx.features.join(', ')}
`;
}

function buildStandaloneLandingHtml(ctx, copy) {
  const featureCards = ctx.features.map((f) => `
        <div class="feature">
          <div class="feature-icon">✓</div>
          <p>${escapeHtml(f)}</p>
        </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(copy.metaTitle)}</title>
  <meta name="description" content="${escapeHtml(copy.metaDescription)}" />
  <meta property="og:title" content="${escapeHtml(copy.ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(copy.ogDescription)}" />
  <meta property="og:image" content="./social/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, system-ui, sans-serif; color: #0f172a; background: #f8fafc; }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; max-width: 1100px; margin: 0 auto; }
    .logo { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.1rem; }
    .logo-dot { width: 28px; height: 28px; border-radius: 6px; background: ${ctx.primaryColor}; }
    .header-cta { background: ${ctx.primaryColor}; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
    .hero { text-align: center; padding: 80px 24px 64px; background: ${ctx.heroBg}; color: #fff; }
    .hero-eyebrow { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 16px; }
    .hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; line-height: 1.15; max-width: 720px; margin: 0 auto 20px; }
    .hero p { font-size: 1.1rem; color: #94a3b8; max-width: 560px; margin: 0 auto 32px; line-height: 1.6; }
    .hero-cta { background: ${ctx.primaryColor}; color: #fff; border: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; max-width: 900px; margin: -40px auto 0; padding: 0 24px; position: relative; z-index: 1; }
    .feature { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .feature-icon { width: 32px; height: 32px; border-radius: 8px; background: ${ctx.primaryColor}22; color: ${ctx.primaryColor}; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 12px; }
    .pricing { max-width: 400px; margin: 80px auto; padding: 0 24px 80px; }
    .pricing-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
    .plan-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 8px; }
    .price { font-size: 3rem; font-weight: 800; color: #0f172a; }
    .period { font-size: 1rem; color: #64748b; font-weight: 500; }
    .pricing-features { list-style: none; margin: 24px 0; text-align: left; }
    .pricing-features li { padding: 8px 0; color: #475569; border-bottom: 1px solid #f1f5f9; }
    .pricing-features li::before { content: "✓ "; color: ${ctx.primaryColor}; font-weight: 700; }
    .pricing-cta { width: 100%; background: ${ctx.primaryColor}; color: #fff; border: none; padding: 14px; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; margin-top: 8px; }
    footer { text-align: center; padding: 32px; color: #64748b; font-size: 0.85rem; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <header class="header">
    <div class="logo"><div class="logo-dot"></div>${escapeHtml(ctx.brandName)}</div>
    <button class="header-cta">${escapeHtml(copy.ctaPrimary)}</button>
  </header>

  <section class="hero">
    <p class="hero-eyebrow">${escapeHtml(ctx.planName)} · ${escapeHtml(ctx.price)}${escapeHtml(ctx.period)}</p>
    <h1>${escapeHtml(copy.headline)}</h1>
    <p>${escapeHtml(copy.subheadline)}</p>
    <button class="hero-cta">${escapeHtml(copy.ctaPrimary)}</button>
  </section>

  <section class="features">${featureCards}
  </section>

  <section class="pricing">
    <div class="pricing-card">
      <div class="plan-label">${escapeHtml(ctx.planName)}</div>
      <div><span class="price">${escapeHtml(ctx.price)}</span><span class="period">${escapeHtml(ctx.period)}</span></div>
      <ul class="pricing-features">
        ${ctx.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('\n        ')}
      </ul>
      <button class="pricing-cta">${escapeHtml(copy.ctaPricing)}</button>
    </div>
  </section>

  <footer>© ${new Date().getFullYear()} ${escapeHtml(ctx.brandName)} · Generated with BluePainter Studio</footer>
</body>
</html>`;
}

function buildReactLandingPage(ctx, copy) {
  return `import { HeroSection } from './HeroSection.jsx';
import { PricingCard } from './PricingCard.jsx';

export default function MarketingLanding() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '${ctx.primaryColor}' }} />
          ${ctx.brandName}
        </div>
        <button style={{ background: '${ctx.primaryColor}', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          ${copy.ctaPrimary}
        </button>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 64px', gap: 48, background: '${ctx.heroBg}' }}>
        <div style={{ maxWidth: 520 }}>
          <HeroSection />
        </div>
      </section>

      <section style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '32px 48px', marginTop: -24 }}>
        ${ctx.features.map((f) => `<div style={{ flex: 1, maxWidth: 280, background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>${f}</div>`).join('\n        ')}
      </section>

      <section style={{ display: 'flex', justifyContent: 'center', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 360 }}>
          <PricingCard />
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: '0.85rem' }}>
        © ${new Date().getFullYear()} ${ctx.brandName}
      </footer>
    </div>
  );
}
`;
}

const LANDING_DEPLOY_MD = `# Deploy marketing landing to Vercel

## Static landing (fastest)

\`\`\`bash
cd landing
npx vercel --prod
\`\`\`

Upload the \`landing/\` folder — includes \`index.html\`, \`vercel.json\`, and \`social/\` images.

## React landing site

\`\`\`bash
cd landing-site
npm install && npm run build
npx vercel --prod
\`\`\`
`;

/** Render a marketing image to PNG blob via canvas. Optionally composites app screenshot. */
export function renderMarketingImage(ctx, copy, { width, height, variant = 'og', screenshotBlob = null }) {
  return new Promise((resolve) => {
    const draw = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const c = canvas.getContext('2d');

      const grad = c.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, ctx.heroBg);
      grad.addColorStop(1, ctx.primaryColor);
      c.fillStyle = grad;
      c.fillRect(0, 0, width, height);

      if (screenshotBlob) {
        const img = await blobToImage(screenshotBlob);
        const sw = width * 0.42;
        const sh = sw * (img.height / img.width);
        const sx = width - sw - width * 0.06;
        const sy = height * 0.12;
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.35)';
        c.shadowBlur = 24;
        c.beginPath();
        c.roundRect(sx, sy, sw, Math.min(sh, height * 0.76), 12);
        c.clip();
        c.drawImage(img, sx, sy, sw, Math.min(sh, height * 0.76));
        c.restore();
        c.strokeStyle = 'rgba(255,255,255,0.15)';
        c.lineWidth = 2;
        c.beginPath();
        c.roundRect(sx, sy, sw, Math.min(sh, height * 0.76), 12);
        c.stroke();
      }

      c.fillStyle = 'rgba(255,255,255,0.08)';
      c.beginPath();
      c.arc(width * (screenshotBlob ? 0.35 : 0.85), height * 0.2, height * 0.35, 0, Math.PI * 2);
      c.fill();

      const pad = width * 0.08;
      const textMax = screenshotBlob ? width * 0.48 : width - pad * 2;
      let y = height * 0.22;

      c.fillStyle = ctx.primaryColor;
      c.fillRect(pad, y, 36, 36);
      c.fillStyle = '#ffffff';
      c.font = 'bold 18px Inter, system-ui, sans-serif';
      c.fillText(ctx.brandName.charAt(0).toUpperCase(), pad + 11, y + 25);
      y += 56;

      c.fillStyle = '#94a3b8';
      c.font = '600 14px Inter, system-ui, sans-serif';
      c.fillText(`${ctx.planName} · ${ctx.price}${ctx.period}`, pad, y);
      y += 36;

      c.fillStyle = '#ffffff';
      c.font = `800 ${variant === 'linkedin' ? 36 : 42}px Inter, system-ui, sans-serif`;
      wrapText(c, copy.headline, pad, y, textMax, variant === 'linkedin' ? 44 : 50);
      y += measureWrappedHeight(c, copy.headline, textMax, variant === 'linkedin' ? 44 : 50) + 16;

      c.fillStyle = '#cbd5e1';
      c.font = '400 18px Inter, system-ui, sans-serif';
      wrapText(c, copy.subheadline.slice(0, variant === 'twitter' ? 90 : 120), pad, y, textMax, 26);

      if (variant !== 'linkedin') {
        c.fillStyle = ctx.primaryColor;
        const btnY = height - pad - 48;
        c.beginPath();
        c.roundRect(pad, btnY, 200, 44, 8);
        c.fill();
        c.fillStyle = '#ffffff';
        c.font = '600 16px Inter, system-ui, sans-serif';
        c.fillText(copy.ctaPrimary.slice(0, 18), pad + 20, btnY + 28);
      }

      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };
    draw();
  });
}

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      line = word + ' ';
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line.trim(), x, y);
}

function measureWrappedHeight(ctx, text, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = 1;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      lines += 1;
      line = word + ' ';
    } else {
      line = test;
    }
  }
  return lines * lineHeight;
}

export const IMAGE_SPECS = [
  { id: 'og', label: 'Open Graph', filename: 'og-image.png', width: 1200, height: 630 },
  { id: 'twitter', label: 'Twitter / X card', filename: 'twitter-card.png', width: 1200, height: 675 },
  { id: 'linkedin', label: 'LinkedIn banner', filename: 'linkedin-banner.png', width: 1584, height: 396 }
];

export async function downloadImage(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildMarketingStaticFileMap(nodesByFile, toneId = 'default') {
  const ctx = extractMarketingContext(nodesByFile);
  const copy = generateMarketingCopy(ctx, toneId);
  const safeName = ctx.brandName.toLowerCase().replace(/\s+/g, '-').slice(0, 40) || 'marketing-landing';

  return {
    projectName: `${safeName}-landing`,
    files: {
      'index.html': buildStandaloneLandingHtml(ctx, copy),
      'vercel.json': JSON.stringify({ rewrites: [{ source: '/(.*)', destination: '/index.html' }] }, null, 2),
      'README.md': `# ${ctx.brandName} landing\n\nStatic marketing page exported from BluePainter Studio.\n`
    }
  };
}

export async function downloadMarketingKitZip(nodesByFile, projectName = 'marketing-kit', options = {}) {
  const { toneId = 'default', screenshotBlob = null } = options;
  const ctx = extractMarketingContext(nodesByFile);
  const copy = generateMarketingCopy(ctx, toneId);
  const safeName = projectName.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'marketing-kit';
  const zip = new JSZip();

  zip.file('CONTENT.md', buildContentMarkdown(ctx, copy));
  zip.file('BLOG.md', copy.blogPost);
  zip.file('PRESS.md', copy.pressRelease);
  zip.file('copy.json', JSON.stringify({ context: ctx, copy, tone: toneId }, null, 2));

  const socialFolder = zip.folder('social');
  for (const spec of IMAGE_SPECS) {
    const blob = await renderMarketingImage(ctx, copy, {
      width: spec.width,
      height: spec.height,
      variant: spec.id,
      screenshotBlob
    });
    const buf = await blob.arrayBuffer();
    socialFolder.file(spec.filename, buf);
  }

  if (screenshotBlob) {
    const shotBuf = await screenshotBlob.arrayBuffer();
    socialFolder.file('app-screenshot.png', shotBuf);
  }

  const landingFolder = zip.folder('landing');
  landingFolder.file('index.html', buildStandaloneLandingHtml(ctx, copy));
  landingFolder.file('vercel.json', JSON.stringify({ rewrites: [{ source: '/(.*)', destination: '/index.html' }] }, null, 2));
  landingFolder.file('DEPLOY.md', LANDING_DEPLOY_MD);
  const landingSocial = landingFolder.folder('social');
  for (const spec of IMAGE_SPECS) {
    const blob = await renderMarketingImage(ctx, copy, {
      width: spec.width,
      height: spec.height,
      variant: spec.id,
      screenshotBlob
    });
    landingSocial.file(spec.filename, await blob.arrayBuffer());
  }

  const landingSrc = zip.folder('landing-site/src');
  const marketingFile = WORKSPACE_FILES.marketing;
  if (nodesByFile.marketing && marketingFile) {
    landingSrc.file(exportFilename(marketingFile.label), fixImportPaths(generateTSX(marketingFile.rootId, nodesByFile.marketing)));
  }
  ['hero', 'pricing'].forEach((fileId) => {
    const file = WORKSPACE_FILES[fileId];
    const code = fixImportPaths(generateTSX(file.rootId, nodesByFile[fileId]));
    landingSrc.file(exportFilename(file.label), code);
  });
  landingSrc.file('MarketingLanding.jsx', buildReactLandingPage(ctx, copy));
  landingSrc.file('App.jsx', `import MarketingLanding from './MarketingLanding.jsx';\nexport default function App() { return <MarketingLanding />; }\n`);
  landingSrc.file('main.jsx', `import { createRoot } from 'react-dom/client';\nimport App from './App.jsx';\ncreateRoot(document.getElementById('root')).render(<App />);\n`);
  landingSrc.file('index.css', '* { box-sizing: border-box; margin: 0; } body { font-family: Inter, system-ui, sans-serif; }\n');

  zip.file('landing-site/index.html', `<!doctype html><html><head><meta charset="UTF-8"/><title>${escapeHtml(copy.metaTitle)}</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`);
  zip.file('landing-site/package.json', JSON.stringify({
    name: `${safeName}-landing`,
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0' }
  }, null, 2));
  zip.file('landing-site/vite.config.js', `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n`);
  zip.file('landing-site/vercel.json', JSON.stringify({ rewrites: [{ source: '/(.*)', destination: '/index.html' }] }, null, 2));
  zip.file('landing-site/DEPLOY.md', LANDING_DEPLOY_MD);
  zip.file('DEPLOY.md', LANDING_DEPLOY_MD);
  zip.file('README.md', `# ${ctx.brandName} Marketing Kit

Generated from your BluePainter canvas (MarketingPage, Hero, Pricing).

## What's inside

- \`CONTENT.md\` — all copy
- \`BLOG.md\` / \`PRESS.md\` — long-form templates
- \`social/\` — OG, Twitter, LinkedIn images${screenshotBlob ? ' + app screenshot' : ''}
- \`landing/\` — static HTML + vercel.json (deploy with \`cd landing && npx vercel\`)
- \`landing-site/\` — full React project with your MarketingPage component

## Quick deploy

\`\`\`bash
cd landing
npx vercel --prod
\`\`\`

Or push \`landing-site/\` to GitHub → import at vercel.com/new
`);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.zip`;
  a.click();
  URL.revokeObjectURL(url);

  return { projectName: safeName, brandName: ctx.brandName };
}

export function getMarketingPreview(nodesByFile) {
  const ctx = extractMarketingContext(nodesByFile);
  const copy = generateMarketingCopy(ctx);
  return { ctx, copy };
}
