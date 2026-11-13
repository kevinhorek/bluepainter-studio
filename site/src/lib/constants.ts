// Origins live in site/site.config.mjs (overridable with SITE_URL / DEMO_URL / WAITLIST_URL).
import { SITE_URL, DEMO_URL, WAITLIST_URL } from '../../site.config.mjs';

export { SITE_URL, DEMO_URL, WAITLIST_URL };
export const DEMO_APP = `${DEMO_URL}/#/app`;
export const DEMO_HOME = `${DEMO_URL}/#/home`;
export const REPO_URL = 'https://github.com/kevinhorek/bluepainter-studio';
// Placeholder shown verbatim on /privacy and /terms until a real address is set.
export const CONTACT_EMAIL = 'TODO: contact email';
export const OG_IMAGE = { width: 1200, height: 630 };

export const BRAND = {
  name: 'BluePainter',
  tagline: 'Design, code, ship — one surface.',
  description:
    'AST-preserving canvas ↔ TSX sync with Designer\'s Receipts for React teams. Validation prototype — free demo, request a pilot.'
};
