import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Boxes,
  ChevronDown,
  DollarSign,
  Timer,
  Truck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSim } from "@/lib/sim/store";

type TileId = "throughput" | "dwell" | "fleet" | "utilization" | "revenue" | "sla";

export function KpiBar() {
  const [open, setOpen] = useState<TileId | null>(null);
  const tiles = useTiles();

  const toggle = (id: TileId) => setOpen((cur) => (cur === id ? null : id));

  return (
    <div className="border-b bg-card/40">
      <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <KpiTile key={t.id} tile={t} open={open === t.id} onClick={() => toggle(t.id)} />
        ))}
      </div>
      <ExpandedPanel id={open} />
    </div>
  );
}

interface Tile {
  id: TileId;
  label: string;
  value: string;
  delta: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  spark: number[];
  accent: string;
}

function useTiles(): Tile[] {
  const totals = useSim((s) => s.totals);
  const zones = useSim((s) => s.zones);
  const vehicles = useSim((s) => s.vehicles);
  const history = useSim((s) => s.history);

  return useMemo(() => {
    const util =
      ((zones.A.stored + zones.B.stored + zones.C.stored + zones.D.stored) /
        (zones.A.capacity * 4)) *
      100;
    const onTimePct =
      totals.onTime + totals.late === 0
        ? 100
        : (totals.onTime / (totals.onTime + totals.late)) * 100;
    const dwellAvg = totals.dwellCount === 0 ? 0 : totals.dwellSum / totals.dwellCount;
    const fleetActive = vehicles.filter((v) => v.state !== "inbound").length;

    return [
      {
        id: "throughput",
        label: "Throughput",
        value: `${history[history.length - 1]?.throughput ?? 0}/hr`,
        delta: 4.2,
        icon: Activity,
        spark: history.map((h) => h.throughput),
        accent: "var(--color-primary)",
      },
      {
        id: "dwell",
        label: "Avg Dwell",
        value: `${dwellAvg ? dwellAvg.toFixed(1) : "12.4"}s`,
        delta: -2.1,
        icon: Timer,
        spark: history.map((h) => 30 - h.utilization / 4),
        accent: "#22d3ee",
      },
      {
        id: "fleet",
        label: "Fleet Active",
        value: `${fleetActive}/${vehicles.length}`,
        delta: 0,
        icon: Truck,
        spark: history.map((h) => h.throughput / 2),
        accent: "#a78bfa",
      },
      {
        id: "utilization",
        label: "Warehouse Util.",
        value: `${util.toFixed(0)}%`,
        delta: 1.6,
        icon: Boxes,
        spark: history.map((h) => h.utilization),
        accent: "#f59e0b",
      },
      {
        id: "sla",
        label: "On-time SLA",
        value: `${onTimePct.toFixed(1)}%`,
        delta: 0.4,
        icon: TrendingUp,
        spark: history.map((h) => 90 + (h.throughput % 8)),
        accent: "#10b981",
      },
      {
        id: "revenue",
        label: "Revenue Today",
        value: `$${(totals.revenue / 1000).toFixed(1)}k`,
        delta: 6.8,
        icon: DollarSign,
        spark: history.map((h, i) => 100 + i * 6 + (h.throughput % 10)),
        accent: "#f43f5e",
      },
    ];
  }, [totals, zones, vehicles, history]);
}

function KpiTile({ tile, open, onClick }: { tile: Tile; open: boolean; onClick: () => void }) {
  const Icon = tile.icon;
  const up = tile.delta >= 0;
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      className={cn(
        "group flex flex-col items-start gap-2 bg-card px-4 py-3 text-left transition-colors hover:bg-accent/40",
        open && "bg-accent/40",
      )}
    >
      <div className="flex w-full items-center justify-between text-muted-foreground">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest">
          <Icon className="h-3.5 w-3.5" style={{ color: tile.accent }} />
          {tile.label}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180 text-foreground",
          )}
        />
      </div>
      <div className="flex w-full items-end justify-between gap-3">
        <div className="font-display tabular text-2xl font-semibold leading-none">
          {tile.value}
        </div>
        <div className="h-8 w-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tile.spark.map((v, i) => ({ i, v }))}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={tile.accent}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-1 text-[11px]",
          tile.delta === 0
            ? "text-muted-foreground"
            : up
              ? "text-emerald-400"
              : "text-rose-400",
        )}
      >
        {tile.delta === 0 ? null : up ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {tile.delta === 0 ? "steady" : `${up ? "+" : ""}${tile.delta}% vs yesterday`}
      </div>
    </button>
  );
}

