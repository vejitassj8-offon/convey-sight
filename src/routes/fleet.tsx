import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { generateFleet, type FleetRow } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Truck, Train, Ship } from "lucide-react";

export const Route = createFileRoute("/fleet")({
  head: () => ({
    meta: [
      { title: "Fleet — Meridian Cargo Ops" },
      { name: "description", content: "Live roster of trucks, trains and vessels with status, load and routing." },
    ],
  }),
  component: FleetPage,
});

const STATUSES = ["all", "loading", "inbound", "outbound", "maintenance", "idle"] as const;
const KINDS = ["all", "truck", "train", "ship"] as const;

function FleetPage() {
  const all = useMemo(() => generateFleet(), []);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  const rows = useMemo(() => {
    return all.filter((r) => {
      if (kind !== "all" && r.kind !== kind) return false;
      if (status !== "all" && r.status !== status) return false;
      if (q) {
        const t = q.toLowerCase();
        if (!(`${r.id} ${r.name} ${r.driver} ${r.route}`.toLowerCase().includes(t))) return false;
      }
      return true;
    });
  }, [all, q, kind, status]);

  return (
    <PageShell
      title="Fleet"
      subtitle={`${rows.length} of ${all.length} vehicles · live operational roster`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by ID, driver, route…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={kind} onValueChange={(v) => setKind(v as never)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {KINDS.map((k) => <SelectItem key={k} value={k}>{cap(k)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as never)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{cap(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Driver / Captain</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Load</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Last seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => <FleetRowView key={r.id} row={r} />)}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}

function FleetRowView({ row }: { row: FleetRow }) {
  const Icon = row.kind === "truck" ? Truck : row.kind === "train" ? Train : Ship;
  const pct = (row.load / row.capacity) * 100;
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-display text-sm font-semibold">{row.id}</div>
            <div className="text-[11px] text-muted-foreground">{row.name}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="capitalize text-sm">{row.kind}</TableCell>
      <TableCell><StatusBadge s={row.status} /></TableCell>
      <TableCell className="text-sm">{row.driver}</TableCell>
      <TableCell className="text-sm">{row.route}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded bg-muted">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <span className="tabular text-[11px] text-muted-foreground">
            {row.load}/{row.capacity}
          </span>
        </div>
      </TableCell>
      <TableCell className="tabular text-sm">{row.eta}</TableCell>
      <TableCell className="tabular text-xs text-muted-foreground">{row.lastSeen}</TableCell>
    </TableRow>
  );
}

function StatusBadge({ s }: { s: string }) {
  const cls = {
    loading: "bg-amber-500/20 text-amber-300",
    inbound: "bg-sky-500/20 text-sky-300",
    outbound: "bg-emerald-500/20 text-emerald-300",
    maintenance: "bg-rose-500/20 text-rose-300",
    idle: "bg-slate-500/20 text-slate-300",
  }[s] ?? "bg-muted text-muted-foreground";
  return (
    <span className={cn(
      "rounded px-2 py-0.5 text-[10px] uppercase tracking-wider",
      cls,
    )}>
      {s}
    </span>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
