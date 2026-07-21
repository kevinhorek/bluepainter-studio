# Search Console & indexation checklist

Production site: **https://bluepainter-launch.vercel.app**

## One-time setup (your Google account)

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property → URL prefix → `https://bluepainter-launch.vercel.app`
3. Verify via Vercel DNS or HTML file (upload if needed)
4. Sitemaps → add `https://bluepainter-launch.vercel.app/sitemap-index.xml`
5. Request indexing for:
   - `/`
   - `/pricing`
   - `/faq`
   - `/knowledge`
   - `/tools`
   - `/tools/contrast-checker`
   - `/guides/figma-dev-mode-vs-bluepainter`
   - `/guides/best-figma-to-react-tools-for-design-systems`
   - `/guides/designers-receipts-for-contrast`

## Week-1 review

- [ ] Confirm 100+ URLs discovered
- [ ] Note top impressions → human-edit those guide MD files in `site/src/content/guides/`
- [ ] Do not scale past 100 pages until 10+ pages get clicks

## Bing / AI surfaces

- Submit same sitemap in Bing Webmaster Tools
- Spot-check Perplexity / ChatGPT prompts:
  - “AST canvas code sync React”
  - “Designer’s Receipts design system”
  - “BluePainter pricing”
- Cite sources: `/faq`, `/llms.txt`, `/knowledge.json`
