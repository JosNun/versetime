import type { Choreography, Ctx, Letter, Node, Sprite } from "../engine";

/** Where a node actually is right now (mid-animation), word-relative, at its center. */
function livePos(c: Ctx, n: Node) {
  const r = n.el.getBoundingClientRect();
  const s = c.stage.root.getBoundingClientRect();
  return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
}

/** Keep puffing a sprite behind a moving node until `until` settles. */
async function trail(c: Ctx, n: Node, name: string, every: number, until: Promise<unknown>, offset = { x: 0, y: 0 }) {
  let done = false;
  until.then(() => (done = true));
  while (!done && n.el.isConnected) {
    const p = livePos(c, n);
    c.puff(name, p.x + offset.x + c.rand(-6, 6), p.y + offset.y + c.rand(-6, 6), { z: 0 });
    await c.wait(every);
  }
}

/** Is there more room to the right of the word than the left (in the viewport)? */
function roomOnRight(c: Ctx, need: number) {
  const left = c.stage.root.getBoundingClientRect().left;
  const right = window.innerWidth - (left + c.W);
  return right >= need || right >= left;
}

/** The glyph's own text node, so we can swap characters without fighting Svelte. */
function textNode(el: HTMLElement): Text | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n: globalThis.Node | null;
  while ((n = walker.nextNode())) if (n.nodeValue?.trim()) return n as Text;
  return null;
}

const BABBLE = "ЖΩΣΨλЯ¿ЪξΔ#?!&@Ѫ";

