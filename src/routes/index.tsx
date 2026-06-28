import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/dashboard/TopBar";
import { KpiBar } from "@/components/dashboard/KpiBar";
import { Diorama } from "@/components/diorama/Diorama";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meridian Cargo Ops — Live Operations Dashboard" },
      {
        name: "description",
        content:
          "Real-time operations dashboard for cargo shipping — live diorama of port, warehouse, rail and trucking flow with throughput, SLA, fleet and utilization KPIs.",
      },
      { property: "og:title", content: "Meridian Cargo Ops — Live Operations Dashboard" },
      {
        property: "og:description",
        content:
          "Real-time top-down diorama of cargo flow from ships to warehouse zones to outbound trucks, trains and vessels.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <TopBar />
      <KpiBar />
      <main className="flex-1 overflow-hidden p-3">
        <Diorama />
      </main>
    </div>
  );
}
