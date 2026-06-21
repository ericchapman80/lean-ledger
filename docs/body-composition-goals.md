# Body Composition Goals

Lean Ledger should treat body composition goals as a first-class extension of the
existing Goals experience, not as a disconnected feature. This module is for
users who track weight plus body-composition signals and want success judged by
fat loss quality and lean-mass preservation, not by scale weight alone.

This document is the durable implementation spec for **Phase 1: Cut**. It is
designed to be implementation-ready and should be referenced from the roadmap
instead of rebuilding the plan from chat history.

## Summary

Phase 1 adds one active body-composition goal phase per profile:

- `cut` only
- historical phases remain queryable/viewable
- goals are unit-aware in the UI but stored canonically
- progress is derived from existing `weight_logs` and `health_metrics`
- success is judged by weight/body-fat progress **and** lean/muscle retention

This module complements the current profile goal strategy and daily macro
targets. It does not replace the existing `goalStrategy` framework.

## Product philosophy

Lean Ledger is not intended to be a simple calorie tracker or generic
weight-loss app.

The primary objective is to improve body composition while preserving or
increasing lean body mass.

Scale weight remains a useful signal, but it is not treated as the sole or
highest-value outcome.

Examples:

- reaching `200 lb` while preserving lean mass is a better outcome than
  reaching `190 lb` with significant muscle loss
- reducing body fat while maintaining strength and muscle mass is a better
  outcome than faster scale-weight reduction driven by lean tissue loss
- weight should be interpreted alongside body-fat percentage, lean mass,
  muscle mass, strength metrics, activity levels, and adherence

When metrics conflict, Lean Ledger should bias toward preserving lean mass and
long-term sustainability over aggressive short-term weight loss.

## Phase 1 scope

Supported in Phase 1:

- one active goal phase per profile
- `phase_type = 'cut'`
- goal authoring/editing
- dashboard progress cards
- trends/history detail
- completion/archive lifecycle
- baseline and completion snapshots

Not in Phase 1:

- authoring `lean_recomp` phases
- automatic macro adaptation by active phase
- multi-phase transition UI
- deep revision-history UI
- child-profile cut/recomp support

## Current tracked metrics

Already available in the app:

- Weight
- Body Fat %
- Skeletal Muscle %
- Muscle Mass
- Fat-Free Body Weight
- Visceral Fat

## Goal model

### Phase 1 — Cut

Fields:

- Goal Weight
- Goal Body Fat %
- Minimum Lean Mass
- Minimum Muscle Mass
- Target Date

Example:

- `Project 200`
  - Goal Weight: `200 lb`
  - Goal Body Fat: `12%`
  - Minimum Lean Mass: `176 lb`
  - Minimum Muscle Mass: `168 lb`

### Phase 2 — Lean Recomp

This is schema-ready only in Phase 1.

Example target shape:

- `Project Titan`
  - Goal Weight: `215 lb`
  - Goal Body Fat: `10–12%`
  - Goal Lean Mass: `190+ lb`
  - Goal Muscle Mass: `182+ lb`

Only one active phase may exist per profile.
Historical phases remain viewable after completion/archive.

## Unit handling

- Goal values automatically follow the user’s profile unit preference.
- There is no separate goal-unit setting.
- Mass is stored canonically in `kg`.
- Body-fat fields are stored as percentage numbers.
- UI display and editing always use the user’s configured units.

## Targeting rules

Body-fat goals should support either:

- a single target
- or a target range

Recommended fields:

- `goal_body_fat_percent`
- `target_body_fat_min`
- `target_body_fat_max`

Examples:

- exact cut target: `12%`
- recomposition target range: `10–12%`

For Phase 1 `cut`, require at least one meaningful target:

- `goal_weight`
- or body-fat target / range

Lean-mass and muscle-mass floors remain optional but strongly recommended.

## Calculated fields

The module should derive:

- `fatMass = weight × bodyFatPercent`
- `leanMass = weight - fatMass`
- `remainingFatToLose`
- `remainingWeightToGoal`
- `leanMassChangeSinceStart`
- `muscleMassChangeSinceStart`

Potential higher-level summary metrics:

- `musclePreservationScore`
- `leanMassRetentionPercent`
- `fatLossEfficiencyPercent`

These summary metrics may ship in Phase 1 if simple, otherwise Phase 1.5.

## Status indicators

Status colors:

- Green = on track
- Yellow = watch
- Red = losing lean mass too quickly

Recommended V1 behavior:

- `green`
  - trend is moving toward configured weight/body-fat targets
  - lean-mass floor is maintained
  - muscle-mass floor is maintained
