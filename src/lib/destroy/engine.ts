// Runs a "word destroyer" effect on a real word in the page.
//
// Sprites live in a fixed, full-screen overlay so they can fly anywhere without
// causing scrollbars. All coordinates an effect works with are relative to the
// word's top-left corner, in CSS pixels. Letters are the real glyph elements and
// are animated in place with the Web Animations API, so the underlines stay put.

import { EFFECT_ART } from "./art";
import { frameToDataURL, type EffectArt, type SpriteDef } from "./pixel";
import { CHOREOGRAPHY } from "./effects";

/** CSS pixels per sprite pixel. */
export const PX = 3;

export interface Pose {
  x: number;
  y: number;
  rot: number; // degrees
  scale: number;
  flip: boolean; // mirror horizontally
  opacity: number;
}

export interface SpawnOpts extends Partial<Pose> {
  /** Which point of the sprite sits at (x, y): [0,0] top-left, [0.5,1] bottom-center (default). */
  anchor?: [number, number];
  fps?: number;
  /** Stack order inside the overlay; higher is on top. */
  z?: number;
  /** Pixel scale override (defaults to PX). */
  px?: number;
}

let layer: HTMLElement | null = null;

function getLayer(): HTMLElement {
  if (!layer || !layer.isConnected) {
    layer = document.createElement("div");
    layer.className = "destroy-layer";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      overflow: "hidden",
      zIndex: "40",
    });
    document.body.appendChild(layer);
  }
  return layer;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** A positioned thing in the overlay: a sprite, a tiled strip, or text. */
export class Node {
  /** Where the node rests (or will rest once the current move finishes); see `now` for mid-move. */
  pose: Pose;
  private timers: number[] = [];
  private flight?: { anim: Animation; poses: Pose[]; offsets: number[] };
  private gen = 0;

  constructor(
    public el: HTMLElement,
    public w: number,
    public h: number,
    public anchor: [number, number],
    pose: Partial<Pose>,
    private stage: Stage
  ) {
    this.pose = { x: 0, y: 0, rot: 0, scale: 1, flip: false, opacity: 1, ...pose };
    Object.assign(el.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: `${w}px`,
      height: `${h}px`,
      maxWidth: "none", // Tailwind preflight caps images at 100% of a zero-width parent
      transformOrigin: `${anchor[0] * 100}% ${anchor[1] * 100}%`,
      imageRendering: "pixelated",
    });
    this.apply();
    stage.add(this);
  }

  transformOf(p: Pose): string {
    const tx = p.x - this.anchor[0] * this.w;
    const ty = p.y - this.anchor[1] * this.h;
    return `translate(${tx}px, ${ty}px) rotate(${p.rot}deg) scale(${p.flip ? -p.scale : p.scale}, ${p.scale})`;
  }

  protected apply() {
    this.el.style.transform = this.transformOf(this.pose);
    this.el.style.opacity = String(this.pose.opacity);
  }

  /** The pose right now, even halfway through a move. */
  get now(): Pose {
    const f = this.flight;
    if (!f) return { ...this.pose };
    const p = Number(f.anim.effect?.getComputedTiming().progress ?? 1);
    let k = 0;
    while (k < f.offsets.length - 2 && p > f.offsets[k + 1]) k++;
    const span = f.offsets[k + 1] - f.offsets[k] || 1;
    const t = (p - f.offsets[k]) / span;
    const a = f.poses[k];
    const b = f.poses[k + 1];
    const lerp = (x: number, y: number) => x + (y - x) * t;
    return {
      x: lerp(a.x, b.x),
      y: lerp(a.y, b.y),
      rot: lerp(a.rot, b.rot),
      scale: lerp(a.scale, b.scale),
      opacity: lerp(a.opacity, b.opacity),
      flip: t < 0.5 ? a.flip : b.flip,
    };
  }

  /** Stop any move in progress, freezing the node where it currently is. */
  private land() {
    if (!this.flight) return;
    this.pose = this.now;
    this.flight.anim.cancel();
    this.flight = undefined;
    this.gen++;
    this.apply();
  }

  /** Jump to a pose instantly. */
  set(p: Partial<Pose>): this {
    this.land();
    Object.assign(this.pose, p);
    this.apply();
    return this;
  }

  /** Animate to a pose. */
  to(p: Partial<Pose>, ms: number, easing = "linear"): Promise<void> {
    return this.path([p], ms, easing);
  }

  /**
   * Animate through several poses, evenly spaced in time (or at explicit offsets 0..1).
   * Starting a new move mid-move picks up from wherever the node is right now; the
   * interrupted move's promise resolves early.
   */
  async path(points: (Partial<Pose> & { offset?: number })[], ms: number, easing = "linear"): Promise<void> {
    this.land();
    const poses: Pose[] = [{ ...this.pose }];
    const offsets: (number | undefined)[] = [0];
    for (const pt of points) {
      const { offset, ...rest } = pt;
      poses.push({ ...poses[poses.length - 1], ...rest });
      offsets.push(offset);
    }
    const filled = fillOffsets(offsets);
    const frames: Keyframe[] = poses.map((p, i) => ({
      transform: this.transformOf(p),
      opacity: p.opacity,
      offset: filled[i],
    }));
    const anim = this.el.animate(frames, { duration: Math.max(1, ms), easing, fill: "forwards" });
    const gen = ++this.gen;
    this.flight = { anim, poses, offsets: filled };
    await anim.finished.catch(() => {});
    if (gen !== this.gen) return; // interrupted by a newer move or set()
    this.flight = undefined;
    this.pose = poses[poses.length - 1];
    if (this.el.isConnected) {
      this.apply();
      anim.cancel();
    }
  }

  /** Raw Web Animations access for things like flicker or wobble. */
  animate(keyframes: Keyframe[], opts: KeyframeAnimationOptions): Promise<void> {
    return this.el.animate(keyframes, opts).finished.then(() => {}, () => {});
  }

  addTimer(id: number) {
    this.timers.push(id);
  }

  clearTimers() {
    this.timers.forEach((t) => clearInterval(t));
    this.timers = [];
  }

  remove() {
    this.clearTimers();
    this.el.remove();
    this.stage.forget(this);
  }

  async fadeOut(ms = 250) {
    await this.to({ opacity: 0 }, ms);
    this.remove();
  }
}

