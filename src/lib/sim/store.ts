import { create } from "zustand";
import type {
  Container,
  KpiHistoryPoint,
  Ship,
  SimState,
  Vehicle,
  Zone,
  ZoneId,
} from "./types";

const ZONE_DEFS: Zone[] = [
  { id: "A", capacity: 120, stored: 42, color: "#22d3ee" },
  { id: "B", capacity: 120, stored: 58, color: "#f59e0b" },
  { id: "C", capacity: 120, stored: 31, color: "#10b981" },
  { id: "D", capacity: 120, stored: 67, color: "#a78bfa" },
];

const SHIP_NAMES = ["Aurora", "Borealis", "Calypso", "Drakon", "Empress", "Fenrir"];
const TRUCK_NAMES = (n: number) => `TR-${String(n).padStart(3, "0")}`;
const TRAIN_NAMES = (n: number) => `RX-${String(n).padStart(2, "0")}`;

function makeInitialShips(): Ship[] {
  return [
    { id: "s1", name: "Aurora", state: "docked", t: 0.2, quay: 0, containersOnboard: 24, dockedFor: 180 },
    { id: "s2", name: "Borealis", state: "approaching", t: 0.4, quay: 1, containersOnboard: 30, dockedFor: 0 },
  ];
}

function makeInitialVehicles(): Vehicle[] {
  const v: Vehicle[] = [];
  for (let i = 0; i < 4; i++) {
    v.push({
      id: `t${i}`,
      name: TRUCK_NAMES(101 + i),
      kind: "truck",
      state: i % 2 === 0 ? "loading" : "inbound",
      t: Math.random(),
      slot: i,
      load: i % 2 === 0 ? 4 : 0,
      capacity: 12,
    });
  }
  v.push({
    id: "rx1",
    name: TRAIN_NAMES(7),
    kind: "train",
    state: "loading",
    t: 0.3,
    slot: 0,
    load: 18,
    capacity: 60,
  });
  return v;
}

