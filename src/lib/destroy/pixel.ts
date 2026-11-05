// Tiny pixel-art toolkit. Sprites are authored as text grids: one character per
// pixel, looked up in PALETTE. '.' (or space) is transparent.

export const PALETTE: Record<string, string> = {
  k: "#1a1c2c", // outline / near-black
  w: "#ffffff",
  g: "#c2c3c7", // light gray
  G: "#8b9bb4", // mid gray-blue
  d: "#5a6988", // dark gray-blue
  s: "#f5c79e", // skin light
  S: "#c68642", // skin dark
  t: "#e8b796", // tan / sand
  b: "#b86f50", // brown
  B: "#743f39", // dark brown
  r: "#e43b44", // red
  R: "#a22633", // dark red
  o: "#f77622", // orange
  y: "#fee761", // yellow
  Y: "#feae34", // gold
  l: "#63c74d", // green
  L: "#265c42", // dark green
  c: "#2ce8f5", // cyan
  u: "#0099db", // blue
  U: "#124e89", // dark blue
  p: "#b55088", // purple
  P: "#68386c", // dark purple
  n: "#f6757a", // pink
  f: "#fff4c2", // pale fire / glow
};

export type Frame = string[];

export interface SpriteDef {
  /** One or more frames; every row in every frame must be the same width. */
  frames: Frame[];
  /** Playback speed when looped. */
  fps?: number;
}

export interface EffectArt {
  id: string;
  name: string;
  emoji: string;
  bible: boolean;
  /** 'letter' = acts on letters one at a time; 'word' = acts on the whole word. */
  mode: "letter" | "word";
  /** Short description of the choreography, used by the gallery + as a spec. */
  story: string;
  sprites: Record<string, SpriteDef>;
}

export function validateSprite(name: string, sprite: SpriteDef): string[] {
  const errors: string[] = [];
  const h = sprite.frames[0]?.length ?? 0;
  const w = sprite.frames[0]?.[0]?.length ?? 0;
  if (!h || !w) errors.push(`${name}: empty sprite`);
  sprite.frames.forEach((frame, fi) => {
    if (frame.length !== h) errors.push(`${name}[${fi}]: ${frame.length} rows, expected ${h}`);
    frame.forEach((row, ri) => {
      if (row.length !== w) errors.push(`${name}[${fi}] row ${ri}: width ${row.length}, expected ${w}`);
      for (const ch of row) {
        if (ch !== "." && ch !== " " && !(ch in PALETTE)) {
          errors.push(`${name}[${fi}] row ${ri}: unknown color '${ch}'`);
        }
      }
    });
  });
  return errors;
}

export function validateEffect(effect: EffectArt): string[] {
  return Object.entries(effect.sprites).flatMap(([name, s]) =>
    validateSprite(`${effect.id}.${name}`, s)
  );
}

const cache = new Map<string, HTMLCanvasElement>();

/** Draws a frame at 1px-per-pixel; scale it up with CSS + image-rendering: pixelated. */
export function frameToCanvas(frame: Frame): HTMLCanvasElement {
  const key = frame.join("\n");
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = frame[0].length;
  canvas.height = frame.length;
  const ctx = canvas.getContext("2d")!;
  frame.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = PALETTE[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  cache.set(key, canvas);
  return canvas;
}

export function frameToDataURL(frame: Frame): string {
  return frameToCanvas(frame).toDataURL();
}

/** Horizontally mirror a frame (for sprites that need to face the other way). */
export function flipX(frame: Frame): Frame {
  return frame.map((row) => row.split("").reverse().join(""));
}
