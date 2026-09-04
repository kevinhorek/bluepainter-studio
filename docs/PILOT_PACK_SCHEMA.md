# Pilot Pack Export Schema

**Version:** 1.0  
**SPEC Reference:** §8 — Success metrics & kill criteria

The pilot pack export is a comprehensive JSON file containing all validation session data, activation metrics, and kill criteria analysis for product go/no-go decisions.

---

## Export Types

BluePainter exports two types of JSON files:

1. **Pilot Pack** (`pilot-pack`) — Comprehensive export for product validation (this doc)
2. **Validation Session** (`validation-session`) — Single-session detailed export

Both follow the same base schema with different focus areas.

---

## Pilot Pack JSON Structure

```json
{
  "exportType": "pilot-pack",
  "exportedAt": "2026-09-04T18:45:00.000Z",
  "specVersion": "2026-07-SPEC-§8",
  "surface": "web-studio",
  "context": {
    "facilitatorMode": true,
    "sessionUrl": "https://bluepainter-studio.vercel.app/?facilitator=1#/app",
    "userAgent": "Mozilla/5.0..."
  },
  
  "executiveSummary": {
    "totalSessions": 8,
    "recommendation": "GO | CONTINUE | NO-GO",
    "reason": "Build v1 extension — enough interest and pilot willingness.",
    "toplineMetrics": {
      "veryInterested": "3/3 target",
      "pilotWilling": "2 yes, 1 maybe",
      "activationRate": "75.0%",
      "receiptActionsPerSession": "5.2"
    }
  },
  
  "killCriteria": {
    "sessionsCompleted": 8,
    "sessionsTarget": 8,
    "veryInterested": 3,
    "veryTarget": 3,
    "pilotYes": 2,
    "pilotMaybe": 1,
    "meetsKillCriteria": true,
    "decision": "GO",
    "decisionReason": "Build v1 extension — enough interest and pilot willingness."
  },
  
  "activationMetrics": {
    "sessionsWithActivation": 6,
    "totalSessions": 8,
    "activationRate": "75.0%",
    "canvasToCodeRoundTrips": 12,
    "codeToCanvasRoundTrips": 10,
    "receiptActionsTotal": 42,
    "receiptFixesApplied": 28,
    "receiptsDismissed": 14
  },
  
  "sessionDetails": [
    {
      "sessionNumber": 1,
      "timestamp": "2026-09-01T14:30:00.000Z",
      "interest": "very",
      "pilot": "yes",
      "role": "developer",
      "comment": "Love the AST sync — formatting preserved!",
      "activationComplete": true,
      "receiptActions": 6,
      "roundTrips": {
        "canvas": 2,
        "code": 1
      }
    }
  ],
  
  "interestBreakdown": {
    "very": 3,
    "somewhat": 4,
    "not": 1,
    "byRole": {
      "developer": 5,
      "designer": 2,
      "hybrid": 1
    }
  },
  
  "pilotWillingness": {
    "yes": 2,
    "maybe": 4,
    "no": 2
  },
  
  "learningLoop": {
    "totalEvents": 124,
    "summary": {
      "totalEvents": 124,
      "fixesApplied": 28,
      "rulesDismissed": 14,
      "roundTripsCanvas": 12,
      "roundTripsCode": 10,
      "policyUpdates": 3
    },
    "top10Events": [...],
    "exportedAt": "2026-09-04T18:45:00.000Z"
  },
  
  "teamPolicy": {
    "spacingGrid": 8,
    "radiusGrid": 4,
    "minContrastRatio": 4.5,
    "maxFeatureCount": 5,
    "weakCtaWords": ["submit", "click here", "send"],
    "suggestedCta": "Start free trial",
    "contrastFixColor": "#1e40af"
  },
  
  "nextSteps": [
    "✓ Build v1 extension — enough interest and pilot willingness",
    "Set up pilot repo access for teams who said 'yes'",
    "Schedule onboarding calls with pilot teams",
    "Instrument extension for production learning loop"
  ],
  
  "references": {
    "spec": "SPEC.md §8 — Success metrics & kill criteria",
    "validation": "VALIDATION.md — Full validation checklist",
    "pilot": "PILOT.md — Pilot team quick-start guide",
    "selfPilot": "SELF_PILOT.md — 30-45 min self-guided pilot walkthrough",
    "facilitatorChecklist": "scripts/pilot-dry-run.md — Printable facilitator session checklist"
  }
}
```

