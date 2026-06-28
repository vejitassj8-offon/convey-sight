import { Link } from "@tanstack/react-router";
import { Anchor, Search, Bell, ChevronDown } from "lucide-react";

const NAV = [
  { label: "Operations", to: "/" },
  { label: "Fleet", to: "/" },
  { label: "Warehouse", to: "/" },
  { label: "Reports", to: "/" },
];

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card/60 px-4 backdrop-blur">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Anchor className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-semibold">MERIDIAN</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Cargo Ops
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n, i) => (
            <Link
              key={n.label}
              to={n.to}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent ${
                i === 0 ? "bg-accent text-foreground" : "text-muted-foreground"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border bg-background/60 px-2 py-1.5 text-xs text-muted-foreground md:flex">
          <Search className="h-3.5 w-3.5" />
          <span>Search shipment, vessel, container…</span>
          <kbd className="ml-2 rounded border bg-muted px-1 text-[10px]">⌘K</kbd>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-md border hover:bg-accent">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-md border px-2 py-1">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
            EM
          </div>
          <span className="hidden text-sm md:inline">E. Marlowe</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
