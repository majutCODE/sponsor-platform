// Set designs per category: tiles sit on named zones of the real object.
// Coordinates are in each template's own SVG viewBox. Tile order is fixed, so never reorder zones:
// a tile's index is how sold tiles are stored.

export type Slot = { x: number; y: number; w: number; h: number; zone: string; color: string; prime: boolean };
export type Template = {
  key: string;
  viewBox: string;
  width: number;
  /** Silhouette of the object. Tiles are clipped to it. */
  body: string;
  /** Static detail drawn over the tiles (wheels, windows, strings). */
  extra: string;
  /** One drawing per side. Two sides doubles the tile count. */
  sides: string[];
  slots: Slot[];
};

const C = { orange: "#ff5a36", lime: "#c6f45b", yellow: "#ffd23f", pink: "#ff8fd1", blue: "#2b6cff", sky: "#cfe3ff" };
const INK = "#1d1a16";

type Zone = [name: string, color: string, box: { x: number; y: number; w: number; h: number; c: number; r: number }, prime?: boolean];

function slots(zones: Zone[]): Slot[] {
  const out: Slot[] = [];
  const gap = 3;
  for (const [zone, color, z, prime] of zones) {
    const tw = z.w / z.c, th = z.h / z.r;
    for (let r = 0; r < z.r; r++)
      for (let c = 0; c < z.c; c++)
        out.push({ x: z.x + c * tw + gap / 2, y: z.y + r * th + gap / 2, w: tw - gap, h: th - gap, zone, color, prime: !!prime });
  }
  return out;
}

const BOTH = ["Left side", "Right side"];
const ONE = [""];

