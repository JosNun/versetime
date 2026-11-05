import type { Choreography, Ctx, Letter, Node, Sprite } from "../engine";

const tipBackward = (deg: number) => `perspective(400px) rotateX(${deg}deg)`;

/**
 * A horizontal strip stretched to an arbitrary height (the tractor beam), wrapped so
 * a drop-shadow outline can follow its clipped trapezoid edges.
 */
function tallStrip(c: Ctx, parts: { start?: string; mid: string; end?: string }, width: number, height: number, x: number, y: number): Node {
  const node = c.strip(parts, width, { x, y, anchor: [0.5, 0], z: 2 });
  node.el.querySelectorAll("img").forEach((img) => (img.style.height = `${height}px`));
  node.h = height;
  node.el.style.height = `${height}px`;
  node.set({});
  const wrap = document.createElement("div");
  Object.assign(wrap.style, {
    position: "absolute",
    left: "0",
    top: "0",
    zIndex: "2",
    // Opacity lives on the wrapper so the outline shadows don't stack up inside the beam.
    opacity: "0.65",
    filter: "drop-shadow(2px 0 0 #f77622) drop-shadow(-2px 0 0 #f77622)",
  });
  node.el.replaceWith(wrap);
  wrap.appendChild(node.el);
  return node;
}

/** Letter flashes a color, swells, then pops away. */
function zap(l: Letter, color: string, ms: number) {
  l.el.style.transformOrigin = "center";
  return l.animate(
    [
      { transform: "none", color: "inherit" },
      { transform: "scale(1.3)", color, offset: 0.35 },
      { transform: "scale(0.1) rotate(25deg)", color, opacity: 0 },
    ],
    { duration: ms, easing: "ease-out" }
  );
}

