import type { Choreography, Ctx, Letter } from "../engine";

const BALLOONS = ["balloonRed", "balloonBlue", "balloonYellow", "balloonGreen", "balloonPink"];

/**
 * A copy of a letter's glyph in the overlay, sitting exactly on top of it.
 * Used when a letter needs to split into two independently moving pieces.
 */
function cloneGlyph(c: Ctx, l: Letter): HTMLElement {
  const cs = getComputedStyle(l.el);
  const el = document.createElement("div");
  el.textContent = l.char;
  Object.assign(el.style, {
    position: "absolute",
    left: `${l.x}px`,
    top: `${l.y}px`,
    width: `${l.w}px`,
    height: `${l.h}px`,
    font: cs.font,
    color: cs.color,
    textTransform: cs.textTransform,
    textAlign: "center",
    lineHeight: `${l.h}px`,
    zIndex: "2",
  });
  c.stage.root.appendChild(el);
  return el;
}

export const FUN_B: Record<string, Choreography> = {
  // Per letter: a balloon drops onto every letter, then they float away one by one and pop.
  balloons: async (c) => {
    const lift = c.perLetter(240, 1500);
    const riseMs = 1150;
    const rise = 150;

    const balloons = c.letters.map((l, i) => {
      const b = c.sprite(c.pick(BALLOONS), { x: l.cx, y: l.y - 200, opacity: 0, z: 2 });
      b.path([{ y: l.y + 6, opacity: 1, offset: 0.8 }, { y: l.y + 2 }], 420 + i * 50, "ease-out");
      return b;
    });
    await c.wait(420 + c.letters.length * 50);

    await Promise.all(
      c.letters.map(async (l, i) => {
        await c.wait(i * lift);
        const b = balloons[i];
        const sway = c.pick([-1, 1]) * c.rand(5, 9);
        const xs = [0, sway, -sway, sway * 0.6];
        const ys = [-rise * 0.12, -rise * 0.4, -rise * 0.72, -rise];
        b.path(
          xs.map((dx, k) => ({ x: l.cx + dx, y: l.y + 2 + ys[k], rot: dx * 0.8 })),
          riseMs,
          "ease-in"
        );
        await l.animate(
          [
            { transform: "none" },
            ...xs.map((dx, k) => ({ transform: `translate(${dx}px, ${ys[k]}px) rotate(${dx * 0.8}deg)` })),
          ],
          { duration: riseMs, easing: "ease-in" }
        );
        // Pop! The letter drops away and fades.
        b.remove();
        c.puff("pop", l.cx + sway * 0.6, l.y + 2 - rise - 20, { fps: 14, z: 4 });
        await l.animate(
          [
            { transform: `translate(${sway * 0.6}px, ${-rise}px)` },
            { transform: `translate(${sway * 0.6}px, ${-rise + 30}px) rotate(${sway * 3}deg) scale(0.6)`, opacity: 0 },
          ],
          { duration: 260, easing: "ease-in" }
        );
      })
    );
  },

  // Per letter: a robot vacuum rolls along the underline slurping each letter into its nose.
  vacuum: async (c) => {
    const ground = c.bottom + 4;
    const step = c.perLetter(380, 2500);
    const half = 27; // half the vacuum's width in CSS px
    const vac = c.sprite("vacuum", { x: -110, y: ground, z: 3, fps: 8 });
    const noseX = (l: Letter) => l.x - half - 4;

    await vac.to({ x: noseX(c.letters[0]) }, 550, "ease-out");

    for (const l of c.letters) {
      await vac.path([{ x: noseX(l), y: ground }], step * 0.3, "ease-in-out");
      const suction = c.sprite("suction", { x: l.x - 4, y: ground - 14, anchor: [0, 0.5], z: 2, fps: 12 });
      l.el.style.transformOrigin = "left bottom";
      await l.animate(
        [
          { transform: "none" },
          { transform: "scale(1.15, 0.65)", offset: 0.35 },
          { transform: "translate(-6px, 4px) scale(0.6, 0.3) skewX(-15deg)", offset: 0.7 },
          { transform: "translate(-14px, 8px) scale(0)", opacity: 0 },
        ],
        { duration: step * 0.55, easing: "ease-in" }
      );
      suction.remove();
      vac.path([{ y: ground - 3, offset: 0.5 }, { y: ground }], step * 0.15);
      await c.wait(step * 0.15);
    }

    // Happy hop, a puff of dust, and away.
    await vac.path([{ y: ground - 18, rot: -8 }, { y: ground, rot: 0 }], 320, "ease-out");
    c.puff("dust", vac.pose.x - 30, ground - 12);
    await vac.to({ x: vac.pose.x + 220, opacity: 0 }, 600, "ease-in");
  },

  // Whole word: friendly dragon hovers left of the word and breathes fire across it.
  dragon: async (c) => {
    const mouthY = c.midY; // the mouth is ~8 sprite px above the dragon's feet
    const hoverX = -34;
    const feetY = mouthY + 26;
    const dragon = c.sprite("fly", { x: -170, y: feetY - 60, z: 3, fps: 8 });
    await dragon.path([{ x: -90, y: feetY - 30 }, { x: hoverX, y: feetY }], 750, "ease-out");

    dragon.show("breathe", 8);
    await c.wait(150);
    const fire = c.strip({ start: "fireStart", mid: "fireMid", end: "fireEnd" }, c.W + 24, {
      x: hoverX + 24,
      y: mouthY,
      anchor: [0, 0.5],
      px: 4,
      z: 4,
    });
    fire.el.style.clipPath = "inset(0 100% 0 0)";
    const glow = Promise.all(
      c.letters.map((l) =>
        l.animate(
          [
            { color: "inherit", textShadow: "none", transform: "none" },
            { color: "#f77622", textShadow: "0 0 6px #feae34", transform: "translateY(-1px) rotate(-3deg)", offset: 0.4 },
            { color: "#e43b44", textShadow: "0 0 10px #feae34", transform: "translateY(1px) rotate(3deg)" },
          ],
          { duration: 1000, easing: "ease-in-out" }
        )
      )
    );
    await fire.el
      .animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], {
        duration: 350,
        easing: "ease-out",
        fill: "forwards",
      })
      .finished.catch(() => {});
    await c.wait(350);
    // The flame cuts off at the mouth and the tail of it rushes past the word.
    dragon.show("fly", 8);
    await fire.el
      .animate([{ clipPath: "inset(0 0% 0 0)" }, { clipPath: "inset(0 0 0 100%)" }], {
        duration: 300,
        easing: "ease-in",
        fill: "forwards",
      })
      .finished.catch(() => {});
    fire.remove();
    await glow;

    // ...then crumble into embers, left to right.
    const crumble = Promise.all(
      c.letters.map(async (l, i) => {
        await c.wait(i * Math.min(70, 500 / c.letters.length));
        c.burst("ember", l.cx, l.cy, { count: 4, spread: 16, up: 26, fall: -40, ms: 800, spin: false });
        await l.animate(
          [
            { color: "#e43b44", textShadow: "0 0 10px #feae34", transform: "none" },
            { color: "#5a6988", textShadow: "none", transform: "translateY(4px) scale(0.8, 0.5)", opacity: 0.6, offset: 0.5 },
            { color: "#5a6988", textShadow: "none", transform: "translateY(10px) scale(0.6, 0)", opacity: 0 },
          ],
          { duration: 500, easing: "ease-in" }
        );
      })
    );
    await crumble;
    c.letters.forEach((l, i) => i % 2 === 0 && c.puff("smoke", l.cx, l.cy - 6, { z: 2 }));

    // Fly up over the word and away.
    await dragon.path([{ x: c.midX, y: c.top - 50 }, { x: c.W + 160, y: c.top - 120, opacity: 0 }], 900, "ease-in");
  },

  // Whole word: crane swings its ball into the word and the letters scatter like bricks.
  "wrecking-ball": async (c) => {
    const ground = c.bottom + 4;
    const px = 4;
    const craneX = Math.min(-70, c.letters[0].x - 70);
    const crane = c.sprite("crane", { x: craneX - 140, y: ground, px, z: 2, fps: 8 });
    // Mast top, in sprite px (col 13, row 1) → CSS px offset from the crane's anchor.
    const mast = { x: craneX - 32 + 13.5 * px, y: ground - 64 + px };

    const hitX = c.midX;
    const dx = hitX - mast.x;
    const angle = Math.min(55, Math.max(22, (Math.atan2(70, dx) * 180) / Math.PI));
    const rad = (angle * Math.PI) / 180;
    const boomLen = dx / Math.cos(rad);
    const tip = { x: hitX, y: mast.y - boomLen * Math.sin(rad) };
    const pivot = { x: tip.x, y: tip.y + 20 }; // pulley under the boom tip

    const ballR = 18;
    const chainLen = Math.max(20, c.midY - pivot.y - ballR - 4);
    const boom = c.strip({ mid: "boomTile" }, boomLen, { x: mast.x - 140, y: mast.y, anchor: [0, 0.5], rot: -angle, z: 1 });
    const tipSprite = c.sprite("boomTip", { x: tip.x - 140, y: tip.y - 6, anchor: [0.4, 0], z: 2 });
    const chain = c.strip({ mid: "chain" }, chainLen, { x: pivot.x - 140, y: pivot.y, anchor: [0.5, 0], axis: "y", z: 2 });
    const ball = c.sprite("ball", { x: pivot.x - 140, y: pivot.y + chainLen, anchor: [0.5, 0], z: 3 });

    // Pendulum pose for the chain + ball at angle θ (positive = swung back to the left).
    const swing = (deg: number, shift = 0) => {
      const r = (deg * Math.PI) / 180;
      return {
        chain: { x: pivot.x + shift, y: pivot.y, rot: deg },
        ball: { x: pivot.x + shift - chainLen * Math.sin(r), y: pivot.y + chainLen * Math.cos(r), rot: deg },
      };
    };

    // Roll in with the ball already pulled back.
    const back = swing(70, -140);
    chain.set(back.chain);
    ball.set(back.ball);
    const rollIn = 600;
    await Promise.all([
      crane.to({ x: craneX }, rollIn, "ease-out"),
      boom.to({ x: mast.x }, rollIn, "ease-out"),
      tipSprite.to({ x: tip.x }, rollIn, "ease-out"),
      chain.to(swing(70).chain, rollIn, "ease-out"),
      ball.to(swing(70).ball, rollIn, "ease-out"),
    ]);
    await c.wait(150);

    // Swing down into the word.
    const arc = [56, 40, 24, 10, 0];
    await Promise.all([
      chain.path(arc.map((d) => swing(d).chain), 420, "ease-in"),
      ball.path(arc.map((d) => swing(d).ball), 420, "ease-in"),
    ]);

    // Impact! Letters fly away from the ball like bricks.
    c.letters.forEach((l) => {
      const dist = l.cx - hitX;
      const dir = dist === 0 ? c.pick([-1, 1]) : Math.sign(dist);
      const delay = Math.abs(dist) * 0.6;
      const fly = dir * (50 + Math.abs(dist) * 0.25 + c.rand(0, 30));
      const spin = dir * c.rand(90, 300);
      l.el.style.transformOrigin = "center";
      l.animate(
        [
          { transform: "none" },
          { transform: `translate(${fly * 0.5}px, -${c.rand(30, 55)}px) rotate(${spin * 0.5}deg)`, offset: 0.4 },
          { transform: `translate(${fly}px, 70px) rotate(${spin}deg)`, opacity: 0 },
        ],
        { duration: 800, delay, easing: "cubic-bezier(.2,.6,.6,1)" }
      );
      setTimeout(() => c.burst(c.pick(["rubbleA", "rubbleB"]), l.cx, l.cy, { count: 2, spread: 40, up: 30, fall: 60 }), delay);
    });
    c.puff("dust", hitX, c.midY);
    if (c.letters.length > 3) {
      c.puff("dust", hitX - c.W / 3, c.bottom - 6);
      c.puff("dust", hitX + c.W / 3, c.bottom - 6);
    }

    // Ball follows through and settles.
    await Promise.all([
      chain.path([swing(-22).chain, swing(8).chain, swing(0).chain], 700, "ease-out"),
      ball.path([swing(-22).ball, swing(8).ball, swing(0).ball], 700, "ease-out"),
    ]);
    await c.wait(Math.min(400, c.W * 0.6));

    // Roll back out.
    const out = 600;
    await Promise.all(
      [crane, boom, tipSprite, chain, ball].map((n) => n.to({ x: n.pose.x - 200, opacity: 0 }, out, "ease-in"))
    );
  },

  // Whole word: cloth drops over the word, three taps of the wand, whoosh, gone; a dove flies out.
  magician: async (c) => {
    const ground = c.bottom + 4;
    const magicX = Math.min(-36, c.letters[0].x - 36);
    const magician = c.sprite("magician", { x: magicX - 100, y: ground, z: 3 });
    magician.hold(0);
    await magician.path([{ x: magicX - 50, y: ground - 6 }, { x: magicX, y: ground }], 600, "ease-out");
    // Bow.
    await magician.path([{ rot: 15, offset: 0.5 }, { rot: 0 }], 400, "ease-in-out");

    const cloth = c.strip({ start: "clothLeft", mid: "clothMid", end: "clothRight" }, c.W + 14, {
      x: c.midX,
      y: ground - 120,
      anchor: [0.5, 1],
      opacity: 0,
      z: 2,
    });
    await cloth.path([{ y: ground + 2, opacity: 1, offset: 0.75 }, { y: ground - 2 }], 450, "ease-in");
    c.letters.forEach((l) => l.hide()); // the cloth hides them; they're gone when it lifts

    // Tap, tap, tap.
    for (let i = 0; i < 3; i++) {
      magician.hold(1);
      const sx = c.rand(c.W * 0.1, c.W * 0.9);
      c.puff("sparkle", sx, c.top - 4 + c.rand(-6, 6), { z: 4, fps: 10 });
      cloth.path([{ scale: 1.04, offset: 0.4 }, { scale: 1 }], 220);
      await c.wait(220);
      magician.hold(0);
      await c.wait(130);
    }

    // Whoosh! Cloth whips away, poof, dove.
    magician.hold(1);
    cloth.to({ x: c.W + 120, y: c.top - 70, rot: 25, opacity: 0 }, 420, "ease-in").then(() => cloth.remove());
    c.puff("poof", c.midX, c.midY);
    const dove = c.sprite("dove", { x: c.midX, y: c.midY + 6, anchor: [0.5, 0.5], scale: 0.4, z: 5, fps: 10 });
    const flight = dove.path(
      [
        { scale: 1, y: c.midY - 20, offset: 0.25 },
        { x: c.midX + 50, y: c.top - 70 },
        { x: c.midX + 120, y: c.top - 140, opacity: 0 },
      ],
      1000,
      "ease-out"
    );
    await c.wait(450);
    magician.hold(0);
    await magician.path([{ rot: 15, offset: 0.4 }, { rot: 0, opacity: 0 }], 500);
    await flight;
  },

  // Per letter: a painter rolls background-white paint over each letter.
  "paint-roller": async (c) => {
    const ground = c.bottom + 2;
    const step = c.perLetter(400, 2200);
    // The roller sits 18px right of the sprite's center; put it on the letter.
    const rollerOn = (l: Letter) => l.cx - 18;
    const painter = c.sprite("painterWalk", { x: -150, y: ground, z: 3, fps: 8 });
    const bucket = c.sprite("bucket", { x: c.letters[0].x - 12, y: ground, opacity: 0, z: 2 });
    await painter.to({ x: rollerOn(c.letters[0]) - 30 }, 600, "ease-out");
    bucket.set({ opacity: 1 });
    await c.wait(120);

    for (const l of c.letters) {
      painter.show("painterWalk", 10);
      await painter.to({ x: rollerOn(l) }, step * 0.25);
      painter.show("painterRoll", Math.max(6, 2400 / step));
      const streak = c.sprite("streak", { x: l.cx, y: l.y - 3, anchor: [0.5, 0], opacity: 0.95, z: 2 });
      streak.el.animate([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }], {
        duration: step * 0.55,
        fill: "forwards",
      });
      await l.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(100% 0 0 0)" }], {
        duration: step * 0.55,
        easing: "ease-in-out",
      });
      c.burst("drip", l.cx + c.rand(-8, 8), l.bottom - 4, { count: 2, spread: 4, up: 0, fall: 18, ms: 500, spin: false });
      // The wet paint dries into the background.
      streak.to({ opacity: 0 }, 500).then(() => streak.remove());
      await c.wait(step * 0.2);
    }

    // Wipe brow (a little hop), then off to the right with the bucket fading.
    painter.show("painterWalk", 8);
    await painter.path([{ y: ground - 8 }, { y: ground }], 260, "ease-out");
    bucket.fadeOut(400);
    await painter.to({ x: painter.pose.x + 200, opacity: 0 }, 600, "ease-in");
  },

  // Whole word: ninja dashes through, strikes a pose, and the word slides apart in two halves.
  ninja: async (c) => {
    const ground = c.bottom + 2;
    const ninja = c.sprite("run", { x: -140, y: ground, z: 3, fps: 12 });
    await ninja.to({ x: -40 }, 450, "ease-out");
    await c.wait(120);

    // Dash through the word in a blur.
    ninja.show("dash");
    const dashMs = 220;
    c.letters.forEach((l) =>
      setTimeout(() => l.shake(140, 2), ((l.cx + 40) / (c.W + 80)) * dashMs)
    );
    await ninja.to({ x: c.W + 40 }, dashMs, "ease-in");
    ninja.show("pose");
    await c.wait(350);

    // The slash appears across the middle...
    const slash = c.strip({ start: "slashLeft", mid: "slashMid", end: "slashRight" }, c.W + 24, {
      x: -12,
      y: c.midY + 2,
      anchor: [0, 0.5],
      z: 4,
    });
    slash.el.style.clipPath = "inset(0 100% 0 0)";
    await slash.el
      .animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], { duration: 140, fill: "forwards" })
      .finished.catch(() => {});
    c.puff("ting", c.W + 10, c.midY - 8, { z: 5, fps: 12 });
    slash.fadeOut(300);

    // ...and every letter splits along it: top half up-right, bottom half down-left.
    const topCut = "polygon(0 0, 100% 0, 100% 42%, 0 58%)";
    const bottomCut = "polygon(0 58%, 100% 42%, 100% 100%, 0 100%)";
    await Promise.all(
      c.letters.map((l) => {
        const lower = cloneGlyph(c, l);
        lower.style.clipPath = bottomCut;
        l.el.style.clipPath = topCut;
        const ms = 700;
        const opts = { duration: ms, delay: 60, easing: "ease-in", fill: "forwards" as const };
        lower.animate(
          [{ transform: "none" }, { transform: "translate(-10px, 18px) rotate(-8deg)", opacity: 0 }],
          opts
        );
        return l.animate([{ transform: "none" }, { transform: "translate(10px, -14px) rotate(6deg)", opacity: 0 }], opts);
      })
    );
    c.letters.forEach((l) => (l.el.style.clipPath = ""));

    // Bow, then vanish in smoke.
    await ninja.path([{ rot: 12, offset: 0.5 }, { rot: 0 }], 350);
    c.puff("smoke", ninja.pose.x, ground - 20);
    await ninja.to({ opacity: 0 }, 200);
  },
};