export const useSim = create<SimState & {
  tick: (dt: number) => void;
  setSpeed: (s: 0 | 1 | 2 | 5) => void;
  setShowLabels: (v: boolean) => void;
  setShowHeat: (v: boolean) => void;
  select: (sel: SimState["selected"]) => void;
}>((set, get) => ({
  clock: 0,
  speed: 1,
  showLabels: true,
  showHeat: false,
  ships: makeInitialShips(),
  containers: [],
  vehicles: makeInitialVehicles(),
  zones: Object.fromEntries(ZONE_DEFS.map((z) => [z.id, z])) as Record<ZoneId, Zone>,
  history: Array.from({ length: 24 }, (_, i) => ({
    t: i,
    // Deterministic so SSR and client render the same values (avoid hydration mismatch).
    throughput: 30 + Math.round(Math.sin(i / 3) * 8 + Math.cos(i * 1.3) * 4),
    utilization: 40 + Math.round(Math.cos(i / 4) * 10 + Math.sin(i * 0.9) * 5),
  })) as KpiHistoryPoint[],
  totals: { delivered: 1284, revenue: 482300, onTime: 1198, late: 86, dwellSum: 0, dwellCount: 0 },
  selected: null,

  setSpeed: (speed) => set({ speed }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setShowHeat: (showHeat) => set({ showHeat }),
  select: (selected) => set({ selected }),

  tick: (dt) => {
    const s = get();
    const speed = s.speed;
    if (speed === 0) return;
    const step = dt * speed;
    runEngine(set, get, step);
  },
}));

// ---------------- engine ----------------
type Setter = (
  partial:
    | Partial<SimState>
    | ((s: SimState) => Partial<SimState>),
) => void;

let spawnAccumulator = 0;
let nextId = 1;
const uid = (p: string) => `${p}${nextId++}`;

function pickZone(): ZoneId {
  const zones: ZoneId[] = ["A", "B", "C", "D"];
  return zones[Math.floor(Math.random() * 4)];
}

function pickMode(): "truck" | "train" | "ship" {
  const r = Math.random();
  if (r < 0.6) return "truck";
  if (r < 0.9) return "train";
  return "ship";
}

function pickKind(): Container["kind"] {
  const k: Container["kind"][] = ["electronics", "produce", "machinery", "textiles"];
  return k[Math.floor(Math.random() * 4)];
}

function runEngine(set: Setter, get: () => SimState, dt: number) {
  const state = get();
  const ships = state.ships.map((sh) => ({ ...sh }));
  const containers = state.containers.map((c) => ({ ...c }));
  const vehicles = state.vehicles.map((v) => ({ ...v }));
  const zones: Record<ZoneId, Zone> = {
    A: { ...state.zones.A },
    B: { ...state.zones.B },
    C: { ...state.zones.C },
    D: { ...state.zones.D },
  };
  const totals = { ...state.totals };
  const clock = state.clock + dt;

  // --- ships
  for (const sh of ships) {
    if (sh.state === "approaching") {
      sh.t += dt / 18;
      if (sh.t >= 1) {
        sh.t = 0;
        sh.state = "docked";
        sh.dockedFor = 0;
      }
    } else if (sh.state === "docked") {
      sh.dockedFor += dt;
      // Spawn containers as crane offload
      // emit roughly one container every 3 sim seconds per docked ship
      if (sh.containersOnboard > 0) {
        sh.t += dt;
        if (sh.t >= 2.5) {
          sh.t = 0;
          sh.containersOnboard -= 1;
          containers.push({
            id: uid("c"),
            kind: pickKind(),
            zone: pickZone(),
            stage: 1,
            t: 0,
            dwell: 0,
            shipId: sh.id,
            mode: pickMode(),
            createdAt: clock,
          });
        }
      } else if (sh.dockedFor > 8) {
        sh.state = "departing";
        sh.t = 0;
      }
    } else if (sh.state === "departing") {
      sh.t += dt / 16;
      if (sh.t >= 1) {
        // respawn
        sh.t = 0;
        sh.state = "approaching";
        sh.name = SHIP_NAMES[Math.floor(Math.random() * SHIP_NAMES.length)];
        sh.containersOnboard = 18 + Math.floor(Math.random() * 18);
      }
    }
  }

  // --- containers
  for (let i = containers.length - 1; i >= 0; i--) {
    const c = containers[i];
    if (c.stage === 1) {
      // crane lift -> zone
      c.t += dt / 2.2;
      if (c.t >= 1) {
        c.stage = 2;
        c.t = 0;
        c.dwell = 0;
        zones[c.zone].stored = Math.min(zones[c.zone].capacity, zones[c.zone].stored + 1);
      }
    } else if (c.stage === 2) {
      c.dwell += dt;
      // After dwell, try to assign to a loading vehicle of matching mode
      if (c.dwell > 4) {
        const v = vehicles.find(
          (vv) =>
            vv.kind === c.mode &&
            vv.state === "loading" &&
            vv.load < vv.capacity,
        );
        if (v) {
          c.vehicleId = v.id;
          c.stage = 3;
          c.t = 0;
          v.load += 1;
          zones[c.zone].stored = Math.max(0, zones[c.zone].stored - 1);
        }
      }
    } else if (c.stage === 3) {
      c.t += dt / 1.4;
      if (c.t >= 1) {
        c.stage = 4;
        c.t = 0;
      }
    } else if (c.stage === 4) {
      // delivered when its vehicle departs
      const v = vehicles.find((vv) => vv.id === c.vehicleId);
      if (!v || v.state === "outbound") {
        totals.delivered += 1;
        totals.revenue += 280 + Math.floor(Math.random() * 220);
        const ontime = Math.random() > 0.07;
        if (ontime) totals.onTime += 1;
        else totals.late += 1;
        totals.dwellSum += clock - c.createdAt;
        totals.dwellCount += 1;
        containers.splice(i, 1);
      }
    }
  }

  // --- vehicles
  for (const v of vehicles) {
    if (v.state === "inbound") {
      v.t += dt / (v.kind === "train" ? 12 : 6);
      if (v.t >= 1) {
        v.t = 0;
        v.state = "loading";
      }
    } else if (v.state === "loading") {
      v.t += dt;
      const full = v.load >= v.capacity;
      const timedOut = v.t > (v.kind === "train" ? 14 : 7);
      if (full || (timedOut && v.load > 0)) {
        v.state = "outbound";
        v.t = 0;
      }
    } else if (v.state === "outbound") {
      v.t += dt / (v.kind === "train" ? 10 : 5);
      if (v.t >= 1) {
        v.t = 0;
        v.state = "inbound";
        v.load = 0;
      }
    }
  }

  // spawn occasional new truck rotation - we keep fixed fleet for simplicity
  spawnAccumulator += dt;

  set({
    clock,
    ships,
    containers,
    vehicles,
    zones,
    totals,
    history: state.history, // updated below at 1Hz
  });

  // Update history once per sim minute
  const lastH = state.history[state.history.length - 1];
  const minute = Math.floor(clock / 6); // 6 sim seconds = 1 "minute" for chart pacing
  if (minute > lastH.t) {
    const containersHr = Math.round(20 + (totals.delivered % 60));
    const util =
      ((zones.A.stored + zones.B.stored + zones.C.stored + zones.D.stored) /
        (zones.A.capacity * 4)) *
      100;
    const next = [
      ...state.history.slice(1),
      { t: minute, throughput: containersHr, utilization: Math.round(util) },
    ];
    set({ history: next });
  }
}
