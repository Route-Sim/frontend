---
title: 'HUD: Simulation Controls'
summary: 'Playback UI with play/pause/stop, tick rate and speed sliders, plus simulation state export/import for save/load functionality.'
source_paths:
  - 'src/hud/containers/simulation-controls.tsx'
  - 'src/hud/api/playback.ts'
last_updated: '2026-01-04'
owner: 'Mateusz Nędzi'
tags: ['module', 'hud', 'ui', 'state-management']
links:
  parent: '../../../SUMMARY.md'
  siblings: ['../camera-help.md']
---

# Simulation Controls

> Purpose: Provide playback controls (play/pause/stop), tick rate and speed adjustment, and simulation state management (export/import save files). Network wiring is handled by a controller hook to keep UI decoupled from IO.

## Responsibilities & Boundaries

- In-scope: Playback controls (play/pause/resume/stop), tick rate and speed adjustment, and simulation state export (when paused).
- Out-of-scope: Actual simulation logic (server-side), state serialization format (server-side), scene rendering, state import (handled by dedicated State Importer in creator panels).

## Public API / Usage

```ts
export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'stopped';
export type PlaybackCommand =
  | { type: 'resume' }
  | { type: 'pause' }
  | { type: 'stop' }
  | { type: 'update'; tickRate: number; speed: number };
export interface PlaybackController {
  initialState?: { status: PlaybackStatus; tickRate: number; speed: number };
  commandSink?: (cmd: PlaybackCommand) => void;
}
```

Example (wired):

```tsx
<SimulationControls controller={{
  ...usePlaybackNetController(),
}} />
```

## Net Wiring

- Hook: `src/hud/hooks/use-playback-controller.ts`
- Playback actions:
  - `resume` → `simulation.resume` with `{}`
  - `pause` → `simulation.pause` with `{}`
  - `stop` → `simulation.stop` with `{}`
  - `update` → `simulation.update` with `{ tick_rate, speed }`
- State management actions:
  - Export: `simulation.export_state` with `{ filename }` → `simulation.state_exported` signal

The hook calls `net.connect()` on mount and sends actions via `net.sendAction(...)`. UI remains optimistic; errors are logged for now.

## State Export

### Export Functionality

- **Availability**: Only when simulation is paused
- **UI**: Filename input field + "Export State" button
- **Default filename**: `save_0` (user can customize)
- **Flow**:
  1. User pauses simulation
  2. Export section becomes visible
  3. User edits filename (optional)
  4. User clicks "Export State"
  5. Client sends `simulation.export_state` action
  6. Server serializes current simulation state
  7. Server responds with `simulation.state_exported` signal containing base64-encoded data
  8. Client decodes base64, creates Blob, triggers download of `.ssave` file
  9. Object URL cleaned up immediately

### State Management

- Export state (`exporting`): prevents concurrent exports
- Filename validation: export disabled if filename is empty/whitespace

**Note**: For importing simulation state, use the dedicated "Load State" tab in the creator panels before starting the simulation.

## Implementation Notes

- Local state for `status`, `tickRate`, `speed`, `exporting`, and `exportFilename`
- Slider drags are previewed (`dragTickRate`, `dragSpeed`) and committed on pointer release
- Tick rate and speed persisted to `localStorage` (`hud:tickRate`, `hud:speed`)
- Export handler uses `React.useCallback` for stable references
- No side effects beyond calling `commandSink` and network actions

## Performance

- Lightweight React component; no timers or polling
- Minimal re-renders via memoized callbacks
- File operations are async and non-blocking
