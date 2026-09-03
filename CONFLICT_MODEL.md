# Conflict Model — BluePainter v1

This document defines how BluePainter handles conflicts between canvas edits, manual code edits, and git operations (SPEC.md §5 requirement).

## Overview

BluePainter maintains **three sources of truth**:

1. **Canvas state** — in-memory node map (browser or VS Code webview)
2. **Code file** — TSX/JSX file on disk
3. **Git history** — version control state

Conflicts arise when these sources diverge. This document describes how BluePainter detects and resolves conflicts in v1.

---

## Conflict Scenarios

### 1. Canvas → Code (User edits canvas, writes to file)

**Flow:**
1. User edits a node on the canvas (e.g., changes button text or color)
2. BluePainter calls `patchTSXWithAST(existingCode, nodesMap)` to apply the change
3. The patched code replaces the file content

**Conflict:** None — this is the **happy path**. The canvas is the source of truth, and code is updated to match.

**Failure modes:**
- **AST patch fails** (malformed JSX, missing `id`, unsupported syntax):
  - v1: Show error message, do **not** silently fall back to template generation
  - User must fix the code or simplify the structure
- **File is read-only or externally locked**:
  - VS Code: Edit operation fails with error message
  - Web app: Not applicable (no real file write)

---

### 2. Code → Canvas (User edits code manually, canvas syncs)

**Flow:**
1. User edits the TSX file directly in the code editor
2. BluePainter detects `onDidChangeTextDocument` (VS Code) or manual sync trigger (web app)
3. `parseTSXWithAST(code, nodesMap)` extracts updated properties into the canvas node map
4. Canvas re-renders with the new state

**Conflict:** None — this is also a **happy path**. The code is the source of truth, and canvas updates to match.

**Failure modes:**
- **Parse fails** (invalid JSX, missing closing tags):
  - v1: Log warning, canvas shows stale state
  - User must fix syntax errors before canvas syncs
- **`id` removed or changed**:
  - Node disappears from canvas or becomes orphaned
  - User must restore `id` or bootstrap a new node map

---

### 3. Simultaneous Canvas + Code Edits (Conflict!)

**Scenario:** User edits the canvas (e.g., changes button color), but the code file has **unsaved or external changes** (e.g., another editor window, git pull, file watcher).

**Detection:**
- VS Code: Document version mismatch or dirty state
- Web app: User manually edited code panel while canvas state is dirty

**v1 Resolution: Last-Write-Wins with User Prompt**

1. **Canvas edit triggers write-back**:
   - BluePainter detects the file has changed since the last canvas sync
   - **Prompt user**:
     ```
     The file has been modified externally.

     [Overwrite with canvas] [Discard canvas changes] [Cancel]
     ```

2. **User choice:**
   - **Overwrite with canvas**: Canvas state wins, code changes are lost
   - **Discard canvas changes**: Re-sync canvas from code, canvas changes are lost
   - **Cancel**: No action, user manually resolves (e.g., save code first, then apply canvas edits)

**Logging:** All conflict resolutions are logged to the learning loop:
```json
{
  "type": "conflict_resolved",
  "timestamp": 1693881234567,
  "data": {
    "resolution": "overwrite_with_canvas",
    "fileName": "PricingCard.tsx",
    "nodeId": "cta-button"
  }
}
```

---

### 4. Git Merge Conflicts

**Scenario:** User is on a branch, performs canvas edits, then pulls/merges from `main` with conflicting changes to the same TSX file.

**v1 Behavior:**

1. **Git conflict markers appear** in the code:
   ```tsx
   <<<<<<< HEAD
   <button id="cta-button" style={{ background: '#ff0000' }}>
   =======
   <button id="cta-button" style={{ background: '#0000ff' }}>
   >>>>>>> main
   ```

2. **BluePainter cannot parse** files with conflict markers:
   - AST parse fails
   - Canvas shows **"Parse error: resolve git conflicts first"**
   - User must manually resolve conflicts in the code editor

3. **After resolution:**
   - User resolves conflict markers
   - Saves the file
   - BluePainter re-syncs canvas from the resolved code

**No automatic merge:** BluePainter v1 does **not** attempt to auto-merge canvas state with git conflict branches. The user must resolve conflicts at the code level.

---

## Conflict Prevention

### Best Practices

1. **Use version control** — commit canvas changes frequently
2. **One editor at a time** — avoid editing the same file in multiple VS Code windows or external editors
3. **Pull before canvas editing** — sync git state before starting visual edits
4. **Stable `id` attributes** — do not rename `id` attributes between canvas and code edits

### VS Code Extension Safeguards

- **Auto-sync on save**: When the user saves the file manually, canvas re-syncs from code (code wins)
- **Debounced sync**: Code changes trigger canvas sync after 350ms delay to avoid flicker
- **Skip parse flag**: Write-back sets `skipParse = true` for 250ms to prevent circular updates

---

## Future Enhancements (v2+)

### Planned for v2
- **Three-way merge**: Compare canvas state, current code, and last-synced code to intelligently merge changes
- **Diff view**: Show side-by-side canvas vs. code changes before applying
- **Conflict annotations**: Highlight conflicting nodes on canvas with visual indicators

### Explicitly Deferred
- **Operational transform** (real-time collaborative editing) — not in scope for single-user v1
- **Auto-rebase** on git pull — too risky for v1, manual resolution required

---

## Testing Conflict Scenarios

### Manual Test: Simultaneous Edit

1. Open a TSX file in VS Code with BluePainter extension
2. Edit a button on the canvas (e.g., change text to "Buy Now")
3. **Before writing back**, manually edit the same button in the code editor (e.g., change text to "Get Started")
4. Click "Write to file" in BluePainter
5. **Expected**: Prompt appears asking which version to keep

### Manual Test: Git Conflict

1. Create a branch, edit a component on canvas, commit
2. Switch to `main`, edit the same component's code differently, commit
3. Merge the branch into `main` → git conflict
4. Open the file in VS Code with BluePainter
5. **Expected**: Canvas shows parse error, user must resolve conflict markers

---

## Summary Table

| Conflict Type | v1 Resolution | User Action Required |
|---------------|---------------|----------------------|
| Canvas → Code (clean) | Canvas wins | None |
| Code → Canvas (clean) | Code wins | None |
| Simultaneous edits | Last-write-wins with prompt | Choose which version to keep |
| Git merge conflict | Manual resolution required | Resolve conflict markers in code |
| AST patch fails | Fail-loud (error message) | Fix code or simplify structure |

---

*Last updated: September 2026*
