import { drawBox, drawRect, drawTile, iso, WORLD, type Pt } from "./scene";
import type { Container, Ship, Vehicle, Zone, ZoneId } from "@/lib/sim/types";

const C = {
  waterDeep: "#0a1628",
  waterShallow: "#0f2238",
  shore: "#1a2540",
  ground: "#1c2540",
  groundLine: "#243155",
  warehouseTop: "#2a3458",
  warehouseLeft: "#1c2444",
  warehouseRight: "#222c4e",
  zoneFloor: "#1a2238",
  rail: "#3a3f55",
  road: "#15203a",
  roadLine: "#2c3a5c",
  containerTop: "#f59e0b",
  containerLeft: "#a55b06",
  containerRight: "#c47208",
  shipHull: "#0e1a2e",
  shipDeck: "#1a2a44",
  craneSteel: "#cbd5e1",
  craneShadow: "#475569",
  truckBody: "#22d3ee",
  truckDark: "#0e7490",
  trainBody: "#a78bfa",
  trainDark: "#5b21b6",
  text: "#cbd5e1",
};

const KIND_COLOR: Record<string, string> = {
  electronics: "#22d3ee",
  produce: "#10b981",
  machinery: "#f59e0b",
  textiles: "#a78bfa",
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

// ------- background -------
export function drawSea(ctx: CanvasRenderingContext2D, time: number) {
  const { sea } = WORLD;
  for (let y = sea.y0; y < sea.y1; y++) {
    for (let x = sea.x0; x < sea.x1; x++) {
      const wave = Math.sin((x + y) * 0.7 + time * 1.4) * 0.5 + 0.5;
      const fill = wave > 0.6 ? C.waterShallow : C.waterDeep;
      drawTile(ctx, { x, y }, fill);
    }
  }
  // shimmer lines
  ctx.strokeStyle = "rgba(125,200,255,0.06)";
  ctx.lineWidth = 1;
  for (let y = sea.y0; y < sea.y1; y += 2) {
    const p1 = iso({ x: sea.x0, y: y + (time * 0.3) % 1 });
    const p2 = iso({ x: sea.x1, y: y + (time * 0.3) % 1 });
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

export function drawGround(ctx: CanvasRenderingContext2D) {
  // Land area east of the sea
  const x0 = 9,
    y0 = 0,
    x1 = 28,
    y1 = 18;
  drawRect(ctx, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, C.ground);
  // grid lines
  ctx.strokeStyle = C.groundLine;
  ctx.lineWidth = 0.6;
  for (let x = x0; x <= x1; x++) {
    const a = iso({ x, y: y0 });
    const b = iso({ x, y: y1 });
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (let y = y0; y <= y1; y++) {
    const a = iso({ x: x0, y });
    const b = iso({ x: x1, y });
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

export function drawQuays(ctx: CanvasRenderingContext2D) {
  for (const q of WORLD.quays) {
    drawBox(ctx, { x: q.x, y: q.y }, q.w, q.h, 4, "#3b455f", "#222a44", "#2b3450");
  }
}

export function drawRail(ctx: CanvasRenderingContext2D) {
  const r = WORLD.rail;
  drawRect(ctx, r, "#23304f", C.rail);
  // sleepers
  ctx.strokeStyle = "#5a6378";
  ctx.lineWidth = 1;
  for (let x = r.x; x < r.x + r.w; x += 0.4) {
    const a = iso({ x, y: r.y + 0.15 });
    const b = iso({ x, y: r.y + r.h - 0.15 });
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  // rails
  ctx.strokeStyle = "#9aa3b7";
  ctx.lineWidth = 1.5;
  for (const dy of [0.3, 0.7]) {
    const a = iso({ x: r.x, y: r.y + dy });
    const b = iso({ x: r.x + r.w, y: r.y + dy });
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

export function drawTruckYard(ctx: CanvasRenderingContext2D) {
  drawRect(ctx, WORLD.truckYard, C.road, C.roadLine);
  drawRect(ctx, WORLD.road, C.road, C.roadLine);
  // bay markings
  ctx.strokeStyle = "#3b4a6d";
  ctx.setLineDash([4, 4]);
  for (const s of WORLD.truckSlots) {
    const a = iso({ x: s.x - 0.1, y: s.y });
    const b = iso({ x: s.x - 0.1, y: s.y + 1.5 });
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

export function drawWarehouse(ctx: CanvasRenderingContext2D, zones: Record<ZoneId, Zone>, showHeat: boolean) {
  const w = WORLD.warehouse;
  // floor
  drawBox(ctx, { x: w.x, y: w.y }, w.w, w.h, 1, C.warehouseTop, C.warehouseLeft, C.warehouseRight);
  // zone tinted floors
  (Object.keys(WORLD.zones) as ZoneId[]).forEach((id) => {
    const z = WORLD.zones[id];
    const utilization = zones[id].stored / zones[id].capacity;
    const heatAlpha = showHeat ? 0.15 + utilization * 0.55 : 0.18;
    drawRect(
      ctx,
      { x: z.x, y: z.y, w: z.w, h: z.h },
      hexA(z.color, heatAlpha),
      hexA(z.color, 0.4),
    );
    // label
    const p = iso({ x: z.x + z.w / 2 - 0.4, y: z.y + z.h / 2 - 0.2 });
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "600 11px 'Space Grotesk', sans-serif";
    ctx.fillText(`ZONE ${id}`, p.x, p.y - 8);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(`${Math.round(utilization * 100)}%`, p.x, p.y + 4);

    // stack containers proportional to stored
    const stacks = Math.min(z.w * z.h, Math.ceil(zones[id].stored / 4));
    let placed = 0;
    for (let yy = 0; yy < z.h && placed < stacks; yy++) {
      for (let xx = 0; xx < z.w && placed < stacks; xx++) {
        const baseX = z.x + xx + 0.15;
        const baseY = z.y + yy + 0.15;
        const tall = 4 + ((xx + yy + id.charCodeAt(0)) % 3) * 3;
        drawBox(
          ctx,
          { x: baseX, y: baseY },
          0.7,
          0.7,
          tall,
          z.color,
          shade(z.color, -30),
          shade(z.color, -15),
        );
        placed++;
      }
    }
  });
}

// ------- ships -------
export function drawShip(ctx: CanvasRenderingContext2D, ship: Ship, time: number) {
  const dock = WORLD.shipDock[ship.quay];
  let pos: Pt;
  if (ship.state === "approaching") {
    pos = lerpPt(WORLD.shipApproach, dock, ship.t);
  } else if (ship.state === "docked") {
    pos = dock;
  } else {
    pos = lerpPt(dock, WORLD.shipDepart, ship.t);
  }
  const bob = Math.sin(time * 1.2 + ship.quay * 1.7) * 0.6;

  // wake trail when moving
  if (ship.state !== "docked") {
    drawWake(ctx, pos, ship.state === "departing" ? -1 : 1, time);
  }

  const hull = drawShipHullAt(ctx, pos, bob, ship);
  if (ship.state === "docked") {
    const p = iso({ x: pos.x, y: pos.y });
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "600 11px 'Space Grotesk', sans-serif";
    ctx.fillText(ship.name, p.x - 18, p.y - 58 + bob);
  }
  return hull;
}

function drawWake(ctx: CanvasRenderingContext2D, pos: Pt, dir: number, time: number) {
  ctx.save();
  ctx.fillStyle = "rgba(180,210,255,0.18)";
  for (let i = 1; i < 6; i++) {
    const p = iso({ x: pos.x + dir * i * 0.6, y: pos.y });
    const rx = 14 + i * 3;
    const ry = 3 + i * 0.6;
    const a = 0.18 - i * 0.025 + Math.sin(time * 4 + i) * 0.01;
    ctx.fillStyle = `rgba(180,210,255,${Math.max(0, a)})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 4, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawShipHullAt(ctx: CanvasRenderingContext2D, pos: Pt, bob: number, ship: Ship) {
  // Hull footprint with a tapered bow.
  const sx = 3.6;
  const sy = 1.0;
  const hullH = 10;
  const deckH = 4;

  const sternL = iso({ x: pos.x - sx / 2, y: pos.y - sy / 2 });
  const sternR = iso({ x: pos.x - sx / 2, y: pos.y + sy / 2 });
  const midR = iso({ x: pos.x + sx / 2 - 0.4, y: pos.y + sy / 2 });
  const midL = iso({ x: pos.x + sx / 2 - 0.4, y: pos.y - sy / 2 });
  // bow tip (single point ahead)
  const bow = iso({ x: pos.x + sx / 2 + 0.3, y: pos.y });

  // soft shadow on water
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(
    (sternL.x + bow.x) / 2,
    (sternR.y + sternL.y) / 2 + 8,
    Math.abs(bow.x - sternL.x) / 1.9,
    7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.translate(0, bob);

  // Hull side (right/front-facing)
  ctx.beginPath();
  ctx.moveTo(sternR.x, sternR.y - hullH);
  ctx.lineTo(midR.x, midR.y - hullH);
  ctx.lineTo(bow.x, bow.y - hullH * 0.7);
  ctx.lineTo(bow.x, bow.y);
  ctx.lineTo(midR.x, midR.y);
  ctx.lineTo(sternR.x, sternR.y);
  ctx.closePath();
  ctx.fillStyle = shade(C.shipHull, 12);
  ctx.fill();
  ctx.strokeStyle = "#05101e";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Hull side (left/back-facing) — darker
  ctx.beginPath();
  ctx.moveTo(sternL.x, sternL.y - hullH);
  ctx.lineTo(midL.x, midL.y - hullH);
  ctx.lineTo(bow.x, bow.y - hullH * 0.7);
  ctx.lineTo(bow.x, bow.y);
  ctx.lineTo(midL.x, midL.y);
  ctx.lineTo(sternL.x, sternL.y);
  ctx.closePath();
  ctx.fillStyle = C.shipHull;
  ctx.fill();
  ctx.stroke();

  // waterline stripe
  ctx.strokeStyle = "rgba(220,235,255,0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(sternR.x, sternR.y - 2);
  ctx.lineTo(midR.x, midR.y - 2);
  ctx.lineTo(bow.x, bow.y - 1);
  ctx.stroke();

  // Deck (top) — quad from stern to bow tip
  ctx.beginPath();
  ctx.moveTo(sternL.x, sternL.y - hullH);
  ctx.lineTo(midL.x, midL.y - hullH);
  ctx.lineTo(bow.x, bow.y - hullH * 0.7);
  ctx.lineTo(midR.x, midR.y - hullH);
  ctx.lineTo(sternR.x, sternR.y - hullH);
  ctx.closePath();
  ctx.fillStyle = C.shipDeck;
  ctx.fill();
  ctx.strokeStyle = "#0a1320";
  ctx.stroke();

  // Cargo hold containers stacked on deck (between stern and 0.6 from bow)
  const stacks = Math.min(8, Math.max(2, ship.containersOnboard / 3));
  const palette = ["#22d3ee", "#f59e0b", "#10b981", "#a78bfa", "#f43f5e"];
  for (let i = 0; i < stacks; i++) {
    const fx = pos.x - sx / 2 + 0.25 + i * 0.38;
    const col = palette[(i + ship.quay) % palette.length];
    drawBox(
      ctx,
      { x: fx, y: pos.y - 0.32 },
      0.32,
      0.64,
      hullH + 4,
      col,
      shade(col, -30),
      shade(col, -15),
    );
    // second stack tier sometimes
    if (i % 2 === 0) {
      drawBox(
        ctx,
        { x: fx, y: pos.y - 0.32 },
        0.32,
        0.64,
        hullH + 8,
        shade(col, 10),
        shade(col, -20),
        shade(col, -5),
      );
    }
  }

  // Superstructure (bridge) at stern
  const bridgeX = pos.x - sx / 2 + 0.1;
  drawBox(
    ctx,
    { x: bridgeX, y: pos.y - 0.42 },
    0.45,
    0.84,
    hullH + deckH + 6,
    "#e2e8f0",
    "#475569",
    "#94a3b8",
  );
  // bridge windows
  const bp = iso({ x: bridgeX + 0.05, y: pos.y - 0.35 });
  ctx.fillStyle = "#0ea5e9";
  ctx.fillRect(bp.x + 2, bp.y - hullH - deckH - 4, 14, 3);

  // smokestack
  const sp = iso({ x: bridgeX + 0.18, y: pos.y - 0.05 });
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(sp.x - 3, sp.y - hullH - deckH - 14, 6, 10);
  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(sp.x - 3, sp.y - hullH - deckH - 10, 6, 2);
  // smoke puffs
  ctx.fillStyle = "rgba(200,210,220,0.35)";
  for (let i = 0; i < 3; i++) {
    const t = (time * 1.5 + i * 0.7) % 3;
    ctx.beginPath();
    ctx.arc(sp.x + t * 4, sp.y - hullH - deckH - 16 - t * 6, 3 + t, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(0, -bob);
  return {
    minX: sternL.x,
    maxX: bow.x,
    minY: sternL.y - hullH - 20,
    maxY: sternR.y + 8,
  };
}


// ------- cranes -------
export function drawCrane(ctx: CanvasRenderingContext2D, idx: number, time: number) {
  const base = WORLD.cranes[idx];
  const p = iso(base);
  // legs
  ctx.strokeStyle = C.craneSteel;
  ctx.lineWidth = 2;
  const legH = 70;
  ctx.beginPath();
  ctx.moveTo(p.x - 14, p.y);
  ctx.lineTo(p.x - 14, p.y - legH);
  ctx.moveTo(p.x + 14, p.y);
  ctx.lineTo(p.x + 14, p.y - legH);
  ctx.stroke();
  // crossbeam
  ctx.beginPath();
  ctx.moveTo(p.x - 22, p.y - legH);
  ctx.lineTo(p.x + 22, p.y - legH);
  ctx.stroke();
  // arm pointed at sea
  ctx.beginPath();
  ctx.moveTo(p.x - 60, p.y - legH);
  ctx.lineTo(p.x + 22, p.y - legH);
  ctx.lineWidth = 3;
  ctx.stroke();
  // trolley sweeping
  const trolley = (Math.sin(time + idx * 1.7) * 0.5 + 0.5);
  const tx = p.x - 60 + trolley * 80;
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(tx - 4, p.y - legH - 4, 8, 6);
  // cable
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1;
  const cableLen = 20 + Math.abs(Math.sin(time * 1.3 + idx)) * 20;
  ctx.beginPath();
  ctx.moveTo(tx, p.y - legH);
  ctx.lineTo(tx, p.y - legH + cableLen);
  ctx.stroke();
  // container at cable end occasionally
  if (Math.sin(time * 1.3 + idx) > 0.2) {
    ctx.fillStyle = C.containerTop;
    ctx.fillRect(tx - 6, p.y - legH + cableLen, 12, 6);
  }
}

// ------- containers in flight -------
export function drawContainer(
  ctx: CanvasRenderingContext2D,
  c: Container,
  shipPosByid: Map<string, Pt>,
  vehiclePosById: Map<string, Pt>,
) {
  let pos: Pt;
  const zoneTarget = zoneCenter(c.zone);
  if (c.stage === 1) {
    const from = shipPosByid.get(c.shipId ?? "") ?? { x: 7, y: 5 };
    pos = lerpPt(from, zoneTarget, c.t);
    // hop arc
    const screen = iso(pos);
    const arc = -Math.sin(c.t * Math.PI) * 20;
    drawBox(
      ctx,
      pos,
      0.6,
      0.6,
      6 - arc,
      KIND_COLOR[c.kind],
      shade(KIND_COLOR[c.kind], -25),
      shade(KIND_COLOR[c.kind], -12),
    );
    return;
  } else if (c.stage === 3) {
    const v = vehiclePosById.get(c.vehicleId ?? "");
    const target = v ?? zoneTarget;
    pos = lerpPt(zoneTarget, target, c.t);
    drawBox(
      ctx,
      pos,
      0.55,
      0.55,
      6,
      KIND_COLOR[c.kind],
      shade(KIND_COLOR[c.kind], -25),
      shade(KIND_COLOR[c.kind], -12),
    );
    return;
  }
  // stages 2 and 4 are represented elsewhere
}

function zoneCenter(id: ZoneId): Pt {
  const z = WORLD.zones[id];
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}

// ------- vehicles -------
export function drawVehicle(ctx: CanvasRenderingContext2D, v: Vehicle): Pt {
  if (v.kind === "truck") {
    const slot = WORLD.truckSlots[v.slot % WORLD.truckSlots.length];
    let pos: Pt;
    if (v.state === "inbound") {
      pos = lerpPt(WORLD.truckEntry, slot, v.t);
    } else if (v.state === "loading") {
      pos = slot;
    } else {
      pos = lerpPt(slot, WORLD.truckExit, v.t);
    }
    // cab + trailer
    drawBox(ctx, { x: pos.x, y: pos.y }, 0.5, 1.4, 8, C.truckBody, C.truckDark, shade(C.truckBody, -15));
    drawBox(ctx, { x: pos.x + 0.55, y: pos.y + 0.2 }, 0.4, 1.0, 7, "#475569", "#1e293b", "#334155");
    if (v.load > 0) {
      drawBox(
        ctx,
        { x: pos.x + 0.02, y: pos.y + 0.05 },
        0.45,
        1.3,
        12,
        C.containerTop,
        C.containerLeft,
        C.containerRight,
      );
    }
    return pos;
  } else {
    // train: long line of flatcars along rail
    const r = WORLD.rail;
    const startX = r.x + 0.5;
    let baseX: number;
    if (v.state === "inbound") {
      baseX = lerp(r.x + r.w + 2, startX, v.t);
    } else if (v.state === "outbound") {
      baseX = lerp(startX, r.x - 4, v.t);
    } else {
      baseX = startX;
    }
    // 4 cars
    for (let i = 0; i < 4; i++) {
      const cx = baseX + i * 1.6;
      drawBox(
        ctx,
        { x: cx, y: r.y + 0.3 },
        1.4,
        0.5,
        6,
        i === 0 ? C.trainBody : "#475569",
        i === 0 ? C.trainDark : "#1e293b",
        i === 0 ? shade(C.trainBody, -15) : "#334155",
      );
      if (v.load > i * 4) {
        drawBox(
          ctx,
          { x: cx + 0.1, y: r.y + 0.35 },
          1.2,
          0.4,
          8,
          C.containerTop,
          C.containerLeft,
          C.containerRight,
        );
      }
    }
    return { x: baseX, y: r.y + 0.5 };
  }
}

// ------- utils -------
function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function shade(hex: string, percent: number) {
  const h = hex.replace("#", "");
  const r = clamp(parseInt(h.slice(0, 2), 16) + percent);
  const g = clamp(parseInt(h.slice(2, 4), 16) + percent);
  const b = clamp(parseInt(h.slice(4, 6), 16) + percent);
  return `rgb(${r},${g},${b})`;
}
function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}

export { zoneCenter };
