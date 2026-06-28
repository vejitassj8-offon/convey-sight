import { Pause, Play, FastForward, Tag, Flame } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { cn } from "@/lib/utils";

export function Controls() {
  const speed = useSim((s) => s.speed);
  const setSpeed = useSim((s) => s.setSpeed);
  const showLabels = useSim((s) => s.showLabels);
  const setShowLabels = useSim((s) => s.setShowLabels);
  const showHeat = useSim((s) => s.showHeat);
  const setShowHeat = useSim((s) => s.setShowHeat);
  const clock = useSim((s) => s.clock);

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border bg-background/70 px-2 py-1.5 backdrop-blur">
      <Btn
        active={speed === 0}
        onClick={() => setSpeed(speed === 0 ? 1 : 0)}
        title={speed === 0 ? "Play" : "Pause"}
      >
        {speed === 0 ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
      </Btn>
      {([1, 2, 5] as const).map((s) => (
        <Btn key={s} active={speed === s} onClick={() => setSpeed(s)}>
          <span className="font-display text-xs">{s}×</span>
        </Btn>
      ))}
      <span className="mx-1 h-4 w-px bg-border" />
      <Btn active={showLabels} onClick={() => setShowLabels(!showLabels)} title="Toggle labels">
        <Tag className="h-3.5 w-3.5" />
      </Btn>
      <Btn active={showHeat} onClick={() => setShowHeat(!showHeat)} title="Toggle heat overlay">
        <Flame className="h-3.5 w-3.5" />
      </Btn>
      <span className="mx-1 h-4 w-px bg-border" />
      <span className="font-display tabular text-[10px] uppercase tracking-widest text-muted-foreground">
        T+{formatClock(clock)}
      </span>
      <FastForward className="ml-1 h-3 w-3 text-primary/60" />
    </div>
  );
}

function Btn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border text-foreground/80 transition-colors",
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-transparent hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function formatClock(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
