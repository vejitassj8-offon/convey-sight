// Isometric scene geometry + drawing helpers
// World is a grid; we project to screen with iso transform.

export const TILE_W = 36;
export const TILE_H = 18;

export interface Pt {
  x: number;
  y: number;
}

export function iso(p: Pt): Pt {
  return {
    x: (p.x - p.y) * (TILE_W / 2),
    y: (p.x + p.y) * (TILE_H / 2),
  };
}

// World layout (tile coords)
export const WORLD = {
  // Sea region (water tiles)
  sea: { x0: -2, y0: 0, x1: 9, y1: 14 },
  // Two quays
  quays: [
    { x: 9, y: 3, w: 1, h: 3 }, // quay 0
    { x: 9, y: 8, w: 1, h: 3 }, // quay 1
  ],
  // Ship docking screen targets (tile coords, ship "anchor")
  shipDock: [
    { x: 7, y: 4.5 },
    { x: 7, y: 9.5 },
  ],
  shipApproach: { x: -3, y: 7 },
  shipDepart: { x: -3, y: 1 },
  // Crane rails along quay
  cranes: [
    { x: 10, y: 4.5 },
    { x: 10, y: 9.5 },
  ],
  // Warehouse footprint
  warehouse: { x: 12, y: 2, w: 10, h: 11 },
  // 4 zones inside warehouse (each 5x5 minus aisle)
  zones: {
    A: { x: 12, y: 2, w: 4, h: 5, color: "#22d3ee" },
    B: { x: 17, y: 2, w: 5, h: 5, color: "#f59e0b" },
    C: { x: 12, y: 8, w: 4, h: 5, color: "#10b981" },
    D: { x: 17, y: 8, w: 5, h: 5, color: "#a78bfa" },
  } as const,
  // Rail spur (north of warehouse)
  rail: { x: 12, y: 0.4, w: 10, h: 1 },
  trainSlots: Array.from({ length: 1 }, (_, i) => ({ x: 13 + i * 2, y: 0.9 })),
  // Truck yard (south of warehouse)
  truckYard: { x: 12, y: 14, w: 10, h: 3 },
  truckSlots: [
    { x: 13.5, y: 14.4 },
    { x: 16, y: 14.4 },
    { x: 18.5, y: 14.4 },
    { x: 21, y: 14.4 },
  ],
  truckEntry: { x: 26, y: 16 },
  truckExit: { x: 26, y: 13 },
  // Road exit
  road: { x: 22, y: 14, w: 6, h: 3 },
};

// ---------- drawing primitives ----------

export function drawTile(
  ctx: CanvasRenderingContext2D,
  p: Pt,
  fill: string,
  stroke?: string,
) {
  const a = iso({ x: p.x, y: p.y });
  const b = iso({ x: p.x + 1, y: p.y });
  const c = iso({ x: p.x + 1, y: p.y + 1 });
  const d = iso({ x: p.x, y: p.y + 1 });
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function drawRect(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; w: number; h: number },
  fill: string,
  stroke?: string,
) {
  const a = iso({ x: r.x, y: r.y });
  const b = iso({ x: r.x + r.w, y: r.y });
  const c = iso({ x: r.x + r.w, y: r.y + r.h });
  const d = iso({ x: r.x, y: r.y + r.h });
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

// Iso "box" (extruded rect) at world tile p, size sx x sy x h (h in screen px)
export function drawBox(
  ctx: CanvasRenderingContext2D,
  p: Pt,
  sx: number,
  sy: number,
  h: number,
  fillTop: string,
  fillLeft: string,
  fillRight: string,
  stroke = "rgba(0,0,0,0.35)",
) {
  const a = iso({ x: p.x, y: p.y });
  const b = iso({ x: p.x + sx, y: p.y });
  const c = iso({ x: p.x + sx, y: p.y + sy });
  const d = iso({ x: p.x, y: p.y + sy });
  // top
  ctx.beginPath();
  ctx.moveTo(a.x, a.y - h);
  ctx.lineTo(b.x, b.y - h);
  ctx.lineTo(c.x, c.y - h);
  ctx.lineTo(d.x, d.y - h);
  ctx.closePath();
  ctx.fillStyle = fillTop;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  // left face (between d & c, down)
  ctx.beginPath();
  ctx.moveTo(d.x, d.y - h);
  ctx.lineTo(c.x, c.y - h);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fillStyle = fillLeft;
  ctx.fill();
  ctx.stroke();
  // right face (between b & c, down)
  ctx.beginPath();
  ctx.moveTo(b.x, b.y - h);
  ctx.lineTo(c.x, c.y - h);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(b.x, b.y);
  ctx.closePath();
  ctx.fillStyle = fillRight;
  ctx.fill();
  ctx.stroke();
}
