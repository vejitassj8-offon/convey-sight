// Deterministic mock datasets for Fleet / Warehouse / Reports pages.
// Uses seeded pseudo-random so SSR + client render identical values.

export type FleetKind = "truck" | "train" | "ship";
export type FleetStatus = "loading" | "inbound" | "outbound" | "maintenance" | "idle";

export interface FleetRow {
  id: string;
  name: string;
  kind: FleetKind;
  status: FleetStatus;
  driver: string;
  route: string;
  load: number;
  capacity: number;
  eta: string;
  lastSeen: string;
}

export type CargoKind = "electronics" | "produce" | "machinery" | "textiles" | "chemicals";
export type ZoneId = "A" | "B" | "C" | "D";

export interface WarehouseRow {
  id: string;
  zone: ZoneId;
  kind: CargoKind;
  client: string;
  units: number;
  weight: number; // tons
  arrived: string;
  dwellHrs: number;
  status: "stored" | "staging" | "outbound" | "hold";
}

export interface ReportRow {
  id: string;
  date: string;
  origin: string;
  destination: string;
  mode: FleetKind;
  containers: number;
  revenue: number;
  sla: "on-time" | "late" | "early";
  client: string;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(arr: readonly T[], r: number) => arr[Math.floor(r * arr.length)];

const DRIVERS = ["A. Chen", "M. Okafor", "P. Lindqvist", "D. Patel", "S. Rivera",
  "J. Morozov", "L. Tanaka", "B. Haddad", "R. Müller", "E. Costa"];
const ROUTES_TRUCK = ["I-95 N", "Route 7 W", "Hwy 401 E", "M25 Loop", "A1 South"];
const ROUTES_TRAIN = ["Rail Spur 2 → Inland Hub", "Northbound Freight 14", "Continental 88"];
const ROUTES_SHIP = ["Trans-Pacific", "North Atlantic", "Suez–Rotterdam", "Med Loop"];
const CLIENTS = ["Hokusai Imports", "Sable & Co", "Northwind Logistics", "Vega Foods",
  "Brightline Tech", "Auger Industries", "Maris Textiles", "Atlas Chem"];
const ORIGINS = ["Rotterdam", "Singapore", "Long Beach", "Shanghai", "Hamburg", "Dubai"];
const DESTS = ["Chicago", "Toronto", "Lyon", "Milan", "Atlanta", "Seoul", "Warsaw"];
const CARGO: CargoKind[] = ["electronics", "produce", "machinery", "textiles", "chemicals"];
const ZONES: ZoneId[] = ["A", "B", "C", "D"];

export function generateFleet(): FleetRow[] {
  const r = mulberry32(101);
  const rows: FleetRow[] = [];
  const statuses: FleetStatus[] = ["loading", "inbound", "outbound", "maintenance", "idle"];
  for (let i = 0; i < 36; i++) {
    const k = i < 22 ? "truck" : i < 30 ? "train" : "ship";
    const cap = k === "truck" ? 12 : k === "train" ? 60 : 240;
    const status = pick(statuses, r());
    const load = status === "idle" || status === "maintenance" ? 0 : Math.floor(r() * cap);
    const id = k === "truck" ? `TR-${101 + i}` : k === "train" ? `RX-${i - 21}` : `MV-${i - 29}`;
    const name = k === "ship"
      ? pick(["Aurora", "Borealis", "Calypso", "Drakon", "Empress", "Fenrir"], r())
      : id;
    rows.push({
      id,
      name,
      kind: k,
      status,
      driver: k === "ship" ? `Cap. ${pick(DRIVERS, r())}` : pick(DRIVERS, r()),
      route: k === "truck" ? pick(ROUTES_TRUCK, r())
        : k === "train" ? pick(ROUTES_TRAIN, r())
          : pick(ROUTES_SHIP, r()),
      load,
      capacity: cap,
      eta: `${Math.floor(r() * 12) + 1}h ${Math.floor(r() * 60)
        .toString().padStart(2, "0")}m`,
      lastSeen: `${Math.floor(r() * 30) + 1}m ago`,
    });
  }
  return rows;
}

export function generateWarehouse(): WarehouseRow[] {
  const r = mulberry32(202);
  const rows: WarehouseRow[] = [];
  const statuses: WarehouseRow["status"][] = ["stored", "staging", "outbound", "hold"];
  for (let i = 0; i < 48; i++) {
    rows.push({
      id: `LOT-${4000 + i}`,
      zone: pick(ZONES, r()),
      kind: pick(CARGO, r()),
      client: pick(CLIENTS, r()),
      units: 4 + Math.floor(r() * 80),
      weight: Math.round((1 + r() * 24) * 10) / 10,
      arrived: `${Math.floor(r() * 72) + 1}h ago`,
      dwellHrs: Math.round(r() * 96),
      status: pick(statuses, r()),
    });
  }
  return rows;
}

export function generateReports(): ReportRow[] {
  const r = mulberry32(303);
  const slas: ReportRow["sla"][] = ["on-time", "on-time", "on-time", "late", "early"];
  const modes: FleetKind[] = ["truck", "train", "ship"];
  const rows: ReportRow[] = [];
  for (let i = 0; i < 60; i++) {
    const day = (i % 30) + 1;
    rows.push({
      id: `SHP-${20240 + i}`,
      date: `2026-06-${day.toString().padStart(2, "0")}`,
      origin: pick(ORIGINS, r()),
      destination: pick(DESTS, r()),
      mode: pick(modes, r()),
      containers: 1 + Math.floor(r() * 120),
      revenue: Math.floor(1500 + r() * 48000),
      sla: pick(slas, r()),
      client: pick(CLIENTS, r()),
    });
  }
  return rows;
}