- `yellow`
  - progress is slow/flat
  - or current values are within a warning band above the configured floors
- `red`
  - lean mass below configured minimum
  - or muscle mass below configured minimum
  - or trend suggests unacceptable lean-tissue loss

Exact thresholds should live in a helper module as named constants, not inline
UI logic.

## Success criteria

A phase is considered successful only when:

- goal weight is reached, if specified
- goal body fat is reached, if specified
- lean-mass floor is maintained
- muscle-mass floor is maintained

If a weight goal is achieved but lean-mass or muscle-mass floors are violated:

- show a warning
- do not mark the outcome as an ideal success

The UI should distinguish:

- `Completed`
- `Ideal Outcome`

## Dashboard placement

Dashboard cards:

- Weight Progress
- Fat Loss Progress
- Lean Mass Retention
- Muscle Mass Retention
- Estimated Completion Date

Example display:

- `Weight Goal: 215 → 200 (-15 lb remaining)`
- `Body Fat Goal: 17.2% → 12% (-5.2% remaining)`
- `Lean Mass Goal: Maintain ≥176 lb (Current 178.4 lb)`
- `Muscle Mass Goal: Maintain ≥168 lb (Current 169.4 lb)`

Cards should be useful even with partial data:

- if body fat is missing, still show weight progress
- if muscle mass is missing, hide only the muscle-specific card
- never fail the whole module because one optional metric is absent

## Trends placement

Trends should show:

- baseline vs current comparison
- lean-mass progression
- muscle-mass progression
- historical phase list
- active-phase detail

Phase 1 does not need a complex multi-phase comparison UI; a current active goal
view plus a historical list is sufficient.

## Baseline and completion snapshots

When a goal phase is created:

- find the newest valid body-composition snapshot available at that time
- derive baseline fat mass / lean mass / muscle mass
- freeze those baseline values on the goal row

Baseline must not drift if older health entries are edited/imported later.

When a goal phase is completed:

- capture the newest valid completion snapshot
- persist completion values on the goal row

## Estimated completion date

Only show an estimated completion date when:

- at least 3 entries exist
- there are at least 14 days of data
- recent trend direction aligns with the active goal

If shown, label it explicitly:

- `Estimated based on recent trend`

If data is sparse or direction is unstable, hide the estimate.

## Schema contract

### Table: `body_composition_goals`

Core identity / lifecycle:

- `id SERIAL PRIMARY KEY`
- `profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`
- `name TEXT NOT NULL`
- `phase_type TEXT NOT NULL CHECK (phase_type IN ('cut', 'lean_recomp'))`
- `started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `completed_at TIMESTAMPTZ`
- `archived_at TIMESTAMPTZ`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

Target fields:

- `goal_weight DOUBLE PRECISION`
- `goal_body_fat_percent DOUBLE PRECISION`
- `target_body_fat_min DOUBLE PRECISION`
- `target_body_fat_max DOUBLE PRECISION`
- `minimum_lean_mass DOUBLE PRECISION`
- `minimum_muscle_mass DOUBLE PRECISION`
- `goal_lean_mass DOUBLE PRECISION`
- `goal_muscle_mass DOUBLE PRECISION`
- `target_date TEXT`

Baseline snapshot:

- `baseline_recorded_at TEXT NOT NULL`
- `baseline_weight DOUBLE PRECISION`
- `baseline_body_fat_percent DOUBLE PRECISION`
- `baseline_fat_mass DOUBLE PRECISION`
- `baseline_lean_mass DOUBLE PRECISION`
- `baseline_muscle_mass DOUBLE PRECISION`

Completion snapshot:

- `completion_recorded_at TEXT`
- `completion_weight DOUBLE PRECISION`
- `completion_body_fat_percent DOUBLE PRECISION`
- `completion_fat_mass DOUBLE PRECISION`
- `completion_lean_mass DOUBLE PRECISION`
- `completion_muscle_mass DOUBLE PRECISION`

Revision/history support:

- `revision INTEGER NOT NULL DEFAULT 1`
- `revised_from_goal_id INTEGER REFERENCES body_composition_goals(id) ON DELETE SET NULL`

Recommended indexes:

- `idx_body_composition_goals_profile_id (profile_id)`
- `idx_body_composition_goals_active (profile_id, archived_at, completed_at)`

App-level invariant:

- only one active goal per profile where `completed_at IS NULL AND archived_at IS NULL`

Migration notes:

- additive migration only
- no backfill required
- existing profiles start with no body-composition goal rows

## API contract

### `GET /api/body-composition-goals`

Returns:

```json
{
  "activeGoal": null,
  "history": []
}
```

If an active goal exists, it should include derived current/progress/status
fields as well as persisted baseline/completion fields.

### `POST /api/body-composition-goals`

Creates a new active goal for the active profile.

Request shape:

```json
{
  "name": "Project 200",
  "phaseType": "cut",
  "goalWeight": 90.7,
  "goalBodyFatPercent": 12,
  "targetBodyFatMin": 12,
  "targetBodyFatMax": 12,
  "minimumLeanMass": 79.8,
  "minimumMuscleMass": 76.2,
  "targetDate": "2026-12-31"
}
```

Server behavior:

- resolve latest valid baseline snapshot
- store canonical-unit values
- reject if another active goal already exists
- reject child-profile creation
- validate body-fat ranges

### `PATCH /api/body-composition-goals/[id]`

Edits an active goal in place for Phase 1.

Phase 1 does not require a full revision-history UI. The schema supports future
revisioning, but edits may remain in-place initially.

### `POST /api/body-composition-goals/[id]/complete`

Marks a goal complete and captures a completion snapshot.

Request may optionally include:

```json
{
  "completedAt": "2026-11-01T09:00"
}
```

If omitted, completion time defaults to `now()`.

### `POST /api/body-composition-goals/[id]/archive`

Archives/cancels a goal phase without deleting its history.

## Returned goal object

Recommended response shape:

```json
{
  "id": 12,
  "profileId": 3,
  "name": "Project 200",
  "phaseType": "cut",
  "goalWeight": 90.7,
  "goalBodyFatPercent": 12,
  "targetBodyFatMin": 12,
  "targetBodyFatMax": 12,
  "minimumLeanMass": 79.8,
  "minimumMuscleMass": 76.2,
  "targetDate": "2026-12-31",
  "baseline": {
    "recordedAt": "2026-06-20T07:00",
    "weight": 97.6,
    "bodyFatPercent": 17.2,
    "fatMass": 16.8,
    "leanMass": 80.8,
    "muscleMass": 76.8
  },
  "current": {
    "recordedAt": "2026-06-20T07:00",
    "weight": 97.6,
    "bodyFatPercent": 17.2,
    "fatMass": 16.8,
    "leanMass": 80.8,
    "muscleMass": 76.8
  },
  "progress": {
    "remainingWeightToGoal": 6.9,
    "remainingFatToLose": 5.1,
    "leanMassChangeSinceStart": 0,
    "muscleMassChangeSinceStart": 0,
    "leanMassRetentionPercent": 100,
    "musclePreservationScore": 100,
    "fatLossEfficiencyPercent": null
  },
  "status": {
    "overall": "green",
    "weight": "yellow",
    "bodyFat": "yellow",
    "leanMass": "green",
    "muscleMass": "green",
    "warnings": []
  },
  "estimatedCompletionDate": null,
  "estimatedCompletionLabel": "Estimated based on recent trend",
  "isIdealSuccess": false,
  "completedAt": null,
  "archivedAt": null
}
```

## Guardrails

Adult profiles:

- full Phase 1 support

Teen profiles:

- allow only with age-appropriate messaging and stronger guardrails

Child profiles:

- no cut phases
- no recomp phases
- no body-fat targets

General:

- do not require every body-composition metric before showing useful progress
- do not punish users who only track weight
- do not present noisy consumer-scale readings as medical precision
- surface lean-mass / muscle-mass loss supportively, not punitively

## Test plan

### Unit tests

- fat mass / lean mass calculations
- baseline snapshot creation
- completion snapshot creation
- status color logic
- estimated completion eligibility
- missing-data fallback behavior

### Route tests

- create active goal
- reject second active goal
- reject child profile
- edit active goal
- complete goal
- archive goal

### UI tests

- dashboard cards render with full data
- dashboard cards remain partially useful with missing optional data
- lean-mass floor violation shows a warning state
- weight goal reached but lean floor violated is not shown as ideal success

## Rollout order

Recommended delivery order:

1. migration + model
2. domain helper layer
3. API routes
4. profile goal form
5. dashboard cards
6. trends/history UI
7. tests and polish

Recommended PR split:

- `PR A`: schema + helpers + API
- `PR B`: profile/dashboard/trends UI

## Future support

- allow multiple goal phases per profile over time
- keep completed phases visible while the dashboard focuses on the active phase
- adapt macro recommendations by active phase:
  - cut phase → cutting / keto-oriented macros
  - lean recomp phase → higher protein and training-day calorie increases
- integrate phase-aware macro logic into the existing `goalStrategy` framework