export const FUN_A: Record<string, Choreography> = {
  // Whole word: walk up, chop the first letter three times, TIMBER!, word falls flat backward.
  lumberjack: async (c) => {
    const first = c.letters[0];
    const ground = c.bottom + 2;
    const jack = c.sprite("walk", { x: -90, y: ground, fps: 8 });
    await jack.to({ x: first.x - 24 }, 650);

    jack.show("chop");
    for (let i = 0; i < 3; i++) {
      jack.hold(0);
      await c.wait(200);
      jack.hold(1);
      c.burst("chip", first.x + 4, first.cy + 8, { count: 3, spread: 30, up: 30 });
      c.letters.forEach((l) => l.shake(160, 2));
      await c.wait(180);
    }
    jack.hold(0);

    const timber = c.text("TIMBER!", { x: c.midX, y: c.top - 18, scale: 0 });
    timber.to({ scale: 1 }, 220, "cubic-bezier(.3,1.8,.6,1)");

    await c.rigid(
      [
        { transform: tipBackward(0) },
        { transform: tipBackward(-15), offset: 0.3 },
        { transform: tipBackward(88), opacity: 1, offset: 0.85 },
        { transform: tipBackward(90), opacity: 0 },
      ],
      { x: 0, y: c.bottom },
      { duration: 1000, easing: "ease-in" }
    );
    c.letters.forEach((l) => c.burst("chip", l.cx, ground, { count: 2, spread: 20, up: 16, fall: 10 }));

    timber.fadeOut(300);
    jack.show("walk", 8).set({ flip: true });
    await jack.to({ x: -90, opacity: 0 }, 700);
  },

  // Per letter: worm inches along eating each letter, growing a body segment per letter.
  "hungry-worm": async (c) => {
    const ground = c.bottom + 2;
    const step = c.perLetter(420);
    const head = c.sprite("headClosed", { x: -20, y: ground, z: 3 });
    const tail = c.sprite("tail", { x: -40, y: ground, z: 2 });
    const body: Sprite[] = [];

    const segName = (eaten: number) => (eaten < 3 ? "segS" : eaten < 6 ? "segM" : "segL");
    const gap = (eaten: number) => (eaten < 3 ? 14 : eaten < 6 ? 18 : 22);

    // Lay the body out behind the head; `inch` gives each segment a little hump as it moves.
    const follow = (headX: number, ms: number, eaten: number) => {
      const g = gap(eaten);
      body.forEach((s, i) => s.path([{ x: headX - 22 - i * g, y: ground - 4, offset: 0.5 }, { x: headX - 22 - i * g, y: ground }], ms));
      tail.to({ x: headX - 22 - body.length * g - 2 }, ms);
    };

    for (const [i, l] of c.letters.entries()) {
      const target = l.x - 8;
      head.show("headClosed");
      follow(target, step * 0.45, i);
      await head.path([{ x: (head.pose.x + target) / 2, y: ground - 6 }, { x: target, y: ground }], step * 0.45);

      head.show("headOpen");
      l.el.style.transformOrigin = "left bottom";
      await l.animate([{ transform: "none" }, { transform: "translate(-6px, 4px) scale(0)", opacity: 0 }], {
        duration: step * 0.35,
        easing: "ease-in",
      });
      head.show("headClosed");
      c.burst("crumb", l.x, ground - 6, { count: 2, spread: 12, up: 10, fall: 6, ms: 400 });

      const seg = c.sprite(segName(i), { x: head.pose.x - 22 - body.length * gap(i), y: ground, scale: 0, z: 2 });
      body.push(seg);
      body.forEach((s) => s.show(segName(i + 1)));
      seg.to({ scale: 1 }, step * 0.2, "cubic-bezier(.3,1.8,.6,1)");
      await c.wait(step * 0.2);
    }

    await c.puff("burp", head.pose.x + 20, head.pose.y - 46);
    // Slither off to the right as one piece.
    const dx = c.W + 200 - head.pose.x;
    await Promise.all(
      [head, tail, ...body].map((s) => s.to({ x: s.pose.x + dx, opacity: 0 }, 900, "ease-in"))
    );
  },
  // Per letter: space cadet plants their feet and zaps each letter into pixel bits.
  blaster: async (c) => {
    const ground = c.bottom + 2;
    const first = c.letters[0];
    const per = c.perLetter(300, 2200);
    const cadet = c.sprite("walk", { x: -90, y: ground, fps: 8, z: 3 });
    const standX = first.x - 46;
    await cadet.to({ x: standX }, 600);
    cadet.show("stand");
    await c.wait(150);

    const muzzle = { x: standX + 28, y: ground - 17 };
    const shots: Promise<void>[] = [];
    for (const l of c.letters) {
      c.puff("muzzleFlash", muzzle.x + 4, muzzle.y, { z: 4, fps: 16 });
      cadet.set({ x: standX - 3 }).to({ x: standX }, 90); // recoil
      shots.push(
        (async () => {
          const bolt = c.sprite("bolt", { x: muzzle.x, y: muzzle.y, anchor: [0.5, 0.5], z: 3 });
          const dist = l.cx - muzzle.x;
          await bolt.path([{ x: l.cx, y: l.cy + 4 }], Math.max(70, dist / 2.2));
          bolt.remove();
          c.puff("hit", l.cx, l.cy + 2, { fps: 14, z: 4 });
          c.burst("bits", l.cx, l.cy, { count: 6, spread: 26, up: 24, fall: 30, ms: 550 });
          await zap(l, "#2ce8f5", 220);
        })()
      );
      await c.wait(per);
    }
    await Promise.all(shots);

    // Blow on the blaster (a little hop of pride) and walk off.
    await cadet.path([{ y: ground - 8 }, { y: ground }], 260, "ease-out");
    await c.wait(150);
    cadet.show("walk", 8).set({ flip: true });
    await cadet.to({ x: -110, opacity: 0 }, 650);
  },

  // Whole word: saucer swoops in, beams the word up into itself, zips away.
  "alien-abduction": async (c) => {
    const hoverY = c.top - 46; // saucer's bottom edge
    const saucer = c.sprite("saucer", { x: c.W + 220, y: c.top - 170, z: 4, rot: -12 });
    await saucer.path(
      [
        { x: c.midX + 60, y: hoverY - 30, rot: -6 },
        { x: c.midX, y: hoverY, rot: 0 },
      ],
      750,
      "ease-out"
    );

    const beamW = Math.max(c.W + 70, 90);
    const beamH = c.bottom + 6 - (hoverY - 6);
    const beam = tallStrip(c, { start: "beamLeft", mid: "beamMid", end: "beamRight" }, beamW, beamH, c.midX, hoverY - 6);
    const w = beam.w;
    const topL = ((w / 2 - 22) / w) * 100;
    const topR = ((w / 2 + 22) / w) * 100;
    const shut = `polygon(${topL}% 0%, ${topR}% 0%, ${topR}% 0%, ${topL}% 0%)`;
    const open = `polygon(${topL}% 0%, ${topR}% 0%, 100% 100%, 0% 100%)`;
    beam.el.style.clipPath = open;
    await beam.el.animate([{ clipPath: shut }, { clipPath: open }], { duration: 300, easing: "ease-out" }).finished;

    await Promise.all(c.letters.map((l) => l.shake(300, 2)));

    const sparkles = (async () => {
      for (let i = 0; i < 6; i++) {
        c.puff("sparkle", c.rand(0, c.W), c.rand(c.top, c.bottom), { z: 5, fps: 10 });
        await c.wait(160);
      }
    })();
    await Promise.all(
      c.letters.map((l) => {
        l.el.style.transformOrigin = "center";
        const dx = c.midX - l.cx;
        const dy = hoverY - 4 - l.cy;
        return l.animate(
          [
            { transform: "none" },
            { transform: `translate(${dx * 0.15}px, ${dy * 0.3}px) rotate(${c.rand(-20, 20)}deg) scale(0.9)`, offset: 0.4 },
            { transform: `translate(${dx}px, ${dy}px) rotate(${c.rand(-90, 90)}deg) scale(0.15)`, opacity: 0.6, offset: 0.95 },
            { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 },
          ],
          { duration: 1100, delay: c.rand(0, 150), easing: "ease-in" }
        );
      })
    );
    await sparkles;

    await beam.el.animate([{ clipPath: open }, { clipPath: shut }], { duration: 220, easing: "ease-in", fill: "forwards" }).finished;
    beam.remove();
    await saucer.path([{ y: hoverY + 6 }, { x: c.midX - 40, y: hoverY - 10, rot: -8 }], 260);
    await saucer.to({ x: -260, y: hoverY - 220, rot: -20 }, 450, "ease-in");
    saucer.remove();
  },

  // Per letter: purple critter hops onto each letter and chomps it.
  chomper: async (c) => {
    const ground = c.bottom + 4;
    const step = c.perLetter(420, 2600);
    const chomper = c.sprite("hop", { x: -60, y: ground, z: 3, fps: 10 });

    for (const [i, l] of c.letters.entries()) {
      const from = chomper.pose.x;
      const height = i === 0 ? 46 : 34;
      chomper.show("hop", 10);
      // Rise...
      await chomper.path([{ x: (from + l.cx) / 2, y: ground - height }], step * 0.3, "ease-out");
      // ...open wide and drop onto the letter, swallowing it.
      chomper.show("chomp").hold(0);
      l.el.style.transformOrigin = "center bottom";
      l.animate(
        [
          { transform: "none" },
          { transform: "translateY(-10px) scale(0.6)", offset: 0.6 },
          { transform: "translateY(-14px) scale(0)", opacity: 0 },
        ],
        { duration: step * 0.35, delay: step * 0.1, easing: "ease-in" }
      );
      await chomper.path([{ x: l.cx, y: ground }], step * 0.3, "ease-in");
      chomper.hold(1);
      if (i === 0) c.text("CHOMP!", { x: l.cx, y: ground - 62, size: 16, scale: 0 }).path([{ scale: 1.1, offset: 0.2 }, { scale: 1, offset: 0.7 }, { y: ground - 72, opacity: 0 }], 550);
      c.burst("crumb", l.cx, l.cy + 4, { count: 3, spread: 24, up: 20, fall: 16, ms: 450 });
      await chomper.path([{ scale: 1.12, offset: 0.4 }, { scale: 1 }], step * 0.2);
      await c.wait(step * 0.2);
    }

    // Happy bounce with a heart, then hop off to the right.
    await c.wait(200);
    chomper.show("hop", 10);
    c.puff("heart", chomper.pose.x, ground - 56, { z: 5 });
    await chomper.path([{ y: ground - 20 }, { y: ground }, { y: ground - 12 }, { y: ground }], 500, "ease-in-out");
    const x0 = chomper.pose.x;
    await chomper.path(
      [
        { x: x0 + 40, y: ground - 30 },
        { x: x0 + 80, y: ground },
        { x: x0 + 120, y: ground - 30 },
        { x: x0 + 160, y: ground, opacity: 0 },
      ],
      700
    );
  },

  // Whole word: fins and flames attach, the word rumbles, then blasts off.
  "rocket-launch": async (c) => {
    const ground = c.bottom + 2;
    const first = c.letters[0];
    const last = c.letters[c.letters.length - 1];
    const left = first.x - 2;
    const right = last.right + 2;
    const width = right - left;

    const finL = c.sprite("finLeft", { x: left, y: ground, anchor: [1, 1], scale: 0, z: 3, px: 4 });
    const finR = c.sprite("finRight", { x: right, y: ground, anchor: [0, 1], scale: 0, z: 3, px: 4 });
    finL.to({ scale: 1 }, 250, "cubic-bezier(.3,1.8,.6,1)");
    await finR.to({ scale: 1 }, 250, "cubic-bezier(.3,1.8,.6,1)");

    const flames = c.strip({ start: "flameLeft", mid: "flameMid", end: "flameRight" }, width, {
      x: (left + right) / 2,
      y: ground,
      anchor: [0.5, 0],
      scale: 0.2,
      opacity: 0,
      z: 2,
    });
    await flames.to({ scale: 0.6, opacity: 1 }, 250, "ease-out");

    // Rumble with a 3-2-1 countdown: shaking letters, flames growing, smoke billowing out both sides.
    const COUNT_MS = 380;
    const rumble = Promise.all(c.letters.map((l) => l.shake(COUNT_MS * 3, 2)));
    flames.to({ scale: 1 }, COUNT_MS * 3, "ease-in");
    const smoke = (x: number, side: number, scale = 1, ms = 1400) => {
      const puff = c.sprite("smoke", { x, y: ground + 14, anchor: [0.5, 0.5], z: 1, scale });
      puff.show("smoke", 4);
      puff.to({ x: x + side * c.rand(25, 55), y: ground + c.rand(4, 22), scale: scale * 1.8 }, ms, "ease-out").then(() => puff.fadeOut(300));
    };
    for (const n of ["3", "2", "1"]) {
      c.text(n, { x: c.midX, y: c.top - 22, size: 26, scale: 0 }).path([{ scale: 1.2, offset: 0.25 }, { scale: 1, offset: 0.7 }, { opacity: 0 }], COUNT_MS);
      smoke(left - 12, -1);
      smoke(right + 12, 1);
      await c.wait(COUNT_MS);
    }
    await rumble;
    for (let i = 0; i < 4; i++) smoke(c.rand(left, right), c.pick([-1, 1]), 1.4, 900);

    // Liftoff.
    const lift = -720;
    const easing = "cubic-bezier(.55,0,.85,.35)";
    const ms = 1000;
    finL.to({ y: ground + lift }, ms, easing);
    finR.to({ y: ground + lift }, ms, easing);
    flames.to({ y: ground + lift }, ms, easing);
    await c.carry([{ transform: "none" }, { transform: `translateY(${lift}px)` }], { duration: ms, easing });
    finL.remove();
    finR.remove();
    flames.remove();
    await c.wait(250); // let the launch smoke finish fading
  },

  // Per letter: bulldozer pushes through, tipping each letter into a growing rubble pile.
  bulldozer: async (c) => {
    const ground = c.bottom + 2;
    const step = c.perLetter(280, 2000);
    const BLADE = 33; // blade front, px right of the dozer's center
    const dozer = c.sprite("dozer", { x: -130, y: ground, z: 3, fps: 10 });
    const first = c.letters[0];
    await dozer.to({ x: first.x - BLADE - 2 }, 550, "ease-out");

    let pile: Sprite | null = null;
    const pileName = (n: number) => (n < 3 ? "pileS" : n < 6 ? "pileM" : "pileL");

    for (const [i, l] of c.letters.entries()) {
      const x = l.x + l.w * 0.55 - BLADE;
      l.el.style.transformOrigin = "right bottom";
      l.animate(
        [
          { transform: "none" },
          { transform: "translateX(4px) rotate(30deg)", offset: 0.4 },
          { transform: "translateX(12px) translateY(6px) rotate(90deg) scale(0.6)", opacity: 0 },
        ],
        { duration: step * 0.9, easing: "ease-in" }
      );
      // Sprite.show() keeps the element's size, so swap in a new sprite when the pile grows.
      // (Node tweens also shouldn't overlap — the later one wins — so grow + move happen in one go.)
      if (!pile || pileName(i) !== pileName(i - 1)) {
        const prev = pile;
        pile = c.sprite(pileName(i), { x: prev?.pose.x ?? dozer.pose.x + BLADE, y: ground, anchor: [0, 1], scale: prev ? 0.8 : 0.3, z: 2, px: 4 });
        prev?.remove();
      }
      if (i % 2 === 0) c.puff("dust", x + BLADE + 6, ground - 6, { z: 1, fps: 10, scale: 0.6 });
      await Promise.all([dozer.to({ x }, step), pile.to({ x: x + BLADE, scale: 1 }, step)]);
    }

    // Shove the pile off past the end, poof, then back away.
    const end = dozer.pose.x + 40;
    await Promise.all([dozer.to({ x: end }, 300, "ease-out"), pile?.to({ x: end + BLADE }, 300, "ease-out")]);
    const px = (pile?.pose.x ?? end + BLADE) + 20;
    pile?.fadeOut(200);
    c.puff("dust", px, ground - 12, { z: 4, fps: 8, scale: 1.4 });
    c.puff("dust", px + 18, ground - 6, { z: 4, fps: 8 });
    await c.wait(300);
    await dozer.to({ x: dozer.pose.x - 140, opacity: 0 }, 700, "ease-in");
  },
};
