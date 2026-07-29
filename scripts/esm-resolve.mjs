/**
 * Node ESM loader: resolve extensionless relative imports (Vite-style).
 * Usage: node --import ./scripts/esm-resolve.mjs <script>
 */
import { register } from 'node:module';

register('./esm-resolve-hook.mjs', import.meta.url);
