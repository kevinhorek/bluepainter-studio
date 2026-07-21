import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bluepainter.dev',
  integrations: [sitemap()],
  trailingSlash: 'never'
});
