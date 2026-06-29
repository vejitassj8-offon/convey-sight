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
import { generateReports } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Meridian Cargo Ops" },
      { name: "description", content: "Shipment ledger with revenue, SLA performance and modal mix filters." },
    ],
  }),
  component: ReportsPage,
});

const MODES = ["all", "truck", "train", "ship"] as const;
const SLAS = ["all", "on-time", "late", "early"] as const;
const RANGES = ["7d", "14d", "30d"] as const;

function ReportsPage() {
  const all = useMemo(() => generateReports(), []);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]>("all");
  const [sla, setSla] = useState<(typeof SLAS)[number]>("all");
  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");

  const rows = useMemo(() => {
    const limit = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    return all.filter((r) => {
      const day = parseInt(r.date.slice(-2), 10);
      if (day > limit) return false;
      if (mode !== "all" && r.mode !== mode) return false;
      if (sla !== "all" && r.sla !== sla) return false;
      if (q && !`${r.id} ${r.client} ${r.origin} ${r.destination}`
        .toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [all, q, mode, sla, range]);

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalContainers = rows.reduce((s, r) => s + r.containers, 0);
  const onTimePct = rows.length
    ? (rows.filter((r) => r.sla !== "late").length / rows.length) * 100
    : 0;

  return (
    <PageShell
      title="Reports"
      subtitle="Shipment ledger, revenue and SLA performance"
    >
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Shipments" value={rows.length.toString()} />
        <Stat label="Containers" value={totalContainers.toLocaleString()} />
        <Stat label="Revenue" value={`$${(totalRevenue / 1000).toFixed(1)}k`} accent="text-emerald-300" />
        <Stat label="On-time" value={`${onTimePct.toFixed(1)}%`} accent="text-sky-300" />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search shipment, client, port…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={range} onValueChange={(v) => setRange(v as never)}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => <SelectItem key={r} value={r}>Last {r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={mode} onValueChange={(v) => setMode(v as never)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MODES.map((m) => <SelectItem key={m} value={m}>{cap(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sla} onValueChange={(v) => setSla(v as never)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SLAS.map((s) => <SelectItem key={s} value={s}>{cap(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Containers</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>SLA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-display text-sm font-semibold">{r.id}</TableCell>
                <TableCell className="tabular text-xs text-muted-foreground">{r.date}</TableCell>
                <TableCell className="text-sm">{r.origin}</TableCell>
                <TableCell className="text-sm">{r.destination}</TableCell>
                <TableCell className="capitalize text-sm">{r.mode}</TableCell>
                <TableCell className="text-sm">{r.client}</TableCell>
                <TableCell className="text-right tabular text-sm">{r.containers}</TableCell>
                <TableCell className="text-right tabular text-sm">${r.revenue.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={cn(
                    "rounded px-2 py-0.5 text-[10px] uppercase tracking-wider",
                    r.sla === "on-time" && "bg-emerald-500/20 text-emerald-300",
                    r.sla === "late" && "bg-rose-500/20 text-rose-300",
                    r.sla === "early" && "bg-sky-500/20 text-sky-300",
                  )}>{r.sla}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn("mt-1 font-display tabular text-2xl font-semibold", accent)}>
        {value}
      </div>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
