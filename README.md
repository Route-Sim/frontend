## Visualization & Interactive Simulation Tracking Application

Warm, cozy, simulation visualization built with TypeScript, three.js, and Vite, featuring a React HUD and gentle orbit/move camera controls. The scene embraces a sunset‑tinted palette, flat‑shaded materials, soft lights, and playful motion.

### ✨ What’s inside

- **Tech stack**: TypeScript + Vite + three.js + React (HUD) + Tailwind
- **Rendering engine**: RAF loop, scene manager, perspective camera, orbit + WASD/arrow movement
- **Warm style**: flat‑shaded materials, creamy ambient light, soft sun key, subtle fog
- **HUD**: toggleable in‑browser controls and components

---

## 🚀 Quickstart

### Prerequisites

- **Bun** 1.x (recommended for scripts) — `curl -fsSL https://bun.sh/install | bash`
- Node.js 18+ (optional, if you prefer running Vite without Bun)

### Clone and install

```bash
git clone git@github.com:Route-Sim/VISTA.git
cd VISTA
bun install
```

### Run the dev server

```bash
bun run dev
```

Then open: `http://localhost:5173`

### Without Bun (alternative)

```bash
npm i
npx vite
# or
npx vite build && npx vite preview
```

---

## 📦 NPM scripts

These scripts use Bun’s `bunx` under the hood; prefer Bun for the smoothest DX.

```bash
# Start dev server (Vite)
bun run dev

# Production build
bun run build

# Preview the production build locally
bun run preview
```

---

## 🕹️ Controls & HUD

- **Orbit**: mouse drag (left), zoom (wheel), pan (right)
- **Fly‑style movement**: `W/A/S/D` or arrow keys
- **Vertical**: `Space` (up), `Shift` (down)
- **HUD toggle**: press `H`

Implementation references:

- Camera: `src/engine/camera-rig.ts`
- Orbit + move: `src/engine/controls/orbit-move-controls.ts`
- HUD mount/toggle: `src/hud` wired in `src/main.ts`

---

## 🧭 Project structure

```
src/
  app/         # App-level config (palette in colors.ts)
  engine/      # Render loop, scene, camera, loaders, reusable objects
  hud/         # React HUD components (tailwind/shadcn)
  net/         # WebSocket client & protocol (stubs/placeholders)
  sim/         # Domain state & systems (pure/serializable)
  utils/       # Generic utilities
  view/        # Applies interpolated frames to scene (mutations live here)
```

Entry point: `src/main.ts` wires engine, scene, camera, controls, and HUD.

---

## 🧱 Architecture (IO → Domain → View)

- **Decoupled layers** keep networking, simulation, and rendering cleanly separated.
- **Data flow**: WebSocket → decode/validate → push to `sim/store` buffer → interpolate per RAF → adapt to view models → `view/*` mutates scene → renderer draws.
- **Constraints**:
  - `sim/*` is pure (no three.js types or side effects)
  - Adapt at boundaries: wire types ≠ domain types ≠ view models
  - Only `view/*` mutates three.js objects
  - Keep `src/main.ts` lightweight composition/wiring

---

## 🎨 Low‑Poly Warm World style guide (high‑level)

Central palette lives in `src/app/colors.ts`. The visual direction aims for simplified, rounded forms, warm tones, and gentle motion.

- **Materials**: prefer `MeshStandardMaterial` with `flatShading: true`, `metalness: 0`, `roughness: 0.8–0.95`
- **Lighting**: warm ambient fill, soft orange directional light, optional rim/hemisphere; soft shadows if enabled
- **Geometry**: keep segment counts modest (intentional faceting), rounded silhouettes, friendly proportions
- **Animation**: subtle sway/bob/rotation, eased, low amplitude/frequency
- **Scene**: warm fog, atmospheric perspective, big‑to‑small composition, limited materials

Example material baseline:

```ts
import * as THREE from 'three';

export const createWarmLowPolyMaterial = (color: THREE.ColorRepresentation) =>
  new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    metalness: 0,
    roughness: 0.9,
  });
```

Suggested warm lighting:

```ts
import * as THREE from 'three';

export function addWarmLighting(scene: THREE.Scene): void {
  const ambient = new THREE.AmbientLight(0xffe8cc, 0.4);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xff9b5e, 1.0);
  sun.position.set(6, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 4;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
}
```

Fog recommendation:

```ts
scene.fog = new THREE.Fog(0xf2f2f2, 60, 100);
renderer.setClearColor(0xf2f2f2, 1);
```

---

## 🛠️ Development notes

- TypeScript is strict (see `tsconfig.json`), avoid `any`, prefer explicit return types for exports
- Keep modules small and single‑purpose; avoid deep nesting; use guard clauses
- `@` path alias points to `src` (see `vite.config.ts` and `tsconfig.json`)
- Tailwind is scoped for HUD/UI components; preflight is disabled to avoid touching the canvas

---

## 🤝 Contributing

This project uses **Conventional Commits** and automated semantic versioning.

### Commit Message Format

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Common types:**
- `feat:` new feature (triggers minor version bump)
- `fix:` bug fix (triggers patch version bump)
- `docs:` documentation changes
- `refactor:` code refactoring
- `test:` test additions or updates
- `chore:` maintenance tasks

**Examples:**

```bash
feat(hud): add agent inspector panel
fix(engine): correct camera aspect ratio on resize
docs: update installation instructions
```

**Breaking changes** (trigger major version bump):

```bash
feat(sim)!: redesign state management

BREAKING CHANGE: SimStore API has been completely redesigned.
```

### Automated Releases

- PRs are validated for conventional commit format
- Merging to `main` automatically creates a Release PR with:
  - Version bump (based on commit types)
  - Generated changelog
  - Updated `package.json`
- Merging the Release PR creates a GitHub release

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 🧪 Build & preview

```bash
bun run build
bun run preview
```

This produces a production bundle via Vite and serves it locally for inspection.

---

## 🧰 Troubleshooting

- **Port in use (5173)**: set a different port `bunx --bun vite --port 5174` or `npx vite --port 5174`
- **Blank screen**: check console errors, confirm `canvas#app` is created in `src/main.ts`, and that the renderer size matches the window
- **Type errors**: ensure TypeScript version matches `package.json`; run a clean install
- **Missing Bun**: install Bun or use the “Without Bun” commands above
- **Textures/models**: ensure assets under `public/` are reachable and paths are correct

---

## 🙌 Acknowledgements

- three.js community for examples/utilities
- shadcn/ui + Radix primitives for accessible HUD components