/** A sprite whose frames can be swapped between the effect's named sprites. */
export class Sprite extends Node {
  private def!: SpriteDef;
  private loop?: number;
  private px: number;

  constructor(
    stage: Stage,
    private art: EffectArt,
    name: string,
    opts: SpawnOpts
  ) {
    const def = lookup(art, name);
    const px = opts.px ?? PX;
    const img = document.createElement("img");
    img.alt = "";
    super(img, def.frames[0][0].length * px, def.frames[0].length * px, opts.anchor ?? [0.5, 1], opts, stage);
    this.px = px;
    img.style.zIndex = String(opts.z ?? 1);
    this.show(name, opts.fps);
  }

  /** Switch to another named sprite and loop it (single-frame sprites just display). */
  show(name: string, fps?: number): this {
    this.use(name);
    this.stopLoop();
    this.setFrame(0);
    if (this.def.frames.length > 1) {
      let i = 0;
      this.loop = window.setInterval(() => {
        i = (i + 1) % this.def.frames.length;
        this.setFrame(i);
      }, 1000 / (fps ?? this.def.fps ?? 6));
      this.addTimer(this.loop);
    }
    return this;
  }

  /** Play a named sprite's frames once and hold the last one. */
  async once(name: string, fps?: number): Promise<void> {
    this.use(name);
    this.stopLoop();
    const step = 1000 / (fps ?? this.def.fps ?? 6);
    for (let i = 0; i < this.def.frames.length; i++) {
      this.setFrame(i);
      await sleep(step);
    }
  }

  /** Show a specific frame of the current sprite and stop looping. */
  hold(frame: number): this {
    this.stopLoop();
    this.setFrame(frame);
    return this;
  }

  /** Switch sprite definitions, resizing the element if the new sprite is a different size. */
  private use(name: string) {
    this.def = lookup(this.art, name);
    const w = this.def.frames[0][0].length * this.px;
    const h = this.def.frames[0].length * this.px;
    if (w !== this.w || h !== this.h) {
      this.w = w;
      this.h = h;
      this.el.style.width = `${w}px`;
      this.el.style.height = `${h}px`;
      this.apply();
    }
  }

  private setFrame(i: number) {
    (this.el as HTMLImageElement).src = frameToDataURL(this.def.frames[i % this.def.frames.length]);
  }

