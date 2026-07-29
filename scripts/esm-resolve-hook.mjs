import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EXTS = ['.js', '.jsx', '.mjs', '.ts', '.tsx', '.json'];

function tryResolve(basePath) {
  if (existsSync(basePath) && !basePath.endsWith('/')) return basePath;
  for (const ext of EXTS) {
    const withExt = basePath + ext;
    if (existsSync(withExt)) return withExt;
  }
  for (const ext of EXTS) {
    const index = join(basePath, 'index' + ext);
    if (existsSync(index)) return index;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const parent = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
    const base = specifier.startsWith('/')
      ? specifier
      : join(dirname(parent), specifier);

    if (!extname(base) || !existsSync(base)) {
      const resolved = tryResolve(base);
      if (resolved) {
        return nextResolve(pathToFileURL(resolved).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}

// Ensure JSX can be loaded when used from Node scripts (strip JSX via Vite elsewhere).
export async function load(url, context, nextLoad) {
  if (url.endsWith('.jsx')) {
    const path = fileURLToPath(url);
    let source = readFileSync(path, 'utf8');
    // Minimal transform: not used for App.jsx in Node tests; utils are .js only.
    return { format: 'module', source, shortCircuit: true };
  }
  return nextLoad(url, context);
}
