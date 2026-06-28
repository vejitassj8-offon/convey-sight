export type CargoKind = "electronics" | "produce" | "machinery" | "textiles";
export type ZoneId = "A" | "B" | "C" | "D";
export type VehicleKind = "truck" | "train" | "ship";
export type ShipState = "approaching" | "docked" | "departing";
export type VehicleState = "inbound" | "loading" | "outbound";

export interface Ship {
  id: string;
  name: string;
  state: ShipState;
  /** progress 0..1 within current state */
  t: number;
  quay: 0 | 1;
  containersOnboard: number;
  /** simulation seconds spent in port so far */
  dockedFor: number;
}

export interface Container {
  id: string;
  kind: CargoKind;
  zone: ZoneId;
  /** stage: 0 ship -> 1 crane lift -> 2 zone -> 3 vehicle -> 4 exit */
  stage: 0 | 1 | 2 | 3 | 4;
  /** progress within current animated transition */
  t: number;
  /** for stage 2 (in zone), how long dwelled in sim seconds */
  dwell: number;
  /** the source ship and target vehicle ids */
  shipId?: string;
  vehicleId?: string;
  /** chosen outbound mode */
  mode: VehicleKind;
  createdAt: number;
}

export interface Vehicle {
  id: string;
  name: string;
  kind: VehicleKind;
  state: VehicleState;
  t: number;
  /** which slot at the loading dock */
  slot: number;
  load: number;
  capacity: number;
}

export interface Zone {
  id: ZoneId;
  capacity: number;
  /** number of containers currently in zone */
  stored: number;
  color: string;
}

export interface KpiHistoryPoint {
  t: number; // sim minute
  throughput: number;
  utilization: number;
}

export interface SimState {
  clock: number; // sim seconds since start
  speed: 0 | 1 | 2 | 5;
  showLabels: boolean;
  showHeat: boolean;
  ships: Ship[];
  containers: Container[];
  vehicles: Vehicle[];
  zones: Record<ZoneId, Zone>;
  history: KpiHistoryPoint[];
  totals: {
    delivered: number;
    revenue: number;
    onTime: number;
    late: number;
    dwellSum: number;
    dwellCount: number;
  };
  selected: { type: "ship" | "vehicle" | "zone"; id: string } | null;
}