  private stopLoop() {
    if (this.loop) clearInterval(this.loop);
    this.loop = undefined;
  }
}

/** Fill in missing keyframe offsets the way Web Animations does: evenly between known ones. */
function fillOffsets(offsets: (number | undefined)[]): number[] {
  const out = [...offsets];
  out[0] = out[0] ?? 0;
  out[out.length - 1] = out[out.length - 1] ?? 1;
  for (let i = 1; i < out.length; i++) {
    if (out[i] !== undefined) continue;
    let j = i;
    while (out[j] === undefined) j++;
    const a = out[i - 1]!;
    const b = out[j]!;
    for (let k = i; k < j; k++) out[k] = a + ((b - a) * (k - i + 1)) / (j - i + 1);
    i = j;
  }
  return out as number[];
}

function lookup(art: EffectArt, name: string): SpriteDef {
  const def = art.sprites[name];
  if (!def) throw new Error(`Effect '${art.id}' has no sprite '${name}'`);
  return def;
}

export class Letter {
  constructor(
    public el: HTMLElement,
    public index: number,
    public char: string,
    /** Glyph box, word-relative. */
    public x: number,
    public y: number,
    public w: number,
    public h: number
  ) {}

  get cx() {
    return this.x + this.w / 2;
  }
  get cy() {
    return this.y + this.h / 2;
  }
  get right() {
    return this.x + this.w;
  }
  get bottom() {
    return this.y + this.h;
  }

  animate(keyframes: Keyframe[], opts: KeyframeAnimationOptions = {}): Promise<void> {
    const anim = this.el.animate(keyframes, { fill: "forwards", ...opts });
    return anim.finished.then(() => {}, () => {});
  }

  /** Quick shake in place. */
  shake(ms = 250, px = 3): Promise<void> {
    return this.animate(
      [
        { transform: "translateX(0)" },
        { transform: `translateX(-${px}px)` },
        { transform: `translateX(${px}px)` },
        { transform: `translateX(-${px}px)` },
        { transform: "translateX(0)" },
      ],
      { duration: ms, fill: "none" }
    );
  }

  /** Make it vanish right now (no animation). */
  hide() {
    this.el.animate([{ opacity: 0 }], { fill: "forwards", duration: 0 });
  }
}

export class Stage {
  root: HTMLElement;
  nodes = new Set<Node>();

  constructor(left: number, top: number) {
    this.root = document.createElement("div");
    Object.assign(this.root.style, { position: "absolute", left: `${left}px`, top: `${top}px` });
    getLayer().appendChild(this.root);
  }

  add(n: Node) {
    this.nodes.add(n);
    this.root.appendChild(n.el);
  }

  forget(n: Node) {
    this.nodes.delete(n);
  }

  destroy() {
    this.nodes.forEach((n) => n.clearTimers());
    this.root.remove();
  }
}

export interface StripOpts extends SpawnOpts {
  /** Lay tiles out horizontally (default) or vertically. */
  axis?: "x" | "y";
}

/** Everything a choreography needs. */
export class Ctx {
  /** Word size in CSS px. */
  W: number;
  H: number;

  constructor(
    public art: EffectArt,
    public stage: Stage,
    public letters: Letter[],
    word: DOMRect
  ) {
    this.W = word.width;
    this.H = word.height;
  }

  /** y of the letters' baseline area (bottom of the glyph boxes, just above the underline). */
  get bottom() {
    return Math.max(...this.letters.map((l) => l.bottom), this.H);
  }
  get top() {
    return Math.min(...this.letters.map((l) => l.y), 0);
  }
  get midY() {
    return (this.top + this.bottom) / 2;
  }
  get midX() {
    return this.W / 2;
  }

  /**
   * How long to spend per letter so the whole effect stays snappy:
   * `base` ms per letter, shrunk so letters × per-letter stays under `budget`.
   */
  perLetter(base: number, budget = 2600): number {
    return Math.min(base, budget / Math.max(1, this.letters.length));
  }

  sprite(name: string, opts: SpawnOpts = {}): Sprite {
    return new Sprite(this.stage, this.art, name, opts);
  }

