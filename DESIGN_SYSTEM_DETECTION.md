# Design System Detection

## Overview

BluePainter includes lightweight detection of monorepo workspaces and design system packages to tailor the "edit known components" experience.

**SPEC §12 requirement**: Detect workspace roots / packages that look like design systems to help users work with component libraries more effectively.

---

## Detection Signals

### Monorepo Detection

BluePainter detects monorepo workspaces by checking for:

- `package.json` with `workspaces` field
- `lerna.json` (Lerna)
- `pnpm-workspace.yaml` (pnpm)
- `turbo.json` (Turborepo)
- `nx.json` (Nx)

### Design System Detection

A package is identified as a design system if it matches one or more of:

**Package name patterns:**
- Contains `design-system` (e.g., `@acme/design-system`)
- Scoped package with `ui`, `components`, or `design` (e.g., `@company/ui`)
- Starts with `ui-` (e.g., `ui-library`)
- Starts with `component-library`
- Ends with `-ui` (e.g., `acme-ui`)
- Contains `react-components`
- Contains `design-tokens`

**Folder structure:**
- `src/components/` directory exists
- `components/` directory exists
- `packages/components/` directory exists (monorepo)
- `tokens/` or `design-tokens/` directory exists
- `.storybook/` configuration exists

### Confidence Levels

| Confidence | Criteria |
|------------|----------|
| **High** | Package name matches pattern AND components directory exists |
| **Medium** | Package name matches pattern OR components directory exists |
| **Low** | Only secondary indicators (tokens, Storybook, etc.) |
| **None** | No design system indicators found |

---

## Extension Behavior

When a design system is detected, the VS Code extension:

1. **Logs detection** to the output channel (BluePainter)
2. **Shows recommendations** as info messages (can be dismissed)
3. **Suggests .bluepainter.json** for monorepo packages with multiple component paths
4. **Lists known component files** (Button, Card, Input, etc.) for quick access

### Example Output

```
BluePainter: Design system detected (high confidence)
  - package name: @acme/design-system
  - src/components directory
  - Storybook config

Recommendations:
  - Use .bluepainter.json to customize receipt policy per package.
  - Storybook detected. Consider syncing component stories with BluePainter canvas states.
```

---

## Studio Behavior

The Studio web app uses design system detection to:

1. **Suggest component templates** when importing from Figma
2. **Show design system tips** in the dashboard welcome screen
3. **Highlight monorepo-specific workflows** in validation mode

---

## API Reference

### Studio (Browser)

```javascript
import { detectWorkspaceType, findComponentFiles, getWorkspaceRecommendations } from './utils/designSystemDetection.js';

const packageJson = { name: '@acme/design-system', workspaces: ['packages/*'] };
const folderStructure = ['src/components', '.storybook', 'lerna.json'];

const detection = detectWorkspaceType(packageJson, folderStructure);
// {
//   isMonorepo: true,
//   isDesignSystem: true,
//   confidence: 'high',
//   indicators: ['lerna.json', 'package name: @acme/design-system', 'components directory'],
//   workspaceRoot: true,
//   componentPaths: ['src/components']
// }

const recommendations = getWorkspaceRecommendations(detection);
// [
//   { type: 'info', message: 'Design system detected. BluePainter works best with stable id attributes on components.' },
//   { type: 'tip', message: 'Found 1 component path(s). Use .bluepainter.json to customize receipt policy per package.' }
// ]
```

### Extension (Node.js)

```javascript
const { detectWorkspaceType, findComponentFiles, getWorkspaceRecommendations } = require('./lib/designSystemDetection');

const workspaceRoot = '/path/to/workspace';
const detection = detectWorkspaceType(workspaceRoot);

if (detection.isDesignSystem) {
  const components = findComponentFiles(workspaceRoot, detection.componentPaths);
  // [
  //   { path: 'src/components/Button.tsx', name: 'Button', fullPath: '/path/to/workspace/src/components/Button.tsx' }
  // ]
}
```

---

## Configuration

Design system detection respects `.bluepainter.json` settings:

```json
{
  "receiptPolicy": { ... },
  "designSystem": {
    "enabled": true,
    "componentPaths": ["src/components", "packages/ui/src"],
    "ignorePatterns": ["**/*.test.tsx", "**/*.stories.tsx"]
  }
}
```

**Note:** The `designSystem.componentPaths` override is optional. If not specified, BluePainter auto-detects component paths.

---

## Use Cases

### 1. Monorepo with Multiple Design Systems

```
my-monorepo/
├── packages/
│   ├── design-system/   ← detected as design system
│   │   ├── src/components/
│   │   └── .bluepainter.json
│   ├── marketing-ui/    ← detected as design system
│   │   ├── components/
│   │   └── .bluepainter.json
│   └── app/             ← not detected as design system
└── lerna.json
```

**Behavior**: Extension shows workspace-level info message on first open, then applies per-package receipt policies from `.bluepainter.json` files.

### 2. Standalone Design System

```
acme-design-system/
├── src/components/
├── tokens/
├── .storybook/
├── package.json  ← name: "@acme/design-system"
└── .bluepainter.json
```

**Behavior**: Extension detects high-confidence design system and shows Storybook tip.

### 3. Regular App (No Detection)

```
my-app/
├── src/
│   ├── pages/
│   └── features/
└── package.json  ← name: "my-app"
```

**Behavior**: No design system detection. BluePainter works normally with any TSX files containing `id` attributes.

---

## Limitations

- **Does not parse workspace globs**: If `package.json` has `workspaces: ["packages/*"]`, BluePainter does not expand the glob. It only checks for existence of the `workspaces` field.
- **No network requests**: Detection is entirely local. It does not fetch remote package registries.
- **Single-level component detection**: Only checks immediate children of `src/components` or `components`. Does not recursively scan nested folders (to avoid performance impact).

---

## Disabling Detection

To disable design system detection in the extension:

1. Open VS Code settings
2. Search for "BluePainter"
3. Uncheck **"bluepainter.enableDesignSystemDetection"**

Or add to `.vscode/settings.json`:

```json
{
  "bluepainter.enableDesignSystemDetection": false
}
```

---

*Last updated: September 2026*
