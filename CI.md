# CI Receipt Gate — Wiring Guide

## Overview

The **Designer's Receipts gate** runs automated policy checks on TSX/JSX components before merge. This guide shows pilots how to wire the gate into their CI pipeline to enforce team design standards.

---

## What it does

The receipt gate:

1. **Parses** TSX/JSX component files
2. **Evaluates** design receipts (spacing grid, contrast, CTA copy, feature count, border radius)
3. **Fails the build** on error-severity violations (e.g., WCAG contrast failures)
4. **Warns** on non-blocking issues (e.g., off-grid spacing)

**Exit codes:**
- `0` = All checks passed (warnings are allowed and don't block)
- `1` = Error-severity findings detected (blocks merge)

**SPEC reference:** §6 "Block merge on error-severity receipts"

---

## Quick start (GitHub Actions)

### 1. Copy the workflow

Copy `.github/workflows/receipt-gate.yml` to your repo's `.github/workflows/` directory.

### 2. Copy the script

Copy `scripts/check-receipts.mjs` to your repo's `scripts/` directory.

### 3. Create test fixtures (optional)

Create `extension/test-fixtures/` or `test-fixtures/` with sample components:

```tsx
// test-fixtures/PricingCard.tsx — should pass
export function PricingCard() {
  return (
    <div id="card" style={{ padding: 32, borderRadius: 12 }}>
      <button
        id="cta-button"
        style={{ background: '#2563eb', color: '#ffffff' }}
      >
        Start free trial
      </button>
    </div>
  );
}
```

```tsx
// test-fixtures/LowContrastCard.tsx — should fail (contrast error)
export function LowContrastCard() {
  return (
    <button
      id="low-contrast-btn"
      style={{ background: '#e5e7eb', color: '#ffffff' }}
    >
      Get Started
    </button>
  );
}
```

### 4. Run locally

```bash
node scripts/check-receipts.mjs test-fixtures/*.tsx
```

Expected output:
```
✓ Loaded policy from .bluepainter.json

Checking PricingCard.tsx...
  ✅ All receipts passed

Checking LowContrastCard.tsx...
  ❌ 1 error(s) — BLOCKING:
     • Low contrast ratio (1.24:1)
       Fails WCAG AA. Text might be hard to read on this button color.
       → Fix: Enhance Contrast

============================================================
RECEIPT GATE SUMMARY
============================================================
Checked: 2 file(s)
Errors (blocking): 1
Warnings (non-blocking): 0

❌ FILES WITH BLOCKING ERRORS:
   • test-fixtures/LowContrastCard.tsx (1 error(s))

❌ RECEIPT GATE FAILED
Fix error-severity findings before merge. Warnings are non-blocking.
Exit code: 1
```

### 5. Push and verify

Push a PR with TSX changes and verify the workflow runs:

```bash
git add .github/workflows/receipt-gate.yml scripts/check-receipts.mjs
git commit -m "Add receipt gate CI"
git push origin your-branch
```

Check the **Actions** tab in GitHub to see the receipt gate status.

---

## Understanding the output

The receipt gate produces clear, actionable output:

### Passing checks
```
Checking Button.tsx...
  ✅ All receipts passed
```

### Warnings (non-blocking)
```
Checking Card.tsx...
  ⚠️  2 warning(s) — non-blocking:
     • Off-grid spacing warning
       Padding of 30px is off-grid. Recommend 32px.
       → Suggestion: Snap to 32px
     • Weak CTA copy detected
       "Submit" feels generic. Suggest an action-oriented copy.
       → Suggestion: Change to "Start free trial"
```
**Result:** Warnings logged but build passes (exit code 0)

### Errors (blocking)
```
Checking Hero.tsx...
  ❌ 1 error(s) — BLOCKING:
     • Low contrast ratio (2.1:1)
       Fails WCAG AA. Text might be hard to read on this button color.
       → Fix: Enhance Contrast
```
**Result:** Build fails (exit code 1), blocks merge

---

## Configuration

### Team policy file

Create `.bluepainter.json` in your repo root to customize receipt rules:

```json
{
  "receiptPolicy": {
    "spacingGrid": 8,
    "radiusGrid": 4,
    "minContrastRatio": 4.5,
    "maxFeatureCount": 5,
    "weakCtaWords": ["submit", "click here", "send", "button", "ok", "enter"],
    "suggestedCta": "Start free trial",
    "contrastFixColor": "#1e40af"
  }
}
```

The gate automatically loads `.bluepainter.json` if present. No workflow changes needed.

---

## Receipt severity levels

| Receipt | Default | Severity | Blocks merge? |
|---------|---------|----------|---------------|
| Spacing grid | 8px | **Warning** | No |
| Border radius grid | 4px | **Warning** | No |
| Button contrast | 4.5:1 WCAG AA | **Error** | **Yes** |
| CTA copy quality | Weak words list | **Warning** | No |
| Feature count | Max 5 | **Warning** | No |

**Error-severity receipts fail the build.** Warnings are logged but do not block merge.

---

## Wiring for other CI systems

### GitLab CI

```yaml
# .gitlab-ci.yml
receipt-gate:
  stage: test
  image: node:22
  script:
    - npm install --no-save
    - node scripts/check-receipts.mjs src/components/*.tsx
  only:
    - merge_requests
  allow_failure: false
```

### CircleCI

```yaml
# .circleci/config.yml
version: 2.1
jobs:
  receipt-gate:
    docker:
      - image: cimg/node:22.0
    steps:
      - checkout
      - run: node scripts/check-receipts.mjs src/components/*.tsx
workflows:
  test:
    jobs:
      - receipt-gate
```

### Jenkins

```groovy
// Jenkinsfile
pipeline {
  agent any
  stages {
    stage('Receipt Gate') {
      steps {
        sh 'node scripts/check-receipts.mjs src/components/*.tsx'
      }
    }
  }
}
```

### Pre-commit hook (local)

```bash
# .husky/pre-commit or .git/hooks/pre-commit
#!/bin/sh
git diff --cached --name-only --diff-filter=ACM | \
  grep -E '\.(tsx|jsx)$' | \
  xargs -r node scripts/check-receipts.mjs

if [ $? -ne 0 ]; then
  echo "❌ Receipt gate failed — fix errors before commit"
  exit 1
fi
```

---

## Workflow examples

### Example 1: Check only changed files in PR (recommended)

```yaml
name: Receipt Gate

on:
  pull_request:
    paths:
      - '**/*.tsx'
      - '**/*.jsx'

jobs:
  receipt-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm install
      
      - name: Get changed files
        id: changed-files
        uses: tj-actions/changed-files@v41
        with:
          files: |
            **/*.tsx
            **/*.jsx
      
      - name: Run receipt gate on changed files
        if: steps.changed-files.outputs.any_changed == 'true'
        run: |
          echo "${{ steps.changed-files.outputs.all_changed_files }}" | \
            xargs node scripts/check-receipts.mjs
      
      - name: Summary
        if: always()
        run: |
          echo "## Receipt Gate Results" >> $GITHUB_STEP_SUMMARY
          echo "Checked changed TSX/JSX files for design policy compliance" >> $GITHUB_STEP_SUMMARY
```

### Example 2: Check entire component library

```yaml
- name: Run receipt gate on all components
  run: |
    node scripts/check-receipts.mjs src/components/**/*.tsx
```

### Example 3: Multiple directories with failure handling

```yaml
- name: Run receipt gate on all UI components
  run: |
    node scripts/check-receipts.mjs \
      src/components/**/*.tsx \
      src/pages/**/*.tsx \
      src/layouts/**/*.tsx
```

### Example 4: Custom config per environment

```yaml
- name: Run receipt gate (staging config)
  run: |
    node scripts/check-receipts.mjs \
      --config=.bluepainter.staging.json \
      src/components/*.tsx
```

---

## Troubleshooting

### "No elements with id attributes found"

**Problem:** Components must have `id` attributes on elements for receipt evaluation.

**Fix:**
```tsx
// ❌ Missing id
<button style={{ background: '#2563eb' }}>Click</button>

// ✅ With id
<button id="cta-btn" style={{ background: '#2563eb' }}>Click</button>
```

### "Module not found: receiptPolicy.js"

**Problem:** The script expects `src/utils/receiptPolicy.js` to exist.

**Fix:** Ensure the repo structure matches BluePainter's layout, or copy `src/utils/receiptPolicy.js` from this repo.

### Workflow skips receipt gate

**Problem:** Workflow triggers only on paths that match `**/*.tsx` or `**/*.jsx`.

**Fix:** If your components use different paths, update the workflow trigger:

```yaml
on:
  pull_request:
    paths:
      - 'src/**/*.tsx'
      - 'src/**/*.jsx'
      - 'components/**/*.tsx'
```

---

## Integration checklist

- [ ] Copy `.github/workflows/receipt-gate.yml` to your repo
- [ ] Copy `scripts/check-receipts.mjs` to your repo
- [ ] Copy `src/utils/receiptPolicy.js` to your repo (if not already present)
- [ ] Create `.bluepainter.json` with your team's receipt policy
- [ ] Add test fixtures to verify gate works (passing + failing)
- [ ] Run locally: `node scripts/check-receipts.mjs test-fixtures/*.tsx`
- [ ] Push a test PR and verify the workflow runs
- [ ] Ensure error-severity receipts fail the build
- [ ] Document team-specific policy in your repo's README

---

## Next steps

- **Learning loop:** Logged receipt fixes/dismissals improve team-specific suggestions over time
- **CI audit log (v2):** Merge-blocked PRs and policy violations will be logged to a team backend
- **VS Code extension (v1):** Pre-commit receipt checks with one-click fixes in the IDE

**Questions?** See [SPEC.md](./SPEC.md) §6 and [VALIDATION.md](./VALIDATION.md).