  /**
   * Tile sprites to cover `length` px: [start] + mid repeated + [end].
   * Returned node's anchor/pose work like a sprite's.
   */
  strip(parts: { start?: string; mid: string; end?: string }, length: number, opts: StripOpts = {}): Node {
    const px = opts.px ?? PX;
    const axis = opts.axis ?? "x";
    const box = document.createElement("div");
    const size = (name?: string) => {
      if (!name) return [0, 0];
      const f = lookup(this.art, name).frames[0];
      return [f[0].length * px, f.length * px];
    };
    const [sw, sh] = size(parts.start);
    const [mw, mh] = size(parts.mid);
    const [ew, eh] = size(parts.end);
    const along = (wh: number[]) => (axis === "x" ? wh[0] : wh[1]);
    const n = Math.max(1, Math.ceil((length - along([sw, sh]) - along([ew, eh])) / along([mw, mh])));
    const names = [parts.start, ...Array(n).fill(parts.mid), parts.end].filter(Boolean) as string[];

    let offset = 0;
    let cross = 0;
    const children: { img: HTMLImageElement; def: SpriteDef }[] = [];
    for (const name of names) {
      const def = lookup(this.art, name);
      const [w, h] = size(name);
      const img = document.createElement("img");
      img.alt = "";
      Object.assign(img.style, {
        position: "absolute",
        left: axis === "x" ? `${offset}px` : "0",
        top: axis === "y" ? `${offset}px` : "0",
        width: `${w}px`,
        height: `${h}px`,
        maxWidth: "none",
        imageRendering: "pixelated",
      });
      img.src = frameToDataURL(def.frames[0]);
      box.appendChild(img);
      children.push({ img, def });
      offset += axis === "x" ? w : h;
      cross = Math.max(cross, axis === "x" ? h : w);
    }
    box.style.zIndex = String(opts.z ?? 1);
    const node = new Node(
      box,
      axis === "x" ? offset : cross,
      axis === "x" ? cross : offset,
      opts.anchor ?? [0.5, 1],
      opts,
      this.stage
    );
    // Animate multi-frame tiles, each slightly out of phase so it doesn't look stamped.
    children.forEach(({ img, def }, i) => {
      if (def.frames.length < 2) return;
      let f = i % def.frames.length;
      node.addTimer(
        window.setInterval(() => {
          f = (f + 1) % def.frames.length;
          img.src = frameToDataURL(def.frames[f]);
        }, 1000 / (opts.fps ?? def.fps ?? 6))
      );
    });
    return node;
  }

  /** Comic text like "TIMBER!" or "POP". */
  text(str: string, opts: SpawnOpts & { color?: string; size?: number } = {}): Node {
    const el = document.createElement("div");
    const size = opts.size ?? 22;
    el.textContent = str;
    Object.assign(el.style, {
      font: `900 ${size}px/1 "Arial Black", Impact, system-ui, sans-serif`,
      color: opts.color ?? "#feae34",
      whiteSpace: "nowrap",
      textAlign: "center",
      letterSpacing: "1px",
      textShadow:
        "-2px -2px 0 #1a1c2c, 2px -2px 0 #1a1c2c, -2px 2px 0 #1a1c2c, 2px 2px 0 #1a1c2c, 0 3px 0 #1a1c2c",
      zIndex: String(opts.z ?? 5),
    });
    const w = str.length * size * 0.75;
    return new Node(el, w, size, opts.anchor ?? [0.5, 0.5], opts, this.stage);
  }

  /**
   * Spray `count` copies of a sprite out of (x, y). They arc, fall with gravity and fade.
   * Resolves when they're all gone; you usually don't need to await it.
   */
  burst(
    name: string,
    x: number,
    y: number,
    opts: { count?: number; spread?: number; up?: number; fall?: number; ms?: number; px?: number; spin?: boolean } = {}
  ): Promise<void> {
    const { count = 5, spread = 40, up = 30, fall = 40, ms = 600, px, spin = true } = opts;
    const jobs = Array.from({ length: count }, () => {
      const s = this.sprite(name, { x, y, anchor: [0.5, 0.5], px, z: 3 });
      const def = lookup(this.art, name);
      if (def.frames.length > 1) s.hold(Math.floor(Math.random() * def.frames.length));
      const dx = this.rand(-spread, spread);
      const peak = this.rand(up * 0.5, up);
      const rot = spin ? this.rand(-360, 360) : 0;
      const steps = 6;
      const pts = Array.from({ length: steps }, (_, i) => {
        const t = (i + 1) / steps;
        return {
          x: x + dx * t,
          y: y - peak * 4 * t * (1 - t) + fall * t * t,
          rot: rot * t,
          opacity: t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1,
        };
      });
      return s.path(pts, ms * this.rand(0.8, 1.2)).then(() => s.remove());
    });
    return Promise.all(jobs).then(() => {});
  }

