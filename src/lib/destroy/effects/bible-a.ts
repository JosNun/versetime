import type { Choreography, Ctx, Letter, Node, Sprite } from "../engine";

const tip = (deg: number) => `perspective(400px) rotateX(${deg}deg)`;
const pop = "cubic-bezier(.3,1.8,.6,1)";

/** Run `fn` after `ms` and resolve with its result. */
const after = <T>(c: Ctx, ms: number, fn: () => Promise<T> | T): Promise<T> => c.wait(ms).then(fn);

/** Reveal (or hide) a node with an animated clip-path inset; `from`/`to` are inset() strings. */
const clip = (n: Node, from: string, to: string, ms: number, easing = "ease-out") =>
  n.animate([{ clipPath: `inset(${from})` }, { clipPath: `inset(${to})` }], { duration: ms, easing, fill: "forwards" });

/** Single-frame sprite drifting up and fading (music notes, Zzz). */
const floatAway = (s: Sprite, dx: number, dy: number, ms: number) =>
  s.path([{ x: s.pose.x + dx * 0.5, y: s.pose.y + dy * 0.5, offset: 0.5 }, { x: s.pose.x + dx, y: s.pose.y + dy, opacity: 0 }], ms).then(() => s.remove());

export const BIBLE_A: Record<string, Choreography> = {
  // Whole word: David slings a stone, the word falls flat on its face like Goliath.
  "davids-sling": async (c) => {
    const ground = c.bottom + 2;
    const david = c.sprite("walk", { x: -100, y: ground, z: 3 });
    await david.to({ x: -34 }, 600);

    david.show("swing", 12);
    await c.wait(650);
    david.hold(2);
    const stone = c.sprite("stone", { x: -22, y: ground - 58, anchor: [0.5, 0.5], z: 4 });
    await stone.path([{ x: c.midX * 0.5 - 10, y: c.top - 26 }, { x: c.midX, y: c.midY - 4, rot: 540 }], 380, "ease-in");
    stone.remove();

    c.puff("impact", c.midX, c.midY - 4, { z: 5 });
    c.letters.forEach((l) => l.shake(200, 3));
    await c.wait(220);

    const fall = c.rigid(
      [
        { transform: tip(0) },
        { transform: tip(12), offset: 0.25 },
        { transform: tip(-86), opacity: 1, offset: 0.85 },
        { transform: tip(-90), opacity: 0 },
      ],
      { x: 0, y: c.bottom },
      { duration: 850, easing: "ease-in" }
    );
    david.show("walk", 10);
    await fall;
    for (let i = 0; i < c.letters.length; i += 2) c.puff("dust", c.letters[i].cx + 12, ground - 6);

    await david.path([{ y: ground - 16 }, { y: ground }, { y: ground - 16 }, { y: ground }], 450);
    david.set({ flip: true });
    await david.to({ x: -110, opacity: 0 }, 550);
  },

  // Per letter: a priest marches past blowing the horn; each letter cracks and crumbles into rubble.
  "walls-of-jericho": async (c) => {
    const ground = c.bottom + 2;
    const step = c.perLetter(270, 2200);
    const start = -70;
    const end = c.W + 40;
    const marchMs = ((end - start) / 32) * step;
    const priest = c.sprite("march", { x: start, y: ground, z: 3 });
    const t0 = performance.now();
    const walk = priest.to({ x: end }, marchMs);

    let marching = true;
    const notes = (async () => {
      while (marching) {
        // pose.x only updates when a move finishes, so estimate the horn's position from the clock
        const x = start + (end - start) * Math.min(1, (performance.now() - t0) / marchMs) + 26;
        const n = c.sprite("note", { x, y: ground - 40, anchor: [0.5, 0.5], z: 4 });
        floatAway(n, c.rand(10, 24), -40, 700);
        await c.wait(330);
      }
    })();

    const rubble: Sprite[] = [];
    const crumble = async (l: Letter) => {
      l.shake(220, 3);
      const crack = c.sprite("crack", { x: l.cx, y: l.cy, anchor: [0.5, 0.5], z: 2 }).hold(0);
      await c.wait(130);
      crack.hold(1);
      await c.wait(130);
      crack.remove();
      l.animate([{ transform: "none" }, { transform: "translateY(10px) scaleY(0.4)", opacity: 0 }], {
        duration: 220,
        easing: "ease-in",
      });
      const r = c.sprite("rubble", { x: l.cx, y: ground, scale: 0, z: 2 });
      rubble.push(r);
      r.to({ scale: 1 }, 180, pop);
      c.puff("dust", l.cx, ground - 8);
      c.burst("brick", l.cx, ground - 14, { count: 2, spread: 22, up: 24, fall: 20, ms: 500 });
    };

    await Promise.all(
      // The horn blast hits each letter a little ahead of the priest
      c.letters.map((l) => after(c, (Math.max(0, l.cx - 40 - start) / (end - start)) * marchMs, () => crumble(l)))
    );
    await walk;
    marching = false;
    await notes;
    priest.fadeOut(200);
    await Promise.all(rubble.map((r) => r.fadeOut(350)));
  },

  // Whole word: a big fish leaps out of a wave and swallows the word in one arc.
  "jonahs-big-fish": async (c) => {
    const ground = c.bottom + 2;
    const waveLen = c.W + 80;
    const wave = c.strip({ mid: "wave" }, waveLen, { x: c.midX, y: ground + 34, z: 4, opacity: 0 });
    await wave.to({ y: ground + 16, opacity: 1 }, 300, "ease-out");

    const fishLen = Math.max(110, c.W * 0.7);
    const fish = c.strip({ start: "head_open", mid: "body_tile", end: "tail" }, fishLen, {
      anchor: [0.5, 0.5],
      x: c.W + fishLen * 0.35,
      y: ground + 16,
      rot: 30,
      z: 3,
      opacity: 0,
    });
    const leapMs = 1300;
    const x0 = fish.pose.x;
    const x1 = -fishLen * 0.35;
    const leap = fish.path(
      [
        { opacity: 1, x: x0 - (x0 - x1) * 0.12, y: ground - 4, rot: 22, offset: 0.12 },
        { x: c.midX, y: c.midY - 6, rot: 0, offset: 0.5 },
        { x: x1 + (x0 - x1) * 0.12, y: ground - 4, rot: -22, opacity: 1, offset: 0.88 },
        { x: x1, y: ground + 20, rot: -32, opacity: 0 },
      ],
      leapMs,
      "linear"
    );

    // Each letter disappears into the mouth as the head (left end) reaches it.
    const headAt = (x: number) => (x0 - fishLen / 2 - x) / (x0 - x1);
    await Promise.all([
      leap,
      ...c.letters.map((l) =>
        after(c, Math.max(0, headAt(l.cx)) * leapMs, () =>
          l.animate([{ transform: "none" }, { transform: "translate(-10px, -4px) scale(0.2)", opacity: 0 }], {
            duration: 140,
            easing: "ease-in",
          })
        )
      ),
      after(c, leapMs * 0.85, () => c.puff("splash", x1 + 10, ground + 2, { z: 5 })),
    ]);
    fish.remove();
    await wave.to({ y: ground + 34, opacity: 0 }, 350, "ease-in");
  },

  // Whole word: Moses raises his staff, walls of water crash in from both sides and wash the word away.
  "red-sea": async (c) => {
    const ground = c.bottom + 2;
    const base = ground + 6;
    const L0 = -46;
    const R0 = c.W + 46;
    const mid = c.midX;

    const moses = c.sprite("moses", { x: L0 - 34, y: ground, z: 6, opacity: 0 }).hold(0);
    await moses.to({ opacity: 1 }, 200);
    await c.wait(150);
    moses.hold(1);
    c.letters.forEach((l) => l.shake(300, 2));
    await c.wait(250);

    // Water: 3 rows of tiles behind each wall, revealed with a clip-path as the wall advances.
    const water = (side: "l" | "r") =>
      [0, 24, 39].map((dy) =>
        c.strip({ mid: "water_tile" }, side === "l" ? mid - L0 + 4 : R0 - mid + 4, {
          anchor: side === "l" ? [0, 1] : [1, 1],
          x: side === "l" ? L0 : R0,
          y: base - dy,
          z: 2,
        })
      );
    const leftWater = water("l");
    const rightWater = water("r");
    leftWater.forEach((n) => n.el.style.setProperty("clip-path", "inset(0 100% 0 0)"));
    rightWater.forEach((n) => n.el.style.setProperty("clip-path", "inset(0 0 0 100%)"));
    const wl = c.sprite("wall_left", { anchor: [1, 1], x: L0, y: base, z: 3 });
    const wr = c.sprite("wall_right", { anchor: [0, 1], x: R0, y: base, z: 3 });

    const inMs = 550;
    await Promise.all([
      wl.to({ x: mid + 4 }, inMs, "ease-in"),
      wr.to({ x: mid - 4 }, inMs, "ease-in"),
      ...leftWater.map((n) => clip(n, "0 100% 0 0", "0 0 0 0", inMs, "ease-in")),
      ...rightWater.map((n) => clip(n, "0 0 0 100%", "0 0 0 0", inMs, "ease-in")),
      ...c.letters.map((l) =>
        after(c, inMs * Math.min(1, Math.abs(l.cx - mid) > 0 ? 1 - Math.abs(l.cx - mid) / (mid - L0) : 1) * 0.9, () =>
          l.animate([{ opacity: 1 }, { opacity: 0, transform: "translateY(-6px) rotate(20deg)" }], { duration: 120 })
        )
      ),
    ]);

    c.puff("splash", mid, base - 66, { z: 5, px: 4 });
    c.burst("little_fish", mid, base - 50, { count: 2, spread: 40, up: 40, fall: 30, ms: 650, spin: false });
    await c.wait(450);

    moses.hold(0);
    const outMs = 500;
    await Promise.all([
      wl.to({ x: L0 }, outMs, "ease-in-out"),
      wr.to({ x: R0 }, outMs, "ease-in-out"),
      ...leftWater.map((n) => clip(n, "0 0 0 0", "0 100% 0 0", outMs, "ease-in-out")),
      ...rightWater.map((n) => clip(n, "0 0 0 0", "0 0 0 100%", outMs, "ease-in-out")),
    ]);
    [...leftWater, ...rightWater].forEach((n) => n.remove());
    await Promise.all([wl.fadeOut(150), wr.fadeOut(150), moses.fadeOut(300)]);
  },

  // Per letter: a lion munches each letter, then yawns and falls asleep (God shut the lions' mouths).
  "daniels-lion": async (c) => {
    const ground = c.bottom + 2;
    const step = c.perLetter(340, 2000);
    const lion = c.sprite("walk", { x: -110, y: ground, z: 3 });
    // The mouth sits near the right edge of the 63px-wide sprite.
    const standAt = (l: Letter) => l.cx - 26;
    await lion.to({ x: standAt(c.letters[0]) }, 500);

    for (const l of c.letters) {
      if (Math.abs(lion.pose.x - standAt(l)) > 1) {
        lion.show("walk", 10);
        await lion.to({ x: standAt(l) }, step * 0.35);
      }
      lion.show("chomp", 10);
      l.el.style.transformOrigin = "left center";
      await l.animate(
        [
          { transform: "none" },
          { transform: "translate(-4px, 2px) scale(0.6) rotate(-10deg)", offset: 0.5 },
          { transform: "translate(-10px, 6px) scale(0)", opacity: 0 },
        ],
        { duration: step * 0.55, easing: "ease-in" }
      );
      c.burst("crumb", l.cx - 4, ground - 10, { count: 2, spread: 14, up: 12, fall: 8, ms: 400 });
    }

    lion.show("yawn");
    await lion.path([{ scale: 1.08, offset: 0.4 }, { scale: 1 }], 420);
    lion.show("sleep", 2);
    for (let i = 0; i < 2; i++) {
      const z = c.sprite("zzz", { x: lion.pose.x + 14 + i * 6, y: ground - 34, anchor: [0.5, 0.5], z: 4 });
      floatAway(z, 18, -34, 650);
      await c.wait(260);
    }
    await c.wait(200);
    await lion.fadeOut(350);
  },

  // Per letter: a swarm flies in, nibbles each letter down in three bites, then buzzes off.
  locusts: async (c) => {
    const n = c.letters.length;
    const perLetterCount = n > 6 ? 1 : 2;
    const stagger = c.perLetter(140, 900);
    const bite = 160;

    const swarm = c.letters.flatMap((l, i) =>
      Array.from({ length: perLetterCount }, (_, k) => ({ l, i, k }))
    );

    await Promise.all(
      swarm.map(async ({ l, i, k }) => {
        await c.wait(i * stagger + k * 70);
        const bug = c.sprite("locust", {
          x: -120 + c.rand(-30, 30),
          y: c.top - 70 + c.rand(-30, 20),
          anchor: [0.5, 0.5],
          px: 2,
          z: 3,
        });
        const landX = l.cx + (perLetterCount === 2 ? (k ? 7 : -7) : 0);
        const landY = l.y + 6 + k * 6;
        await bug.path(
          [
            { x: (bug.pose.x + landX) / 2, y: c.top - 40 + c.rand(-30, 30), rot: c.rand(-15, 15) },
            { x: landX, y: landY, rot: 0 },
          ],
          600,
          "ease-out"
        );

        if (k === 0) {
          // The first locust on each letter does the nibbling
          for (const s of [0.66, 0.33, 0]) {
            l.shake(100, 2);
            await c.wait(bite);
            l.el.animate([{ transform: `scale(${s})`, opacity: s ? 1 : 0 }], { duration: 80, fill: "forwards" });
            c.burst("crumb", l.cx, l.cy + 8, { count: 1, spread: 10, up: 6, fall: 20, ms: 400 });
          }
        } else {
          await c.wait(bite * 3);
        }

        await c.wait((n - 1 - i) * stagger * 0.3);
        await bug.path(
          [
            { x: landX + 40, y: landY - 30 + c.rand(-15, 15), rot: -10 },
            { x: c.W + 140 + c.rand(0, 60), y: c.top - 90 + c.rand(-30, 30), rot: -20, opacity: 0 },
          ],
          650,
          "ease-in"
        );
        bug.remove();
      })
    );
  },

  // Per letter: a frog hops under each letter, zaps it with its tongue and hops away.
  frogs: async (c) => {
    const ground = c.bottom + 2;
    const stagger = c.perLetter(150, 900);
    const frogTop = ground + 2;
    const frogBottom = frogTop + 33;
    const mouthY = frogTop + 20;

    await Promise.all(
      c.letters.map(async (l, i) => {
        await c.wait(i * stagger);
        const fromLeft = i % 2 === 0;
        const startX = fromLeft ? -70 : c.W + 70;
        const frog = c.sprite("jump", { x: startX, y: frogBottom, z: 3 });
        await frog.path(
          [
            { x: (startX + l.cx) / 2, y: frogBottom - 46 },
            { x: l.cx, y: frogBottom },
          ],
          380,
          "ease-out"
        );
        frog.show("sit");
        await c.wait(120);

        frog.show("open");
        const tongueLen = Math.max(12, mouthY - l.cy);
        const tongue = c.strip({ start: "tongue_tip", mid: "tongue_tile" }, tongueLen, {
          axis: "y",
          anchor: [0.5, 1],
          x: l.cx,
          y: mouthY,
          z: 2,
        });
        await clip(tongue, "100% 0 0 0", "0 0 0 0", 110, "ease-out");
        // Yank the letter down into the mouth
        l.el.style.transformOrigin = "center";
        await Promise.all([
          l.animate([{ transform: "none" }, { transform: `translateY(${mouthY - l.cy}px) scale(0.2)`, opacity: 0 }], {
            duration: 220,
            easing: "ease-in",
          }),
          clip(tongue, "0 0 0 0", "100% 0 0 0", 220, "ease-in"),
        ]);
        tongue.remove();
        frog.show("sit");
        await frog.path([{ y: frogBottom - 10, scale: 1.08 }, { y: frogBottom, scale: 1 }], 220);

        await c.wait((c.letters.length - 1 - i) * stagger * 0.4);
        frog.show("jump");
        await frog.path(
          [
            { x: l.cx + (fromLeft ? 40 : -40), y: frogBottom - 40 },
            { x: l.cx + (fromLeft ? 90 : -90), y: frogBottom + 6, opacity: 0 },
          ],
          420,
          "ease-in"
        );
        frog.remove();
      })
    );
  },

  // Whole word: Elijah prays, fire falls from a cloud and burns the word to ash.
  "elijahs-fire": async (c) => {
    const ground = c.bottom + 2;
    const elijah = c.sprite("elijah", { x: -56, y: ground, z: 4, opacity: 0 }).hold(0);
    await elijah.to({ opacity: 1 }, 200);

    const cloudY = c.top - 34;
    const cloudW = Math.max(c.W + 24, 72);
    const cloudPart = (w: number, dx: number, dy: number, z: number) =>
      c.strip({ start: "cloud_left", mid: "cloud_mid", end: "cloud_right" }, w, { x: c.midX + dx, y: cloudY + dy - 30, z, opacity: 0 });
    // A bumpy cloud: a long base with two smaller puffs on top so it doesn't read as a bar.
    const puffs = [
      { n: cloudPart(cloudW, 0, 0, 4), dy: 0 },
      { n: cloudPart(Math.max(48, cloudW * 0.45), -cloudW * 0.18, -14, 3), dy: -14 },
      { n: cloudPart(Math.max(40, cloudW * 0.35), cloudW * 0.2, -10, 3), dy: -10 },
    ];
    const cloud = { fadeOut: (ms: number) => Promise.all(puffs.map((p) => p.n.fadeOut(ms))) };
    elijah.hold(1);
    await Promise.all(puffs.map((p) => p.n.to({ y: cloudY + p.dy, opacity: 1 }, 450, "ease-out")));
    await Promise.all(puffs.map((p) => p.n.path([{ x: p.n.pose.x - 3 }, { x: p.n.pose.x + 3 }, { x: p.n.pose.x }], 200)));

    const bolt = c.strip({ mid: "bolt_tile", end: "bolt_tip" }, Math.max(24, c.midY - cloudY + 6), {
      axis: "y",
      anchor: [0.5, 0],
      x: c.midX,
      y: cloudY - 6,
      z: 4,
    });
    c.letters.forEach((l) => l.shake(260, 3));
    await bolt.animate([{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }], {
      duration: 300,
    });
    bolt.remove();

    const flames = c.strip({ mid: "flame_tile" }, c.W + 8, { x: c.midX, y: ground, z: 3, scale: 0.2 });
    flames.to({ scale: 1 }, 200, pop);
    await Promise.all(
      c.letters.map((l, i) =>
        l.animate(
          [
            { color: "#374151", opacity: 1, transform: "none" },
            { color: "#f77622", opacity: 1, transform: "translateY(-2px)", offset: 0.4 },
            { color: "#feae34", opacity: 0, transform: "translateY(-14px) scale(0.6)" },
          ],
          { duration: 900, delay: i * 30, easing: "ease-in" }
        )
      )
    );
    const embers = c.letters.map((l) =>
      c.burst("ember", l.cx, ground - 20, { count: 2, spread: 14, up: 40, fall: -20, ms: 700 })
    );

    const ashes: Sprite[] = [];
    for (let i = 0; i < c.letters.length; i += 2) {
      const l = c.letters[i];
      const right = c.letters[Math.min(i + 1, c.letters.length - 1)];
      ashes.push(c.sprite("ash", { x: (l.cx + right.cx) / 2, y: ground, z: 2 }));
      c.puff("smoke", (l.cx + right.cx) / 2, ground - 30);
    }
    await flames.to({ scale: 0.1, opacity: 0 }, 300, "ease-in");
    flames.remove();
    elijah.hold(0);
    cloud.fadeOut(400);
    await Promise.all(embers);
    await Promise.all([...ashes.map((a) => a.fadeOut(400)), elijah.fadeOut(400)]);
  },
};
