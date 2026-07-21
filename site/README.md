# BluePainter distribution site (Astro)

Hybrid launch layer — crawlable pages for pricing, FAQ, free tools, pSEO guides, knowledge catalog, and share cards. The interactive product remains the Vite demo.

## Develop

```bash
# from repo root
npm run site:guides
cd site
npm install
npm run dev
```

## Deploy (second Vercel project)

1. Import this repo in Vercel
2. Set **Root Directory** to `site`
3. Framework: Astro
4. Env: `WAITLIST_WEBHOOK` (optional ESP)
5. Assign domain (e.g. `bluepainter.dev`)

API routes live in `site/api/` for this project. The main demo also has `api/waitlist.js` at repo root.

## Indexation test (pSEO)

1. Deploy first 100 guides
2. Submit sitemap in Google Search Console
3. Human-edit top 20 performers before scaling templates