export const TEMPLATES: Record<string, Template> = {
  car: {
    key: "car", viewBox: "0 0 400 200", width: 400, sides: BOTH,
    body: "M20,150 L28,118 Q38,106 80,101 L135,96 L168,60 Q176,52 196,52 L270,52 Q286,52 298,64 L332,98 L370,104 Q386,110 386,130 L386,150 Z",
    extra: `<path d="M142,97 L171,64 L222,64 L222,97 Z M228,97 L228,64 L281,64 L311,97 Z" fill="${C.sky}" stroke="${INK}" stroke-width="2.5"/><circle cx="95" cy="160" r="24" fill="${INK}"/><circle cx="95" cy="160" r="10" fill="#fff6e5"/><circle cx="318" cy="160" r="24" fill="${INK}"/><circle cx="318" cy="160" r="10" fill="#fff6e5"/>`,
    slots: slots([
      ["Front wing", C.yellow, { x: 36, y: 110, w: 88, h: 26, c: 3, r: 1 }],
      ["Front door", C.orange, { x: 140, y: 101, w: 80, h: 42, c: 2, r: 2 }, true],
      ["Rear door", C.orange, { x: 226, y: 101, w: 80, h: 42, c: 2, r: 2 }, true],
      ["Rear wing", C.pink, { x: 312, y: 110, w: 66, h: 26, c: 2, r: 1 }],
    ]),
  },
  dress: {
    key: "dress", viewBox: "0 0 400 310", width: 400, sides: ONE,
    body: "M168,28 L182,28 L190,56 L210,56 L218,28 L232,28 L242,96 L232,110 L300,280 Q200,296 100,280 L168,110 L158,96 Z",
    extra: "",
    slots: slots([
      ["Bodice", C.orange, { x: 172, y: 62, w: 56, h: 42, c: 2, r: 2 }, true],
      ["Waist sash", C.yellow, { x: 168, y: 110, w: 64, h: 18, c: 3, r: 1 }],
      ["Upper skirt", C.pink, { x: 160, y: 136, w: 80, h: 38, c: 3, r: 1 }],
      ["Mid skirt", C.lime, { x: 142, y: 182, w: 116, h: 38, c: 4, r: 1 }],
      ["Hem", C.blue, { x: 124, y: 230, w: 152, h: 40, c: 5, r: 1 }],
    ]),
  },
  motorbike: {
    key: "motorbike", viewBox: "0 0 400 240", width: 400, sides: BOTH,
    body: "M150,92 Q192,70 240,86 L300,70 L322,90 L302,140 L236,132 L232,160 L162,160 L160,126 L62,120 L86,94 Z",
    extra: `<circle cx="80" cy="185" r="40" fill="none" stroke="${INK}" stroke-width="9"/><circle cx="322" cy="185" r="40" fill="none" stroke="${INK}" stroke-width="9"/><path d="M80,185 L160,140 M322,185 L300,120" stroke="${INK}" stroke-width="6" fill="none"/>`,
    slots: slots([
      ["Fuel tank", C.orange, { x: 160, y: 86, w: 72, h: 34, c: 3, r: 1 }, true],
      ["Front fairing", C.yellow, { x: 244, y: 84, w: 52, h: 44, c: 2, r: 2 }],
      ["Tail", C.pink, { x: 92, y: 98, w: 56, h: 20, c: 2, r: 1 }],
    ]),
  },
  kit: {
    key: "kit", viewBox: "0 0 400 290", width: 400, sides: ONE,
    body: "M150,30 Q200,52 250,30 L322,60 L302,112 L270,100 L270,262 L130,262 L130,100 L98,112 L78,60 Z",
    extra: "",
    slots: slots([
      ["Chest", C.orange, { x: 145, y: 104, w: 110, h: 72, c: 3, r: 2 }, true],
      ["Badge", C.blue, { x: 146, y: 62, w: 30, h: 30, c: 1, r: 1 }],
      ["Badge", C.blue, { x: 224, y: 62, w: 30, h: 30, c: 1, r: 1 }],
      ["Sleeve", C.yellow, { x: 88, y: 66, w: 44, h: 24, c: 2, r: 1 }],
      ["Sleeve", C.yellow, { x: 268, y: 66, w: 44, h: 24, c: 2, r: 1 }],
      ["Lower front", C.lime, { x: 145, y: 190, w: 110, h: 52, c: 3, r: 1 }],
    ]),
  },
  guitar: {
    key: "guitar", viewBox: "0 0 400 260", width: 400, sides: ONE,
    body: "M110,45 A80,85 0 1,0 110,215 Q160,215 180,190 Q205,195 215,195 A60,65 0 1,0 215,65 Q205,65 180,70 Q160,45 110,45 Z M265,120 L360,120 L360,108 L392,104 L392,156 L360,152 L360,140 L265,140 Z",
    extra: `<circle cx="158" cy="130" r="17" fill="${INK}"/><path d="M136,124 L362,124 M136,130 L362,130 M136,136 L362,136" stroke="#6f675b" stroke-width="1"/>`,
    slots: slots([
      ["Lower body", C.orange, { x: 46, y: 72, w: 86, h: 116, c: 2, r: 3 }, true],
      ["Upper body", C.pink, { x: 184, y: 94, w: 66, h: 72, c: 2, r: 2 }],
      ["Headstock", C.blue, { x: 364, y: 112, w: 24, h: 36, c: 1, r: 1 }],
    ]),
  },
};

/** Categories with a set design. "Other" has none and keeps the free grid over the photo. */
const BY_CATEGORY: Record<string, string> = {
  Cars: "car",
  "Prom & formal wear": "dress",
  Motorbikes: "motorbike",
  "Sports kits": "kit",
  Guitars: "guitar",
};

export const templateKeyFor = (category: string): string | undefined => BY_CATEGORY[category];
export const getTemplate = (key: string | undefined): Template | undefined => (key ? TEMPLATES[key] : undefined);
export const tileTotal = (t: Template) => t.slots.length * t.sides.length;

/** "Front door, left side" for a tile index. */
export function describeTile(t: Template, index: number): string {
  const slot = t.slots[index % t.slots.length];
  const side = t.sides[Math.floor(index / t.slots.length)];
  return side ? `${slot.zone}, ${side.toLowerCase()}` : slot.zone;
}
