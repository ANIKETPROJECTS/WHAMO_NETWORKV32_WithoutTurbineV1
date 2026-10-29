---
name: Hydraulic automatic overrides
description: Interaction rule for calculated hydraulic values and manual overrides
---

All auto-calculated or auto-filled parameters use a consistent visual treatment: sky-blue background (`bg-sky-50 border-sky-300`), Auto/Manual badge in the label, readOnly while auto, confirmation dialog (`requestHydraulicOverride`) before manual override. The pattern has been extended to manningsN, pipeE (material-derived), shape A column (bidirectional, no dialog), and PCHAR generators (info banner only).

**Why:** These values are derived from pipe geometry/material inputs, so silently accepting a typed replacement can make the network inconsistent without the user realizing the dependency was disabled.

**How to apply:**
- `manualHydraulicOverrides` in PropertiesPanel tracks `celerity`, `friction`, `manningsN`, `pipeE` — all reset on element change and on material change (applyMaterial/applyStMaterial).
- `materialApplied`, `manningsNIsAuto`, `pipeEIsAuto` are computed flags (after the frictionIsAuto block).
- `requestHydraulicOverride` and `acceptHydraulicOverride` handle all four field types; `hydraulicFieldDescription` is dynamic (material-source vs pipe-param-source).
- Shape A column: shows Auto badge + sky-blue bg when D is valid; no readOnly/dialog since A↔D is bidirectional.
- PumpCurvePanel: sky-blue "Automatically generated" banner appears when `generated !== null`.
- Pipe Material sections (conduit + surge tank): sky-blue banner appears when `mat && (manningsNIsAuto || pipeEIsAuto)`.