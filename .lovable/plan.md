# Cargo Ops — Live Diorama Dashboard

A single-page prototype dashboard for a fictional cargo shipping company. Top bar holds menu + expandable KPI tiles. The lower ~80% is a real-time, top-down isometric 2.5D diorama animating cargo flow: ships → port → warehouse zones → trucks/trains outbound.

## Layout

```text
┌──────────────────────────────────────────────────────────┐
│ Logo  Nav (Ops · Fleet · Warehouse · Reports)   ⌕  👤    │ ~56px
├──────────────────────────────────────────────────────────┤
│ [Throughput] [Dwell] [Fleet] [Utilization] [SLA] [Rev]  │ ~120px, click→expands
│   (expanded tile pushes down: sparkline + breakdown)     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│           ISOMETRIC LIVE DIORAMA (canvas)                │ ~80vh
│   ships ⇢ port cranes ⇢ warehouse zones ⇢ trucks/trains  │
│           click any entity → side detail panel           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Design direction

- Mood: ops-center, premium control-room. Dark slate canvas with warm cargo accents.
- Palette: bg `#0B1220`, panel `#111A2E`, grid `#1B2740`, primary cyan `#22D3EE`, cargo amber `#F59E0B`, success `#10B981`, danger `#F43F5E`, text `#E5E7EB` / muted `#94A3B8`.
- Type: Space Grotesk (display, KPI numerals) + Inter (UI). Tabular numerals on KPIs.
- Tokens go in `src/styles.css` (oklch); no hardcoded colors in components.

## Diorama (the centerpiece)

- Implementation: HTML5 Canvas 2D with an isometric projection (no Three.js — keeps it fast and matches "2.5D illustrated").
- Scene contents:
  - Sea lane (left) with 2–3 cargo ships drifting toward port
  - Port with 2 quay cranes lifting containers off ships
  - Warehouse footprint split into 4 colored zones (A/B/C/D) with stacked container sprites whose height reflects utilization
  - Rail spur with a train of flatcars loading on the north side
  - Truck yard + road exit on the south side; trucks loop in, dock, depart
- Simulation loop (requestAnimationFrame, ~60fps render, 5–10Hz tick):
  - Shipments spawn on ships, get unloaded → routed to a zone by cargo type → after dwell time, assigned to truck/train/outbound ship → animated along a spline path off-scene.
  - Each move updates the underlying KPI store, so the top bar reacts live.
- Interaction: hover highlights entity + tooltip; click opens a right-side `Sheet` with that entity's manifest, ETA, contents.
- Controls overlay (bottom-left of diorama): pause / play, speed 1× 2× 5×, toggle labels, toggle heat overlay (zone utilization).
- Subtle motion: water shimmer, crane arm sweep, truck wheels, container drop bounce. Restrained — not cartoony.

## KPI bar

Six tiles, each a shadcn `Card` with: label, big number, delta vs yesterday, mini sparkline. Click to expand inline (accordion-style, animated height) revealing:

- Throughput & dwell: containers/hr line chart, avg dwell by zone bar chart
- Fleet status: donut of trucks/trains/ships by state (idle/loading/en-route)
- Warehouse utilization: 4 zone bars with capacity %
- Financial/SLA: revenue today, on-time %, active alerts list

Charts via Recharts. Only one tile expanded at a time.

## Routes & files

- `src/routes/index.tsx` — dashboard (replaces placeholder), sets head meta
- `src/components/dashboard/TopBar.tsx` — logo + nav + user
- `src/components/dashboard/KpiBar.tsx` + `KpiTile.tsx` + per-KPI expansion panels
- `src/components/diorama/Diorama.tsx` — canvas host, RAF loop, resize observer
- `src/components/diorama/scene.ts` — static scene geometry (iso projection helpers, warehouse/port layout)
- `src/components/diorama/entities.ts` — Ship, Container, Truck, Train, Crane types + update fns
- `src/components/diorama/sprites.ts` — procedural drawing functions for each entity (no image assets needed initially)
- `src/components/diorama/Controls.tsx` — pause/speed/overlay toggles
- `src/components/diorama/EntityDetail.tsx` — `Sheet` content
- `src/lib/sim/store.ts` — Zustand store: entities, KPIs, sim clock, speed, selection
- `src/lib/sim/engine.ts` — tick(): spawn, route, advance, retire; derives KPIs
- `src/lib/sim/seed.ts` — deterministic initial fleet + shipments

## Technical notes

- No backend. All state client-side via Zustand; persists nothing.
- Canvas sized to container with devicePixelRatio scaling for crisp lines.
- Tab visibility: pause RAF when hidden to save CPU.
- Accessibility: KPI tiles are buttons with aria-expanded; diorama has an aria-label and a visually-hidden live region announcing major events (e.g. "Ship Aurora docked at Quay 2").
- Tailwind v4 tokens only; add Space Grotesk + Inter via `<link>` in `__root.tsx` head and register `--font-display` / `--font-sans` in `@theme`.
- Add `bun add zustand recharts` (Recharts may already be present).

## Out of scope (prototype)

- Auth, multi-page nav targets are visual only (no route files for Fleet/Reports unless you ask)
- Real data integration, persistence, exports
- Mobile-optimized diorama (will be responsive but designed desktop-first)