export const BIBLE_B: Record<string, Choreography> = {
  // Whole word: fiery chariot swoops in under the word, it hops aboard, and they zoom off to the sky.
  "chariot-of-fire": async (c) => {
    const rideY = c.bottom + 62; // chariot's bottom edge while the word rides on top
    const chariot = c.sprite("chariot", { x: -260, y: c.top - 170, z: 3, rot: 12 });
    const swoop = chariot.path(
      [
        { x: c.midX - 140, y: rideY + 30, rot: 4, offset: 0.6 },
        { x: c.midX, y: rideY, rot: 0 },
      ],
      950,
      "ease-out"
    );
    trail(c, chariot, "flame", 70, swoop, { x: -50, y: 10 });
    await swoop;

    // The word hops up onto the chariot.
    await Promise.all(
      c.letters.map((l, i) =>
        l.animate(
          [{ transform: "none" }, { transform: "translateY(-16px)", offset: 0.5 }, { transform: "translateY(-4px)" }],
          { duration: 320, delay: i * 25, easing: "ease-out" }
        )
      )
    );
    c.puff("sparkle", c.midX - 30, c.top - 10, { z: 5 });
    c.puff("sparkle", c.midX + 40, c.top + 4, { z: 5 });
    await c.wait(150);

    // Up and away together.
    const exit = { x: c.W + 420, y: c.top - 260 };
    const dx = exit.x - c.midX;
    const dy = exit.y - rideY;
    const ms = 1000;
    const zoom = chariot.to({ x: exit.x, y: exit.y, rot: -14 }, ms, "ease-in");
    trail(c, chariot, "flame", 55, zoom, { x: -50, y: 10 });
    await Promise.all([
      zoom,
      ...c.letters.map((l) =>
        l.animate(
          [
            { transform: "translateY(-4px)" },
            { transform: `translate(${dx * 0.7}px, ${dy * 0.7 - 4}px) rotate(-10deg)`, opacity: 1, offset: 0.7 },
            { transform: `translate(${dx}px, ${dy - 4}px) rotate(-14deg)`, opacity: 0 },
          ],
          { duration: ms, easing: "ease-in" }
        )
      ),
    ]);
    chariot.remove();
  },

  // Per letter: pairs of animals give the letters a ride into the ark, then it sails away.
  "noahs-ark": async (c) => {
    const ground = c.bottom + 2;
    const right = roomOnRight(c, 140);
    const dir = right ? 1 : -1;
    const arkX = right ? c.W + 70 : -70;
    const door = arkX - dir * 8;
    const offX = right ? -70 : c.W + 70; // where animals come from

    const ark = c.sprite("ark", { x: arkX + dir * 260, y: ground + 10, flip: !right, z: 2 });
    ark.path([{ x: arkX - dir * 6, y: ground + 6, offset: 0.7 }, { x: arkX, y: ground + 10 }], 700, "ease-out");

    const animals = [
      { name: "giraffe", back: 20 },
      { name: "elephant", back: 25 },
      { name: "sheep", back: 17 },
    ];
    // Letters in walking order: nearest the animals' start first.
    const order = right ? c.letters : [...c.letters].reverse();
    const pairs: Letter[][] = [];
    for (let i = 0; i < order.length; i += 2) pairs.push(order.slice(i, i + 2));
    const stagger = Math.min(450, 1700 / Math.max(1, pairs.length - 1));
    const speed = 0.55; // px per ms

    const boardPair = async (pair: Letter[], p: number) => {
      await c.wait(p * stagger);
      const kind = c.pick(animals);
      const lead = pair[pair.length - 1]; // the letter furthest along
      const walkMs = Math.abs(lead.cx - offX) / speed + 100;
      await Promise.all(
        pair.map(async (l, k) => {
          // The animal for the letter further along starts in front.
          const start = offX - dir * (pair.length - 1 - k) * 40;
          const a = c.sprite(kind.name, { x: start, y: ground, flip: !right, z: 3 });
          await a.to({ x: l.cx }, walkMs);
          a.hold(0);
          // Letter hops onto the animal's back.
          await l.animate(
            [
              { transform: "none" },
              { transform: `translateY(${-kind.back - 18}px)`, offset: 0.5 },
              { transform: `translateY(${-kind.back}px)` },
            ],
            { duration: 280, easing: "ease-out" }
          );
          a.show(kind.name);
          // Ride into the ark together, disappearing through the door.
          const rideMs = Math.abs(door - l.cx) / speed + 80;
          const dx = door - l.cx;
          await Promise.all([
            a.path([{ x: l.cx + dx * 0.85, offset: 0.85 }, { x: door, opacity: 0 }], rideMs),
            l.animate(
              [
                { transform: `translateY(${-kind.back}px)` },
                { transform: `translate(${dx * 0.85}px, ${-kind.back}px)`, opacity: 1, offset: 0.85 },
                { transform: `translate(${dx}px, ${-kind.back}px) scale(0.5)`, opacity: 0 },
              ],
              { duration: rideMs }
            ),
          ]);
          a.remove();
        })
      );
    };
    await Promise.all(pairs.map(boardPair));

    // Everyone's aboard: the dove flies off and the ark sails away.
    const dove = c.sprite("dove", { x: arkX, y: ground - 50, flip: !right, z: 4, scale: 0.6, opacity: 0 });
    await Promise.all([
      dove.path([{ x: arkX + dir * 30, y: ground - 90, scale: 1, opacity: 1, offset: 0.4 }, { x: arkX + dir * 200, y: ground - 200, opacity: 0 }], 900),
      ark.path(
        [
          { x: arkX + dir * 60, y: ground + 6, rot: dir * 3, offset: 0.35 },
          { x: arkX + dir * 300, y: ground + 10, rot: 0, opacity: 0 },
        ],
        900,
        "ease-in"
      ),
    ]);
  },

  // Per letter: a cartoon glove floats down and wipes the letters away like a whiteboard.
  "writing-on-the-wall": async (c) => {
    const per = c.perLetter(300, 2200);
    const first = c.letters[0];
    const handY = c.midY - 4;
    const hand = c.sprite("hand", { x: first.x - 30, y: handY - 90, anchor: [0.5, 0.5], opacity: 0, z: 4 });
    c.puff("sparkle", first.x - 30, handY - 70, { z: 5 });
    await hand.path([{ y: handY - 10, opacity: 1, offset: 0.7 }, { y: handY }], 450, "ease-out");

    for (const l of c.letters) {
      c.puff("dust", l.cx - 6, l.cy + 6, { z: 2 });
      l.animate(
        [
          { clipPath: "inset(0 0 0 0)", opacity: 1 },
          { clipPath: "inset(0 0 0 100%)", opacity: 0.4 },
        ],
        { duration: per * 0.9, easing: "ease-in-out" }
      );
      await hand.path(
        [
          { x: l.x + l.w * 0.3, y: handY - 6, rot: -10, offset: 0.33 },
          { x: l.x + l.w * 0.6, y: handY + 6, rot: 8, offset: 0.66 },
          { x: l.right + 2, y: handY, rot: 0 },
        ],
        per
      );
    }

    // A little wave goodbye, then float up out of view.
    c.puff("sparkle", hand.pose.x + 20, handY - 30, { z: 5 });
    await hand.path([{ rot: -20 }, { rot: 15 }, { rot: -15 }, { rot: 0 }], 520, "ease-in-out");
    await hand.to({ y: handY - 140, opacity: 0 }, 450, "ease-in");
  },

  // Per letter: clay jars drop over each letter, then smash one by one into flickering torches.
  "gideons-jars": async (c) => {
    const ground = c.bottom + 3;
    const drop = Math.min(80, 600 / c.letters.length);
    const jars = await Promise.all(
      c.letters.map(async (l, i) => {
        await c.wait(i * drop);
        const jar = c.sprite("jar", { x: l.cx, y: ground - 200, z: 3, rot: c.rand(-15, 15) });
        await jar.to({ y: ground, rot: 0 }, 300, "ease-in");
        l.hide();
        await jar.path([{ y: ground - 8, offset: 0.4 }, { y: ground }], 160, "ease-out");
        return jar;
      })
    );
    await c.wait(250);
    jars.forEach((j) => j.show("jarCracked").animate(
      [{ transform: j.el.style.transform }, { transform: `${j.el.style.transform} translateX(-2px)` }, { transform: `${j.el.style.transform} translateX(2px)` }, { transform: j.el.style.transform }],
      { duration: 200 }
    ));
    await c.wait(250);

    const per = c.perLetter(160, 1100);
    const torches: Sprite[] = [];
    for (const [i, jar] of jars.entries()) {
      const l = c.letters[i];
      c.burst("shard", l.cx, ground - 18, { count: 6, spread: 36, up: 34, fall: 30, ms: 550 });
      jar.remove();
      const torch = c.sprite("torch", { x: l.cx, y: ground, z: 3, scale: 0.4 });
      torch.to({ scale: 1 }, 140, "cubic-bezier(.3,1.8,.6,1)");
      torches.push(torch);
      await c.wait(per);
    }
    c.text("FOR THE LORD!", { x: c.midX, y: c.top - 22, scale: 0, size: 18 }).path(
      [{ scale: 1.1, offset: 0.2 }, { scale: 1, offset: 0.7 }, { opacity: 0, y: c.top - 30 }],
      1100
    );
    await c.wait(550);
    await Promise.all(
      torches.map(async (t, i) => {
        await c.wait(i * 40);
        c.puff("smoke", t.pose.x, ground - 30, { z: 4 });
        await t.to({ scale: 0.3, opacity: 0 }, 250, "ease-in");
        t.remove();
      })
    );
  },

  // Per letter: a staff drops, POOFs into a snake, and the snake gulps each letter, growing longer.
  "moses-staff-snake": async (c) => {
    const ground = c.bottom + 2;
    const first = c.letters[0];
    const startX = first.x - 30;
    const staff = c.sprite("staff", { x: startX - 40, y: c.top - 160, rot: -200, z: 3 });
    await staff.to({ x: startX, y: ground, rot: 0 }, 480, "ease-in");
    await staff.path([{ rot: -8 }, { rot: 5 }, { rot: 0 }], 220);

    c.puff("poof", startX, ground - 26, { z: 5, fps: 12 });
    await c.wait(120);
    staff.remove();

    const SEG = 18; // body tile width in css px
    const HEAD_HALF = 25.5;
    const head = c.sprite("snakeHead", { x: startX, y: ground, z: 4 });
    head.hold(0);
    const body: Sprite[] = [];
    const tail = c.sprite("snakeTail", { x: startX - HEAD_HALF + 4, y: ground, anchor: [1, 1], z: 3 });
    await c.wait(150);

    // Lay the body out behind the head (with a gentle slither wave), tail at the end.
    const follow = (headX: number, ms: number) => {
      const left = headX - HEAD_HALF + 3;
      body.forEach((s, i) =>
        s.path([{ x: left - (i + 1) * SEG, y: ground - (i % 2 ? 3 : 0), offset: 0.5 }, { x: left - (i + 1) * SEG, y: ground }], ms)
      );
      tail.to({ x: left - body.length * SEG + 1 }, ms);
    };

    const step = c.perLetter(310, 2000);
    for (const l of c.letters) {
      const target = l.x + 6 - HEAD_HALF; // mouth (head's right edge) reaches the letter
      follow(target, step * 0.4);
      await head.to({ x: target }, step * 0.4);
      head.hold(1);
      l.el.style.transformOrigin = "left bottom";
      await l.animate([{ transform: "none" }, { transform: "translate(-8px, 6px) scale(0)", opacity: 0 }], {
        duration: step * 0.35,
        easing: "ease-in",
      });
      head.hold(0);
      const left = head.pose.x - HEAD_HALF + 3;
      const seg = c.sprite("snakeBody", { x: left - (body.length + 1) * SEG, y: ground, anchor: [0, 1], scale: 0.2, z: 3 });
      body.push(seg);
      seg.to({ scale: 1 }, step * 0.2, "cubic-bezier(.3,1.8,.6,1)");
      tail.to({ x: left - body.length * SEG + 1 }, step * 0.2);
      await c.wait(step * 0.25);
    }

    // Happy tongue flick, then slither off to the right.
    head.hold(1);
    await c.wait(180);
    head.hold(0);
    const dx = c.W + 260 - head.pose.x;
    await Promise.all([head, tail, ...body].map((s) => s.to({ x: s.pose.x + dx, opacity: 0 }, 850, "ease-in")));
  },

  // Whole word: a net drops over the word, cinches into a bag full of letters, and gets hauled up.
  "fishers-of-men": async (c) => {
    const ground = c.bottom + 8;
    const net = c.strip({ start: "netLeft", mid: "netMid", end: "netRight" }, c.W + 16, {
      x: c.midX,
      y: ground - 320,
      z: 3,
    });
    const netTop = () => net.pose.y - net.h;
    const rope = c.strip({ mid: "rope" }, 420, { axis: "y", x: c.midX, y: ground - 320 - net.h + 4, z: 2 });

    await Promise.all([
      net.path([{ y: ground + 10, offset: 0.75 }, { y: ground - 4, offset: 0.9 }, { y: ground }], 650, "ease-in"),
      rope.path([{ y: ground + 10 - net.h + 4, offset: 0.75 }, { y: ground - 4 - net.h + 4, offset: 0.9 }, { y: ground - net.h + 4 }], 650, "ease-in"),
    ]);
    await Promise.all(c.letters.map((l) => l.shake(320, 3)));

    // Cinch: the net squeezes in to the middle and becomes a bag; letters bunch up inside.
    const bag = c.sprite("netBag", { x: c.midX, y: ground, scale: 0.3, opacity: 0, z: 3 });
    const base = net.el.style.transform;
    await Promise.all([
      net.animate([{ transform: base, opacity: 1 }, { transform: `${base} scaleX(0.2)`, opacity: 0 }], {
        duration: 380,
        easing: "ease-in",
        fill: "forwards",
      }),
      bag.to({ scale: 1, opacity: 1 }, 380, "ease-out"),
      ...c.letters.map((l) =>
        l.animate(
          [
            { transform: "none" },
            { transform: `translate(${c.midX - l.cx}px, 4px) scale(0.25) rotate(${c.rand(-60, 60)}deg)`, opacity: 0 },
          ],
          { duration: 380, easing: "ease-in" }
        )
      ),
    ]);
    net.remove();
    await bag.path([{ scale: 1.1, offset: 0.5 }, { scale: 1 }], 160);

    // Haul it up; one fish flips out and splashes back down.
    const fish = c.sprite("fish", { x: c.midX, y: ground - 24, anchor: [0.5, 0.5], z: 4, opacity: 0 });
    const lift = 380;
    await Promise.all([
      bag.to({ y: ground - lift }, 800, "ease-in"),
      rope.to({ y: rope.pose.y - lift }, 800, "ease-in"),
      (async () => {
        await c.wait(250);
        fish.set({ opacity: 1, y: ground - 70 });
        await fish.path(
          [
            { x: c.midX + 40, y: ground - 120, rot: -30, offset: 0.35 },
            { x: c.midX + 70, y: ground - 40, rot: 120, offset: 0.8 },
            { x: c.midX + 80, y: ground + 20, rot: 160, opacity: 0 },
          ],
          700,
          "ease-in-out"
        );
      })(),
    ]);
  },

  // Per letter: letters hop up into a wobbly tower, start babbling nonsense, and the tower topples.
  "tower-of-babel": async (c) => {
    const ground = c.bottom + 2;
    const n = c.letters.length;
    const STEP = Math.min(22, 170 / n); // stack spacing (roughly cap height); squish tall towers
    const builder = c.sprite("builder", { x: -80, y: ground, z: 4 });
    const base = c.strip({ mid: "baseTile" }, Math.max(c.W, 48), { x: c.midX, y: ground - 3, anchor: [0.5, 0], scale: 0, z: 2 });
    await Promise.all([builder.to({ x: c.letters[0].x - 30 }, 500), base.to({ scale: 1 }, 260, "cubic-bezier(.3,1.6,.6,1)")]);
    builder.hold(0);

    const pivot = { x: c.midX, y: c.bottom };
    const stackPos = (l: Letter, i: number) => ({ dx: c.midX - l.cx, dy: -i * STEP });
    c.letters.forEach((l) => (l.el.style.transformOrigin = `${pivot.x - l.x}px ${pivot.y - l.y}px`));

    // Hop each letter onto the stack, bottom first.
    const stagger = c.perLetter(190, 1200);
    await Promise.all(
      c.letters.map(async (l, i) => {
        await c.wait(i * stagger);
        const { dx, dy } = stackPos(l, i);
        await l.animate(
          [
            { transform: "rotate(0deg) translate(0px, 0px)" },
            { transform: `rotate(0deg) translate(${dx * 0.5}px, ${dy - 30}px)`, offset: 0.55 },
            { transform: `rotate(0deg) translate(${dx}px, ${dy}px)` },
          ],
          { duration: 320, easing: "ease-out" }
        );
      })
    );
    const towerTop = Math.max(c.bottom - n * STEP - 10, c.top - 150);

    // Wobble + babble: everyone suddenly speaks a different language.
    const bubble = c.sprite("babbleBubble", { x: c.midX + 40, y: towerTop, z: 5, scale: 0 });
    bubble.to({ scale: 1 }, 200, "cubic-bezier(.3,1.8,.6,1)");
    const nodes = c.letters.map((l) => textNode(l.el));
    const originals = nodes.map((t) => t?.nodeValue ?? "");
    const wobble = (deg: number, ms: number) =>
      Promise.all(
        c.letters.map((l, i) => {
          const { dx, dy } = stackPos(l, i);
          return l.animate(
            [
              { transform: `rotate(0deg) translate(${dx}px, ${dy}px)` },
              { transform: `rotate(${deg}deg) translate(${dx}px, ${dy}px)`, offset: 0.25 },
              { transform: `rotate(${-deg}deg) translate(${dx}px, ${dy}px)`, offset: 0.75 },
              { transform: `rotate(0deg) translate(${dx}px, ${dy}px)` },
            ],
            { duration: ms, easing: "ease-in-out" }
          );
        })
      );
    const scramble = (async () => {
      for (let k = 0; k < 7; k++) {
        nodes.forEach((t, i) => {
          if (t) t.nodeValue = originals[i].replace(/\S/, c.pick(BABBLE.split("")));
        });
        await c.wait(100);
      }
    })();
    await Promise.all([wobble(4, 650), scramble]);

    // Timber! The tower falls over to the right and the letters scatter.
    bubble.fadeOut(200);
    try {
      await Promise.all(
        c.letters.map((l, i) => {
          const { dx, dy } = stackPos(l, i);
          return l.animate(
            [
              { transform: `rotate(0deg) translate(${dx}px, ${dy}px)` },
              { transform: `rotate(-6deg) translate(${dx}px, ${dy}px)`, offset: 0.2 },
              { transform: `rotate(80deg) translate(${dx}px, ${dy}px)`, opacity: 1, offset: 0.85 },
              { transform: `rotate(95deg) translate(${dx + c.rand(-20, 20)}px, ${dy}px)`, opacity: 0 },
            ],
            { duration: 750, easing: "ease-in" }
          );
        })
      );
    } finally {
      nodes.forEach((t, i) => t && (t.nodeValue = originals[i]));
    }
    for (let i = 0; i < Math.min(n, 6); i++) c.puff("dust", c.midX + 10 + i * (STEP + 4), ground - 10, { z: 3 });
    builder.set({ flip: true }).show("builder");
    await Promise.all([builder.to({ x: -100, opacity: 0 }, 600), base.to({ opacity: 0 }, 500)]);
  },

  // Per letter: ravens swoop down, grab each letter in their feet, and fly off with it.
  "elijahs-ravens": async (c) => {
    const right = roomOnRight(c, 0);
    const dir = right ? 1 : -1;
    const stagger = c.perLetter(200, 1500);
    const order = right ? [...c.letters].reverse() : c.letters; // nearest the ravens first
    await Promise.all(
      order.map(async (l, i) => {
        await c.wait(i * stagger);
        const start = { x: (right ? c.W + 120 : -120) + c.rand(-30, 30), y: c.top - 180 + c.rand(-30, 30) };
        const grab = { x: l.cx, y: l.y + 14 };
        const raven = c.sprite("raven", { ...start, flip: right, z: 4 });
        await raven.path(
          [
            { x: grab.x + dir * 50, y: grab.y - 30, offset: 0.6 },
            { x: grab.x, y: grab.y },
          ],
          600,
          "ease-out"
        );
        // Grab: little dip, letter lifts.
        await raven.path([{ y: grab.y + 4 }, { y: grab.y }], 140);
        raven.set({ flip: !right });
        if (Math.random() < 0.5) c.burst("feather", grab.x, grab.y - 20, { count: 1, spread: 20, up: 6, fall: 50, ms: 900 });
        const exit = { x: (right ? c.W + 240 : -240) + c.rand(-40, 40), y: c.top - 220 + c.rand(-30, 30) };
        const dx = exit.x - grab.x;
        const dy = exit.y - grab.y;
        const ms = 800;
        l.el.style.transformOrigin = "center top";
        await Promise.all([
          raven.path([{ x: grab.x + dx * 0.2, y: grab.y + dy * 0.1, offset: 0.25 }, { x: exit.x, y: exit.y }], ms, "ease-in"),
          l.animate(
            [
              { transform: "translate(0px, 0px) rotate(0deg)" },
              { transform: `translate(${dx * 0.2}px, ${dy * 0.1}px) rotate(${-dir * 15}deg)`, offset: 0.25 },
              { transform: `translate(${dx * 0.75}px, ${dy * 0.75}px) rotate(${dir * 10}deg)`, opacity: 1, offset: 0.75 },
              { transform: `translate(${dx}px, ${dy}px) rotate(0deg)`, opacity: 0 },
            ],
            { duration: ms, easing: "ease-in" }
          ),
        ]);
        raven.remove();
      })
    );
  },
};