  /** Play a sprite once at a spot and remove it (smoke puffs, splashes, pops). */
  async puff(name: string, x: number, y: number, opts: SpawnOpts = {}): Promise<void> {
    const s = this.sprite(name, { x, y, anchor: [0.5, 0.5], z: 4, ...opts });
    if (lookup(this.art, name).frames.length > 1) {
      await s.once(name, opts.fps);
    } else {
      await s.path([{ scale: 1.2, offset: 0.15 }, { scale: 1, y: y - 8, offset: 0.6 }, { y: y - 14, opacity: 0 }], 650);
    }
    s.remove();
  }

  /**
   * Animate every letter as one rigid object (e.g. the whole word toppling),
   * pivoting around a word-relative point.
   */
  rigid(keyframes: Keyframe[], origin: { x: number; y: number }, opts: KeyframeAnimationOptions): Promise<void> {
    return Promise.all(
      this.letters.map((l) => {
        l.el.style.transformOrigin = `${origin.x - l.x}px ${origin.y - l.y}px`;
        return l.animate(keyframes, opts);
      })
    ).then(() => {});
  }

  /** Move every letter by the same offset (for the word riding on/inside something). */
  carry(keyframes: Keyframe[], opts: KeyframeAnimationOptions): Promise<void> {
    return Promise.all(this.letters.map((l) => l.animate(keyframes, opts))).then(() => {});
  }

  wait = sleep;

  rand(a: number, b: number) {
    return a + Math.random() * (b - a);
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

export type Choreography = (c: Ctx) => Promise<void>;

/** Fallback for effects without choreography yet: a puff and fade. */
const fallback: Choreography = async (c) => {
  await Promise.all(
    c.letters.map((l, i) =>
      l.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(0.3) rotate(90deg)" }], {
        duration: 400,
        delay: i * 60,
        easing: "ease-in",
      })
    )
  );
};

export const EFFECT_IDS = EFFECT_ART.map((e) => e.id);

const recent: string[] = [];

/** Random effect, avoiding the last few so a class doesn't see repeats back to back. */
export function pickEffect(): string {
  const pool = EFFECT_IDS.filter((id) => !recent.includes(id));
  const id = pool[Math.floor(Math.random() * pool.length)];
  recent.push(id);
  if (recent.length > Math.min(8, EFFECT_IDS.length - 1)) recent.shift();
  return id;
}

const SAFETY_MS = 7000;

/**
 * Plays an effect on a word element. Letters to destroy are the descendants marked
 * `data-glyph`. Resolves once the effect is over and every glyph is invisible
 * (held by a fill-forwards animation; call `resetGlyphs` to clear).
 */
export async function destroyWord(wordEl: HTMLElement, effectId = pickEffect()): Promise<void> {
  const art = EFFECT_ART.find((e) => e.id === effectId) ?? EFFECT_ART[0];
  const rect = wordEl.getBoundingClientRect();
  const glyphs = Array.from(wordEl.querySelectorAll<HTMLElement>("[data-glyph]"));
  const letters = glyphs.map((el, i) => {
    const r = el.getBoundingClientRect();
    return new Letter(el, i, el.textContent?.trim() ?? "", r.left - rect.left, r.top - rect.top, r.width, r.height);
  });
  const stage = new Stage(rect.left, rect.top);
  const ctx = new Ctx(art, stage, letters, rect);
  const run = CHOREOGRAPHY[art.id] ?? fallback;

  try {
    await Promise.race([run(ctx), sleep(SAFETY_MS)]);
  } catch (err) {
    console.error(`Effect '${art.id}' failed`, err);
  } finally {
    letters.forEach((l) => l.hide());
    stage.destroy();
  }
}

/** Clear any effect animations on a word's glyphs (used when restoring a word). */
export function resetGlyphs(wordEl: HTMLElement) {
  wordEl.querySelectorAll<HTMLElement>("[data-glyph]").forEach((el) => {
    el.getAnimations().forEach((a) => a.cancel());
    el.style.transformOrigin = "";
  });
}
