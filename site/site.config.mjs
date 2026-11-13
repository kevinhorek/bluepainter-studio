/**
 * Single source of truth for the marketing site's origins.
 * Imported by astro.config.mjs (sitemap), src/lib/constants.ts (canonicals, og:url,
 * robots.txt, llms.txt, knowledge.json) and the repo-root content scripts.
 *
 * Override at build time, e.g. when the custom domain goes live:
 *   SITE_URL=https://bluepainter.dev npm run build
 */
const env = typeof process !== 'undefined' && process.env ? process.env : {};
const origin = (value, fallback) => String(value || fallback).trim().replace(/\/+$/, '');

/** Public origin of this site (no trailing slash). */
export const SITE_URL = origin(env.SITE_URL, 'https://bluepainter-launch.vercel.app');

/** Origin of the Studio demo app (no trailing slash). */
export const DEMO_URL = origin(env.DEMO_URL, 'https://bluepainter-studio.vercel.app');

/** Waitlist endpoint. Same-origin by default: site/api/waitlist.js deploys with the site. */
export const WAITLIST_URL = String(env.WAITLIST_URL || '/api/waitlist').trim();
