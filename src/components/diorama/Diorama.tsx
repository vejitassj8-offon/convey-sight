import { useEffect, useRef } from "react";
import { useSim } from "@/lib/sim/store";
import {
  drawCrane,
  drawContainer,
  drawGround,
  drawQuays,
  drawRail,
  drawSea,
  drawShip,
  drawTruckYard,
  drawVehicle,
  drawWarehouse,
} from "./sprites";
import { iso, WORLD, type Pt } from "./scene";
import { Controls } from "./Controls";
import { EntityDetail } from "./EntityDetail";

export function Diorama() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let mounted = true;

    function resize() {
      if (!canvas || !wrap) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = wrap;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    function frame(now: number) {
      if (!mounted || !canvas || !ctx) return;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // tick sim
      useSim.getState().tick(dt);
      const state = useSim.getState();

      const W = canvas.width / (window.devicePixelRatio || 1);
      const H = canvas.height / (window.devicePixelRatio || 1);

      // background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#0a1224");
      grad.addColorStop(1, "#0e1a30");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Camera: center scene
      const centerWorld = iso({ x: 14, y: 8 });
      const scale = Math.min(W / 1100, H / 700, 1.2);
      ctx.save();
      ctx.translate(W / 2 - centerWorld.x * scale, H / 2 - centerWorld.y * scale);
      ctx.scale(scale, scale);

      const time = state.clock;

      // draw order
      drawSea(ctx, time);
      drawGround(ctx);
      drawQuays(ctx);
      drawRail(ctx);
      drawTruckYard(ctx);
      drawWarehouse(ctx, state.zones, state.showHeat);

      // ships first (back-to-front rough order)
      const shipPosById = new Map<string, Pt>();
      for (const sh of state.ships) {
        drawShip(ctx, sh, time);
        const dock = WORLD.shipDock[sh.quay];
        shipPosById.set(sh.id, dock);
      }

      // cranes
      drawCrane(ctx, 0, time);
      drawCrane(ctx, 1, time);

      // vehicles + capture positions
      const vehiclePosById = new Map<string, Pt>();
      for (const v of state.vehicles) {
        const p = drawVehicle(ctx, v);
        vehiclePosById.set(v.id, p);
      }

      // containers in flight
      for (const c of state.containers) {
        drawContainer(ctx, c, shipPosById, vehiclePosById);
      }

      // optional labels
      if (state.showLabels) {
        ctx.fillStyle = "rgba(203,213,225,0.8)";
        ctx.font = "600 10px 'Space Grotesk', sans-serif";
        for (const v of state.vehicles) {
          const p = vehiclePosById.get(v.id);
          if (!p) continue;
          const s = iso(p);
          ctx.fillText(v.name, s.x - 14, s.y - 18);
        }
        // big region labels
        ctx.fillStyle = "rgba(148,163,184,0.7)";
        ctx.font = "600 11px 'Space Grotesk', sans-serif";
        const lab = (txt: string, p: Pt) => {
          const s = iso(p);
          ctx.fillText(txt, s.x, s.y);
        };
        lab("PORT", { x: 8, y: -1 });
        lab("WAREHOUSE", { x: 16, y: 1.2 });
        lab("RAIL SPUR", { x: 21, y: -0.2 });
        lab("TRUCK YARD", { x: 12, y: 17 });
      }

      ctx.restore();

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        lastTimeRef.current = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border bg-card">
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <Controls />
      <Legend />
      <EntityDetail />
    </div>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute right-4 top-4 rounded-lg border bg-background/70 px-3 py-2 text-xs backdrop-blur">
      <div className="mb-1 font-display text-[10px] uppercase tracking-widest text-muted-foreground">
        Cargo flow
      </div>
      <div className="flex flex-col gap-1">
        <Row dot="#22d3ee" label="Electronics" />
        <Row dot="#10b981" label="Produce" />
        <Row dot="#f59e0b" label="Machinery" />
        <Row dot="#a78bfa" label="Textiles" />
      </div>
    </div>
  );
}
function Row({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: dot }} />
      <span className="text-foreground/80">{label}</span>
    </div>
  );
}
