---
title: 'Map Creator'
summary: 'Full-screen container for map creation and editing. Displayed when simulation is idle, hidden when simulation starts.'
source_paths:
  - 'src/hud/containers/map-creator.tsx'
last_updated: '2026-01-04'
owner: 'Mateusz Nędzi'
tags: ['module', 'hud', 'react', 'ui', 'container']
links:
  parent: '../index.md'
  siblings:
    - './fleet-creator.md'
    - './play-controls.md'
    - './camera-help.md'
---

# Map Creator

> **Purpose:** Configure and generate a new procedural map before starting the simulation. Exposes all `map.create` parameters, offers presets, and sends the creation request to the server.

## Context & Motivation

The Map Creator panel provides a dedicated workspace for users to create and configure simulation maps before starting a simulation. It occupies the left half of the screen when visible.

## Responsibilities & Boundaries

- In-scope: Parameter form (dimensions, structure, densities, connectivity, road composition, seed), presets, the Create Map action, map export functionality, and map import functionality.
- Out-of-scope: Procedural generation logic (server-side), three.js scene mutation (handled by view/engine).

## Architecture & Design

- Built on `HudContainer` with `closable={false}`.
- Uses Shadcn `Input`, `Slider`, `Button`, `Label` for a simple, skimmable form.
- Visibility is controlled by playback state: visible when `idle`/`stopped`, hidden when `playing`/`paused`.
- Presets:
  - Dense urban: `{ num_major_centers: 5, local_density: 80, rural_density: 0, gridness: 0.7, ring_road_prob: 1 }`
  - Sparse rural: `{ num_major_centers: 2, local_density: 20, rural_density: 10, gridness: 0, rural_settlement_prob: 0.3 }`

### 2D Graph View (Canvas)

- When the server responds with `map.created`, the panel renders a 2D graph preview (nodes + edges) using a canvas-based renderer (`react-konva`).
- The preview supports:
  - Pan (drag the canvas)
  - Zoom (mouse wheel; zooms towards the cursor)
  - Auto-fit to panel with padding and warm, readable styling for road classes
- Data flow: `net.on('map.created', setMapData)` → `GraphCanvas` → draw nodes/edges.
- Rendering is strictly HUD-side and does not mutate three.js scenes, preserving IO → Domain → View boundaries.

### Parameters

- Dimensions: `map_width`, `map_height`
- Structure: `num_major_centers`, `minor_per_major`, `center_separation`, `urban_sprawl`
- Densities: `local_density`, `rural_density`
- Connectivity: `intra_connectivity` (0–1 slider), `inter_connectivity` (>=1)
- Road composition: `arterial_ratio`, `gridness`, `ring_road_prob`, `highway_curviness`, `rural_settlement_prob` (all 0–1 sliders)
- Randomness: `seed`

## Public API / Usage

```tsx
import { MapCreator } from '@/hud/containers/map-creator';

<MapCreator />
```

## Implementation Notes

- Sends `net.sendAction('map.create', params)`; button disabled when simulation is not `idle`/`stopped`.
- No persistence of form values by design (explicit request). Defaults match the API example.
- Outgoing action visible in Network Log panel.
- Graph preview colors follow the warm palette; stroke width reflects `road_class` tier and `lanes`.
- The preview overlays counts (`generated_nodes`, `generated_edges`, `generated_sites`) for quick verification.
- `map.created` events may omit newer fields (e.g., gas station ranges); the container defensively merges incoming data with the last known params/defaults so the form and graph stay render-safe during schema evolution.

### Export Functionality

- Export section appears below the Create Map button and is only visible when a map has been created.
- User can specify a custom filename via an input field (auto-populated as `map_${width}x${height}_${seed}` when map is created).
- Sends `net.sendAction('map.export', { filename })` with the user-provided filename.
- Server responds with `map.exported` signal containing base64-encoded file content.
- Client decodes base64, creates a Blob, and triggers browser download of the `.smap` file.
- Object URL is cleaned up immediately after download to prevent memory leaks.
- Export state (`exporting`) prevents double-clicks during the export/download process.
- Export button is disabled if filename is empty or only whitespace.

### Import Functionality

- Import button appears in the top action bar alongside Reset and preset buttons.
- Disabled when simulation is not `idle`/`stopped`, matching the Create Map button behavior.
- Clicking Import opens a native file picker filtered to `.smap` files.
- User selects a `.smap` file, which is read as an ArrayBuffer and converted to base64.
- Sends `net.sendAction('map.import', { file_content, filename })` with base64-encoded content and original filename.
- Server responds with `map.imported` signal, then emits `map.created` with the loaded map data.
- The `map.created` handler updates the form parameters and graph preview, just as with a newly generated map.
- Import state (`importing`) prevents multiple simultaneous imports.
- File input is reset after successful import to allow re-importing the same file.

## References

- Parent: [`../index.md`](../index.md)
- Sibling: [`./fleet-creator.md`](./fleet-creator.md)
- State: [`../state/playback-state.md`](../state/playback-state.md)
- Protocol: [`../../net/protocol/schema.md`](../../net/protocol/schema.md)