---

## Field Definitions

### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `exportType` | string | Always `"pilot-pack"` for this export type |
| `exportedAt` | ISO 8601 | Timestamp when export was generated |
| `specVersion` | string | SPEC reference: `"2026-07-SPEC-§8"` |
| `surface` | string | Source surface: `"web-studio"` or `"vscode-extension"` |
| `context` | object | Session context metadata |

### Context Fields

| Field | Type | Description |
|-------|------|-------------|
| `facilitatorMode` | boolean | Was facilitator mode (`?facilitator=1`) active? |
| `sessionUrl` | string | Full URL where session was run |
| `userAgent` | string | Browser user agent string |

### Executive Summary

| Field | Type | Description |
|-------|------|-------------|
| `totalSessions` | number | Number of validation sessions completed |
| `recommendation` | string | `"GO"`, `"CONTINUE"`, or `"NO-GO"` |
| `reason` | string | Human-readable explanation of recommendation |
| `toplineMetrics` | object | High-level KPIs for quick review |

### Topline Metrics

| Field | Type | Description |
|-------|------|-------------|
| `veryInterested` | string | Format: `"3/3 target"` (current/target) |
| `pilotWilling` | string | Format: `"2 yes, 1 maybe"` |
| `activationRate` | string | Format: `"75.0%"` (sessions with complete activation) |
| `receiptActionsPerSession` | string | Format: `"5.2"` (average fixes + dismisses per session) |

### Kill Criteria

| Field | Type | Description |
|-------|------|-------------|
| `sessionsCompleted` | number | Sessions run so far |
| `sessionsTarget` | number | Target sessions (default: 8) |
| `veryInterested` | number | "Very interested" responses |
| `veryTarget` | number | Target "very interested" (default: 3) |
| `pilotYes` | number | "Yes" to pilot willingness |
| `pilotMaybe` | number | "Maybe" to pilot willingness |
| `meetsKillCriteria` | boolean | True if GO criteria met |
| `decision` | string | `"GO"`, `"CONTINUE"`, or `"NO-GO"` |
| `decisionReason` | string | Explanation of decision |

### Activation Metrics

| Field | Type | Description |
|-------|------|-------------|
| `sessionsWithActivation` | number | Sessions where user completed both round-trips |
| `totalSessions` | number | Total sessions logged |
| `activationRate` | string | Percentage of sessions with complete activation |
| `canvasToCodeRoundTrips` | number | Total canvas → code syncs across all sessions |
| `codeToCanvasRoundTrips` | number | Total code → canvas syncs across all sessions |
| `receiptActionsTotal` | number | Total receipt fixes + dismisses |
| `receiptFixesApplied` | number | Total receipt fixes applied |
| `receiptsDismissed` | number | Total receipts dismissed |

### Session Details

Array of objects, one per validation session:

| Field | Type | Description |
|-------|------|-------------|
| `sessionNumber` | number | Sequential session index (1-based) |
| `timestamp` | ISO 8601 | When session was logged |
| `interest` | string | `"very"`, `"somewhat"`, or `"not"` |
| `pilot` | string | `"yes"`, `"maybe"`, or `"no"` |
| `role` | string | User role: `"developer"`, `"designer"`, `"hybrid"` |
| `comment` | string | Free-form feedback from user |
| `activationComplete` | boolean | Did user complete both round-trips? |
| `receiptActions` | number | Total fixes + dismisses in this session |
| `roundTrips.canvas` | number | Canvas → code syncs in this session |
| `roundTrips.code` | number | Code → canvas syncs in this session |

