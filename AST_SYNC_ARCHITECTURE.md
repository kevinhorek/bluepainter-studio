# AST Sync Architecture

## Overview

BluePainter uses **AST-preserving bidirectional sync** to enable canvas ↔ code round-trips while preserving formatting, comments, and team structure (SPEC §2).

Both surfaces use one sync engine, `packages/shared/lib/astSyncEngine.js` (`@bluepainter/shared`):
- **Studio** imports it as an ES module through `src/utils/syncEngine.js`
- **Extension** `require()`s it from `extension/lib/syncEngine.js`, `bootstrap.js` and `babelPatch.js`

Both use **Recast + Babel** to parse/patch JSX while preserving original formatting.

## Shared Logic

Both engines implement the same contract:

### `parseTSXWithAST(code, nodesMap) → nodesMap | null`
Parse TSX code → update nodes map with latest values from source.
- Read `style` attributes (inline object expressions)
- Read text content for text/button nodes
- Read `src` for image elements
- Returns `null` on parse failure (allows fallback)

### `patchTSXWithAST(code, nodesMap) → string | null`
Patch existing TSX with updated node values while preserving formatting.
- Upsert `style` attributes
- Update text content
- Update `src` for images
- Returns `null` on patch failure (fail-loud behavior per SPEC §5)

Both use:
- **Recast** for formatting-preserving AST manipulation
- **Babel parser** with `tokens: true, ranges: true` for JSX support
- **Babel traverse** to walk JSX elements by `id` attribute
- **Babel types** to construct/modify AST nodes

## Drift Prevention

Run `npm run test:ast` to validate consistency:

```bash
npm run test:ast
```

The test:
1. Loads shared test fixtures (`extension/test-fixtures/*.tsx`)
2. Runs both engines on the same code + nodes
3. Validates parse/patch consistency
4. Checks formatting preservation on round-trip

**When to run:**
- Before PRs that touch sync logic
- Before releases
- As part of CI (future)

## Module Boundaries

| Surface | Path | Module System | Dependencies |
|---------|------|---------------|--------------|
| **Shared engine** | `packages/shared/lib/astSyncEngine.js` | ES module (also loaded with `require`) | Recast, Babel |
| **Studio wrapper** | `src/utils/syncEngine.js` | ES modules | Vite, React 19 |
| **Extension wrapper** | `extension/lib/syncEngine.js` | CommonJS | VS Code API, Node.js |

**Fallbacks:**
- Studio: `parseTSXWithRegex` for simple cases where AST fails
- Extension: `babelPatch.js` as Babel generator fallback when Recast fails

## Adding Sync Features

When adding new sync capabilities (e.g., className, data attributes):

1. **Implement it once** in `packages/shared/lib/astSyncEngine.js`
2. **Add test fixture** with new feature in `extension/test-fixtures/`
3. **Update test** in `scripts/test-ast-sync.mjs`
4. **Run `npm run test:ast`** — must pass before merge
5. **Document scope** in `AST_SCOPE.md` (what's supported)

## Known Limitations (v1)

Per SPEC §5:
- **Inline styles only** — Tailwind/CSS modules not supported
- **Simple component trees** — complex nested components skipped
- **id-based sync** — elements without `id` attributes are not editable

See `AST_SCOPE.md` for full technical scope.

## Single source of truth

There is one implementation, in `packages/shared`. Text edits are applied as source splices before the AST pass, so they never reformat a file; style and attribute edits go through Recast; structural edits (insert, remove, reorder, move into another parent) patch only the affected parents.
