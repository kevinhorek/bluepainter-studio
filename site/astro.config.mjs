import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './site.config.mjs';

export default defineConfig({
  site: SITE_URL,
  integrations: [
    sitemap({
      // Share cards are per-visitor artifacts, not content to index.
      filter: (page) => !/\/s(\/|$)/.test(new URL(page).pathname)
    })
  ],
  trailingSlash: 'never'
});