### Interest Breakdown

| Field | Type | Description |
|-------|------|-------------|
| `very` | number | "Very interested" count |
| `somewhat` | number | "Somewhat interested" count |
| `not` | number | "Not really interested" count |
| `byRole` | object | Interest breakdown by user role |

### Pilot Willingness

| Field | Type | Description |
|-------|------|-------------|
| `yes` | number | Would pilot on real codebase |
| `maybe` | number | Might pilot, depends on setup |
| `no` | number | Would not pilot |

### Learning Loop

| Field | Type | Description |
|-------|------|-------------|
| `totalEvents` | number | Total learning loop events logged |
| `summary` | object | Aggregated statistics from learning loop |
| `top10Events` | array | Most recent 10 events (for debugging) |
| `exportedAt` | ISO 8601 | When learning loop was exported |

### Team Policy

Current receipt policy configuration. See `PILOT.md` §5 for field definitions.

### Next Steps

Array of strings with recommended actions based on kill criteria and activation metrics.

Examples:
- `"✓ Build v1 extension — enough interest and pilot willingness"`
- `"Run 2 more sessions"`
- `"Target 1 more 'very interested' response"`
- `"⚠ Low activation rate — improve demo script or onboarding flow"`

### References

Object with keys pointing to relevant documentation files:
- `spec`: SPEC.md §8
- `validation`: VALIDATION.md
- `pilot`: PILOT.md
- `selfPilot`: SELF_PILOT.md (new in v0.2)
- `facilitatorChecklist`: scripts/pilot-dry-run.md (new in v0.2)

---

## Usage

### Exporting a Pilot Pack

1. Open facilitator mode: `?facilitator=1#/app`
2. Run 8+ validation sessions
3. Click `···` → **Session scorecard**
4. Click **📦 Export pilot pack**
5. Save JSON file to `validation-exports/` folder

### Analyzing the Export

```bash
# Pretty-print for review
cat bluepainter-pilot-pack-2026-09-04.json | jq .

# Extract executive summary
cat bluepainter-pilot-pack-2026-09-04.json | jq .executiveSummary

# Check kill criteria
cat bluepainter-pilot-pack-2026-09-04.json | jq .killCriteria

# List all session comments
cat bluepainter-pilot-pack-2026-09-04.json | jq '.sessionDetails[].comment'

# Calculate activation rate
cat bluepainter-pilot-pack-2026-09-04.json | jq '.activationMetrics.activationRate'
```

### Decision Matrix

| Recommendation | Condition | Next Steps |
|----------------|-----------|------------|
| **GO** | ≥3 "very interested" + ≥1 pilot yes | Build v1 extension |
| **CONTINUE** | <8 sessions OR <3 "very interested" | Run more sessions |
| **NO-GO** | ≥8 sessions + <3 "very interested" | Review kill criteria, consider pivot |

---

## Schema Validation

To validate a pilot pack export:

```bash
cd /workspace
node test-fixtures/validate-pilot-pack-schema.js bluepainter-pilot-pack-2026-09-04.json
```

---

## Related Files

- `src/utils/validationExport.js` — Export generation logic
- `src/utils/sessionScorecard.js` — Scorecard calculation
- `src/utils/feedbackStorage.js` — Session metrics tracking
- `src/utils/learningLoop.js` — Learning loop event logging
- `SPEC.md` §8 — Success metrics & kill criteria
- `VALIDATION.md` — Full validation checklist
- `SELF_PILOT.md` — Self-guided pilot walkthrough
- `scripts/pilot-dry-run.md` — Facilitator session checklist

---

**Last updated:** 2026-09-04 (v0.2 — pilot pack enhancements)
