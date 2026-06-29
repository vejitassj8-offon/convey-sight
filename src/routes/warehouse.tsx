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
import { generateWarehouse } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/warehouse")({
  head: () => ({
    meta: [
      { title: "Warehouse — Meridian Cargo Ops" },
      { name: "description", content: "Live warehouse inventory by zone, cargo kind and client with dwell tracking." },
    ],
  }),
  component: WarehousePage,
});

const ZONES = ["all", "A", "B", "C", "D"] as const;
const KINDS = ["all", "electronics", "produce", "machinery", "textiles", "chemicals"] as const;
const STATUSES = ["all", "stored", "staging", "outbound", "hold"] as const;

const ZONE_COLOR: Record<string, string> = {
  A: "#22d3ee", B: "#f59e0b", C: "#10b981", D: "#a78bfa",
};

function WarehousePage() {
  const all = useMemo(() => generateWarehouse(), []);
  const [q, setQ] = useState("");
  const [zone, setZone] = useState<(typeof ZONES)[number]>("all");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  const rows = useMemo(() => {
    return all.filter((r) => {
      if (zone !== "all" && r.zone !== zone) return false;
      if (kind !== "all" && r.kind !== kind) return false;
      if (status !== "all" && r.status !== status) return false;
      if (q && !`${r.id} ${r.client}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [all, q, zone, kind, status]);

  const totalUnits = rows.reduce((s, r) => s + r.units, 0);
  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);

  return (
    <PageShell
      title="Warehouse Inventory"
      subtitle={`${rows.length} lots · ${totalUnits.toLocaleString()} units · ${totalWeight.toFixed(1)} t`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search lot or client…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={zone} onValueChange={(v) => setZone(v as never)}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Zone" /></SelectTrigger>
          <SelectContent>
            {ZONES.map((z) => <SelectItem key={z} value={z}>{z === "all" ? "All zones" : `Zone ${z}`}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={(v) => setKind(v as never)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
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
              <TableHead>Lot</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Units</TableHead>
              <TableHead className="text-right">Weight (t)</TableHead>
              <TableHead>Arrived</TableHead>
              <TableHead className="text-right">Dwell</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-display text-sm font-semibold">{r.id}</TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: ZONE_COLOR[r.zone] + "22", color: ZONE_COLOR[r.zone] }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ZONE_COLOR[r.zone] }} />
                    Zone {r.zone}
                  </span>
                </TableCell>
                <TableCell className="capitalize text-sm">{r.kind}</TableCell>
                <TableCell className="text-sm">{r.client}</TableCell>
                <TableCell className="text-right tabular text-sm">{r.units}</TableCell>
                <TableCell className="text-right tabular text-sm">{r.weight.toFixed(1)}</TableCell>
                <TableCell className="tabular text-xs text-muted-foreground">{r.arrived}</TableCell>
                <TableCell className={cn(
                  "text-right tabular text-sm",
                  r.dwellHrs > 72 && "text-amber-300",
                  r.dwellHrs > 90 && "text-rose-300",
                )}>{r.dwellHrs}h</TableCell>
                <TableCell><StatusBadge s={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}

function StatusBadge({ s }: { s: string }) {
  const cls = {
    stored: "bg-sky-500/20 text-sky-300",
    staging: "bg-amber-500/20 text-amber-300",
    outbound: "bg-emerald-500/20 text-emerald-300",
    hold: "bg-rose-500/20 text-rose-300",
  }[s] ?? "bg-muted text-muted-foreground";
  return (
    <span className={cn("rounded px-2 py-0.5 text-[10px] uppercase tracking-wider", cls)}>
      {s}
    </span>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
