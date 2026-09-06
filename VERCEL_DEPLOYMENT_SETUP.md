# Vercel Deployment Setup for bluepainter-launch

## Current Status

✅ **PR #167 merged** - Open-core pricing added to `site/src/pages/pricing.astro`
✅ **GitHub Actions workflow created** - `.github/workflows/deploy-astro-site.yml`
✅ **Site built locally** - `site/dist/pricing/index.html` contains Free/$29 Pro/Enterprise

⚠️ **Deployment blocked** - GitHub secrets not configured

## Required GitHub Secrets

Add these secrets to the repository at:
https://github.com/kevinhorek/bluepainter-studio/settings/secrets/actions

### Secrets needed:

1. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Create a new token with deployment permissions

2. **VERCEL_ORG_ID**
   - Value: `team_q58iWIzlCLCJL1SIeUtCVJ3W`

3. **VERCEL_PROJECT_ID_LAUNCH**
   - Value: `prj_bKUbk4tSzZsnT21YKIbSjhZ9CLPn`

## Manual Deployment Option

If you want to deploy immediately without setting up secrets:

```bash
cd site
npm install
npm run build
npx vercel --prod --token YOUR_VERCEL_TOKEN
```

Or link the project to GitHub through Vercel dashboard for automatic deploys.

## Workflow Details

The workflow (`.github/workflows/deploy-astro-site.yml`):
- Triggers on pushes to `main` that change `site/**`
- Can be manually triggered via workflow_dispatch
- Deploys to `bluepainter-launch.vercel.app`

## Testing

Once secrets are added, the workflow will run automatically on the next `site/` change. You can also trigger it manually from:
https://github.com/kevinhorek/bluepainter-studio/actions/workflows/deploy-astro-site.yml