function ExpandedPanel({ id }: { id: TileId | null }) {
  const history = useSim((s) => s.history);
  const zones = useSim((s) => s.zones);
  const vehicles = useSim((s) => s.vehicles);
  const totals = useSim((s) => s.totals);

  if (!id) return null;

  return (
    <div className="animate-in slide-in-from-top-2 grid grid-cols-1 gap-4 border-t bg-card/60 px-4 py-4 duration-200 md:grid-cols-3">
      {id === "throughput" && (
        <>
          <Card title="Containers / hour" span={2}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history}>
                <CartesianGrid stroke="var(--color-grid)" vertical={false} />
                <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="throughput"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Avg dwell by zone">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={(["A", "B", "C", "D"] as const).map((id) => ({
                  zone: id,
                  dwell: 8 + (zones[id].stored % 14),
                  fill: zones[id].color,
                }))}
              >
                <CartesianGrid stroke="var(--color-grid)" vertical={false} />
                <XAxis dataKey="zone" stroke="var(--color-muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="dwell" radius={[4, 4, 0, 0]}>
                  {(["A", "B", "C", "D"] as const).map((id) => (
                    <Cell key={id} fill={zones[id].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {id === "dwell" && (
        <Card title="Dwell time trend" span={3}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid stroke="var(--color-grid)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={10} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="utilization" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {id === "fleet" && (
        <>
          <Card title="Fleet status">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={fleetBreakdown(vehicles)}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {fleetBreakdown(vehicles).map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Active vehicles" span={2}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {vehicles.map((v) => (
                <div key={v.id} className="rounded-md border bg-background/40 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xs font-semibold">{v.name}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
                        v.state === "loading" && "bg-amber-500/20 text-amber-300",
                        v.state === "outbound" && "bg-emerald-500/20 text-emerald-300",
                        v.state === "inbound" && "bg-sky-500/20 text-sky-300",
                      )}
                    >
                      {v.state}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {v.kind} · {v.load}/{v.capacity}
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(v.load / v.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {id === "utilization" && (
        <Card title="Zone utilization" span={3}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["A", "B", "C", "D"] as const).map((zid) => {
              const z = zones[zid];
              const pct = (z.stored / z.capacity) * 100;
              return (
                <div key={zid} className="rounded-md border bg-background/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold">Zone {zid}</span>
                    <span className="tabular text-xs text-muted-foreground">
                      {z.stored}/{z.capacity}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full"
                      style={{ width: `${pct}%`, background: z.color }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] tabular text-muted-foreground">
                    {pct.toFixed(0)}% utilization
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {id === "sla" && (
        <>
          <Card title="On-time vs late">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: "On time", value: totals.onTime, fill: "#10b981" },
                    { name: "Late", value: totals.late, fill: "#f43f5e" },
                  ]}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={70}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card title="Active alerts" span={2}>
            <ul className="space-y-2 text-sm">
              {ALERTS.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border bg-background/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        a.level === "warn" ? "bg-amber-400" : "bg-rose-500",
                      )}
                    />
                    <span>{a.msg}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.ago}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {id === "revenue" && (
        <Card title="Revenue ($ x100)" span={3}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={history.map((h, i) => ({ t: h.t, v: 80 + i * 6 + (h.throughput % 20) }))}>
              <CartesianGrid stroke="var(--color-grid)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--color-muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={10} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="v" fill="var(--color-cargo)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

const ALERTS = [
  { id: 1, level: "warn", msg: "Zone B at 78% capacity — staging recommended", ago: "2m ago" },
  { id: 2, level: "err", msg: "Truck TR-103 delayed by 14 minutes on Route E", ago: "6m ago" },
  { id: 3, level: "warn", msg: "Crane Quay-2 trolley calibration drift detected", ago: "11m ago" },
];

function fleetBreakdown(vehicles: ReturnType<typeof useSim.getState>["vehicles"]) {
  const buckets = { loading: 0, outbound: 0, inbound: 0 };
  for (const v of vehicles) buckets[v.state]++;
  return [
    { name: "Loading", value: buckets.loading, fill: "#f59e0b" },
    { name: "Outbound", value: buckets.outbound, fill: "#10b981" },
    { name: "Inbound", value: buckets.inbound, fill: "#22d3ee" },
  ];
}

const tooltipStyle = {
  background: "rgba(15, 23, 42, 0.95)",
  border: "1px solid var(--color-border)",
  borderRadius: 6,
  fontSize: 11,
};

function Card({
  title,
  span = 1,
  children,
}: {
  title: string;
  span?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  const cls = span === 3 ? "md:col-span-3" : span === 2 ? "md:col-span-2" : "";
  return (
    <div className={cn("rounded-lg border bg-card p-3", cls)}>
      <div className="mb-2 font-display text-[11px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}
