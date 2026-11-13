#!/usr/bin/env node
/**
 * Render the social-card SVG sources to 1200x630 PNGs.
 * X, LinkedIn, Slack and Facebook do not render SVG og:images, so the PNGs are
 * what the meta tags point at; the SVGs stay as editable sources.
 *
 *   npm run og
 *
 * Text is rasterised with fonts installed on the machine running this script
 * (the SVGs fall back from Bricolage Grotesque to Avenir Next / Helvetica Neue / Arial),
 * so the generated PNGs are committed rather than built on deploy.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '../public');
const WIDTH = 1200;
const HEIGHT = 630;

for (const name of ['og-default', 'og-share']) {
  const svg = await readFile(join(publicDir, `${name}.svg`));
  const out = join(publicDir, `${name}.png`);
  const info = await sharp(svg, { density: 144 })
    .resize(WIDTH, HEIGHT, { fit: 'fill' })
    .flatten({ background: '#060913' })
    .png({ compressionLevel: 9, palette: false })
    .toFile(out);
  console.log(`${name}.png  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} kB`);
}
