import type { EffectArt, Frame } from "../pixel";
import { flipX } from "../pixel";

// Join frames side by side (all parts must share a height).
const hcat = (...parts: Frame[]): Frame => parts[0].map((_, i) => parts.map((p) => p[i]).join(""));
// Cyclic horizontal shift, for animating tileable strips.
const shiftX = (f: Frame, n: number): Frame => f.map((r) => r.slice(n) + r.slice(0, n));
const recolor = (f: Frame, map: Record<string, string>): Frame =>
  f.map((r) => r.replace(/./g, (ch) => map[ch] ?? ch));
const blank = (w: number, h: number): Frame => Array(h).fill(".".repeat(w));

// Shared gray smoke/dust puff: small -> big -> dispersing.
const puff: Frame[] = [
  [
    "...........",
    "...........",
    "....GGG....",
    "...GgggG...",
    "..GgggggG..",
    "...GgggG...",
    "....GGG....",
    "...........",
    "...........",
  ],
  [
    "...GG.GG...",
    "..GggGggG..",
    ".GgggggggG.",
    "GggwggggggG",
    "GgggggggggG",
    ".GgggggggG.",
    "..GggGggG..",
    "...GG.GG...",
    "...........",
  ],
  [
    ".GG........",
    "GggG....GG.",
    ".GG....GggG",
    "........GG.",
    "....GG.....",
    "...GggG....",
    "....GG..G..",
    ".G.....GgG.",
    "........G..",
  ],
];

const sparkle: Frame[] = [
  ["..Y..", "..Y..", "YYwYY", "..Y..", "..Y.."],
  ["Y...Y", ".Y.Y.", "..w..", ".Y.Y.", "Y...Y"],
];

// ---------------------------------------------------------------------------
// Pop the Balloon
// A = main color, B = shade. String wiggles between frames.

const balloonTop = [
  "..kkkk..",
  ".kAAAAk.",
  "kAwAAAAk",
  "kAwAAAAk",
  "kAAAAAAk",
  "kAAAAAAk",
  ".kAAABk.",
  "..kBBk..",
  "...kk...",
];
const balloonFrames: Frame[] = [
  [...balloonTop, "...k....", "....k...", "...k....", "...k...."],
  [...balloonTop, "....k...", "...k....", "....k...", "....k..."],
];
const balloon = (main: string, shade: string) => ({
  fps: 3,
  frames: balloonFrames.map((f) => recolor(f, { A: main, B: shade })),
});

// ---------------------------------------------------------------------------
// Robo-vac

// Robo-vac (faces right): cyan dome with a face, blinking antenna, spinning front brush.
const vac = (light: string, wheel: string, brush: [string, string]): Frame => [
  "........k.........",
  `.......k${light}k........`,
  "........k.........",
  "........k.........",
  "....kkkkkkkkkk....",
  "..kkcwwccccccckk..",
  ".kcwcccccwkccwkck.",
  ".kcccccccwkccwkck.",
  "kccccccccnckkcncck",
  "kuuuuuuuuuuuuuuuuk",
  "kUUUUUUUUUUUUUUUUk",
  ".kkkkkkkkkkkkkkkkk",
  `..k${wheel}k.......k${wheel}k${brush[0]}`,
  `...k.........k.${brush[1]}`,
];

// ---------------------------------------------------------------------------
// Dragon (faces right)

const dragonBody = [
  "....kllllllllk....",
  "...kllllyyyylk....",
  ".k.kllllyyyyylk...",
  "kLkkllllyyyyylk...",
  "klLllllllyyyylk...",
  ".kkkllllllllllk...",
  "....kllk..kllk....",
  "....kkkk..kkkk....",
];
const dragonHorns = ["..........k..k....", ".........kYkkYk..."];
const dragonWingUp = [
  "..kk.....kllllllk.",
  ".kLLk...kllllwkllk",
  ".kLlLk..kllllwkllk",
];
const dragonWingDown = [
  ".........kllllllk.",
  "........kllllwkllk",
  ".kkk....kllllwkllk",
];

const fireMid: Frame = [
  "r..rr..r",
  "oorooroo",
  "yyoyyoyy",
  "ffyffyff",
  "yyoyyoyy",
  "oorooroo",
  "r..rr..r",
];

// ---------------------------------------------------------------------------
// Magician (faces right)

const magicianHead = [
  "....kkkkkk......",
  "....kkkkkk......",
  "....kkkkkk......",
  "....krrrrk......",
  "..kkkkkkkkkk....",
  "....kSSSSSk.....",
  "....kSSSkSk.....",
  "....kSSSSSSk....",
  "....kSSkkSk.....",
];
const magicianLegs = [
  ".kPPPkUUUUUk....",
  "kPPPPkUUUUUk....",
  "kPPPPkUUkUUk....",
  "kkkkkkUUkUUk....",
  ".....kkkkkkkk...",
];

const clothLeft: Frame = [
  "..kk",
  ".krr",
  "krrr",
  "krrR",
  "krrR",
  "krrR",
  "krrR",
  "krrR",
  "krrR",
  "krrR",
  "krrR",
  "kYYY",
  "kYkY",
  "kkkk",
];

// ---------------------------------------------------------------------------
// Painter (faces right). 12px painter + 12px roller area, joined with hcat.

const painterTop = [
  "...kkkkk....",
  "..kwwwwwk...",
  "..kwwwwwwkk.",
  "..kkkkkkkk..",
  "..kSSSSkSk..",
  "..kSSSSSSSk.",
  "..kSSSSkk...",
  "...kkSSk....",
  "..kuwwwwuk..",
  ".kuuwrwwuuk.",
  ".kSkwwwwkSBB",
  "..kwwwwwwk..",
  "..kwwwuwwk..",
];
const painterStand = [...painterTop, "..kwwkkwwk..", "..kBBk.kBBk.", "..kkkk.kkkk."];
const painterStep = [...painterTop, "..kwwk.kwwk.", ".kBBk...kBBk", ".kkkk...kkkk"];

const rollerHigh = [
  "............",
  ".kkkkkkkkkk.",
  "kdwwwwwwwwdk",
  "kdgwgwgwgwdk",
  "kdggggggggdk",
  ".kkkkkkkkkk.",
  "...B........",
  "..B.........",
  ".B..........",
  "B...........",
  ...blank(12, 6),
];
const rollerLow = [
  ...blank(12, 6),
  ".kkkkkkkkkk.",
  "kdwwwwwwwwdk",
  "kdwgwgwgwgdk",
  "kdggggggggdk",
  "Bkkkkkkkkkk.",
  ...blank(12, 5),
];

// ---------------------------------------------------------------------------
// Ninja (chibi, faces right)

const ninjaTop = [
  ".kB.kkkkkkk...",
  "...kUUUUUUUk..",
  "rrkrrrrrrrrrk.",
  ".rkUUUUUUUUUk.",
  "..kUsswkswkUk.",
  "..kUsswkswkUk.",
  "..kUUUUUUUUUk.",
  "...kkUUUUUkk..",
  "...kUUUUUUk...",
  "..kSkUUUUkSk..",
  "...kUrrrrUk...",
];
const ninjaRunA = [...ninjaTop, "...kUUkUUk....", "..kkkk.kkkk..."];
const ninjaRunB = [...ninjaTop, "...kUk.kUk....", "..kkk...kkk..."];
const speedLines = [
  "......",
  "......",
  "......",
  "GGGG..",
  "......",
  ".GGGGG",
  "......",
  "......",
  "GGGGGG",
  "......",
  "..GGGG",
  "......",
  "......",
];
const ninjaPose = [
  ...ninjaTop.slice(0, 8).map((r) => r + "...."),
  "...kUUUUUUkYkkkkk.",
  "..kSkUUUUkSwwwwwwk",
  "...kUrrrrUkYkkkkk.",
  "...kUUkUUk........",
  "..kkkk.kkkk.......",
];

export const FUN_B: EffectArt[] = [
  {
    id: "balloons",
    name: "Pop the Balloon",
    emoji: "🎈",
    bible: false,
    mode: "letter",
    story:
      "One balloon (random color) floats down onto each letter and ties on. Left to right, each letter lifts off, swaying, and floats up out of view; at the top its balloon pops. One balloon per letter, so any word length works.",
    sprites: {
      balloonRed: balloon("r", "R"),
      balloonBlue: balloon("u", "U"),
      balloonYellow: balloon("y", "Y"),
      balloonGreen: balloon("l", "L"),
      balloonPink: balloon("n", "p"),
      pop: {
        fps: 10,
        frames: [
          [
            "....k....",
            ".k..y..k.",
            "..y.y.y..",
            "...yyy...",
            "kyyywyyyk",
            "...yyy...",
            "..y.y.y..",
            ".k..y..k.",
            "....k....",
          ],
          [
            "y...k...y",
            ".k.....k.",
            ".........",
            ".........",
            "k.......k",
            ".........",
            ".........",
            ".k.....k.",
            "y...k...y",
          ],
        ],
      },
    },
  },
  {
    id: "vacuum",
    name: "Robo-Vac",
    emoji: "🤖",
    bible: false,
    mode: "letter",
    story:
      "A little robot vacuum rolls in from the left along the underline. At each letter, suction lines appear and the letter squashes down and slurps into its nose. After the last letter it does a happy hop, puffs a bit of dust, and rolls off right. Duration scales with letter count.",
    sprites: {
      vacuum: {
        fps: 6,
        frames: [vac("r", "d", ["YkY", ".Y."]), vac("l", "G", ["kYk", "Y.Y"])],
      },
      suction: {
        fps: 10,
        frames: [
          ["dd..dd..", "........", "..dd..dd", "........", "dd..dd.."],
          [".dd..dd.", "........", "d..dd..d", "........", ".dd..dd."],
        ],
      },
      dust: { fps: 8, frames: puff },
    },
  },
  {
    id: "dragon",
    name: "Dragon Breath",
    emoji: "🐉",
    bible: false,
    mode: "word",
    story:
      "A small friendly dragon flaps in from the left and hovers by the word, then breathes fire across it: fireStart at its mouth, fireMid repeated to the word's width, fireEnd past the last letter. The letters glow orange and crumble into embers that float up with a puff of smoke; the dragon smiles and flies off.",
    sprites: {
      fly: {
        fps: 6,
        frames: [
          [
            ...dragonHorns,
            ...dragonWingUp,
            "..kLlLkklllnlllllk",
            "...kLLkkllllkkkkk.",
            ...dragonBody,
          ],
          [
            ...dragonHorns,
            ...dragonWingDown,
            "kLLLkkkklllnlllllk",
            ".kkkLLkkllllkkkkk.",
            ...dragonBody,
          ],
        ],
      },
      breathe: {
        fps: 6,
        frames: [
          [
            ...dragonHorns,
            ...dragonWingUp,
            "..kLlLkklllnllkk..",
            "...kLLkklllkRRk...",
            ...dragonBody,
          ],
          [
            ...dragonHorns,
            ...dragonWingDown,
            "kLLLkkkklllnllkk..",
            ".kkkLLkklllkRRk...",
            ...dragonBody,
          ],
        ],
      },
      fireStart: {
        fps: 10,
        frames: [
          ["....", "..ro", ".roy", "royf", ".roy", "..ro", "...."],
          ["....", "...r", "..ro", "royy", "..ro", "...r", "...."],
        ],
      },
      fireMid: { fps: 10, frames: [fireMid, shiftX(fireMid, 2), shiftX(fireMid, 4), shiftX(fireMid, 6)] },
      fireEnd: {
        fps: 10,
        frames: [
          ["r.....", "oor...", "yyoor.", "ffyyor", "yyoor.", "oor...", "r....."],
          [".r....", "ooor..", "yyyor.", "fyyoor", "yyyor.", "ooor..", ".r...."],
        ],
      },
      ember: {
        fps: 8,
        frames: [
          [".o.", "oyo", ".o."],
          ["...", ".o.", "..."],
        ],
      },
      smoke: { fps: 8, frames: puff },
    },
  },
  {
    id: "wrecking-ball",
    name: "Wrecking Ball",
    emoji: "🏗️",
    bible: false,
    mode: "word",
    story:
      "A crane rolls in at the left. Its boom extends over the word (boomTile repeated to about the word's middle, boomTip at the end), with the ball hanging on a chain (chain repeated downward). The ball swings in an arc and smashes into the word: letters burst into rubble that tumbles with gravity, dust puffs, then the crane pulls back and rolls off.",
    sprites: {
      crane: {
        frames: [
          [
            "...........kkkkk",
            "...........kYkYk",
            "...........kkYkk",
            "...........kYkYk",
            "...........kkYkk",
            "...........kYkYk",
            "..kkkkkkkk.kkYkk",
            "..kccwwcck.kYkYk",
            "..kcccccck.kYkYk",
            ".kyyyyyyyyyyyyyk",
            ".kYYYYYYYYYYYYYk",
            ".kkkkkkkkkkkkkkk",
            ".kddddddddddddk.",
            "kdGGdGGdGGdGGddk",
            ".kddddddddddddk.",
            "..kkkkkkkkkkkk..",
          ],
          [
            "...........kkkkk",
            "...........kYkYk",
            "...........kkYkk",
            "...........kYkYk",
            "...........kkYkk",
            "...........kYkYk",
            "..kkkkkkkk.kkYkk",
            "..kccwwcck.kYkYk",
            "..kcccccck.kYkYk",
            ".kyyyyyyyyyyyyyk",
            ".kYYYYYYYYYYYYYk",
            ".kkkkkkkkkkkkkkk",
            ".kddddddddddddk.",
            "kdGdGGdGGdGGdGdk",
            ".kddddddddddddk.",
            "..kkkkkkkkkkkk..",
          ],
        ],
      },
      boomTile: { frames: [["kkkkkkkk", "kYYYkYYY", "kYYYkYYY", "kkkkkkkk"]] },
      boomTip: {
        frames: [
          ["kkkkk.", "kYYYYk", "kYYYYk", "kkkkkk", "..k...", ".kGk..", "kGdGk.", ".kGk..", "..k..."],
        ],
      },
      chain: { frames: [[".k.", "kdk", "kdk", ".k."]] },
      ball: {
        frames: [
          [
            ".....kk.....",
            "....k..k....",
            "....kkkk....",
            "..kkddddkk..",
            ".kdGgdddddk.",
            "kdGgGddddddk",
            "kdGGdddddddk",
            "kddddddddddk",
            "kddddddddddk",
            "kddddddddddk",
            ".kddddddddk.",
            "..kkddddkk..",
            "....kkkk....",
          ],
        ],
      },
      rubbleA: { frames: [["kkkk.", "kdGdk", "kddGk", ".kkkk"]] },
      rubbleB: { frames: [[".kk.", "kGdk", "kddk", ".kk."]] },
      dust: { fps: 8, frames: puff },
    },
  },
  {
    id: "magician",
    name: "Magician",
    emoji: "🎩",
    bible: false,
    mode: "word",
    story:
      "The magician walks in from the left and bows. A cloth (clothLeft + clothMid repeated + clothRight, stretched to the word's width) drops over the word; he taps it three times with his wand (sparkles), then whips it away. The word is gone, a poof cloud appears, and a dove flutters up and away.",
    sprites: {
      magician: {
        fps: 4,
        frames: [
          [
            ...magicianHead,
            "...kPkSSSkPk..y.",
            "..kPPkUwrwUk.k..",
            ".kPPPkUwwwUkSk..",
            ".kPPPkUUwUUkkk..",
            ...magicianLegs,
          ],
          [
            ...magicianHead,
            "...kPkSSSkPk....",
            "..kPPkUwrwUkSkky",
            ".kPPPkUwwwUk....",
            ".kPPPkUUwUUk....",
            ...magicianLegs,
          ],
        ],
      },
      clothLeft: { frames: [clothLeft] },
      clothMid: {
        frames: [
          [
            "kkkkkk",
            "rrrrrr",
            "rrRrrr",
            "rrRrrr",
            "rrRrrr",
            "rrRrrr",
            "rrRrrr",
            "rrRrrr",
            "rrRrrr",
            "rrRrrr",
            "rrRrrr",
            "YYYYYY",
            "kYkYkY",
            "kkkkkk",
          ],
        ],
      },
      clothRight: { frames: [flipX(clothLeft)] },
      dove: {
        fps: 6,
        frames: [
          [
            "...kkk......",
            "..kwwgk.....",
            "..kwwwgk....",
            "...kwwwk.kk.",
            "kk..kwwkkwwk",
            "kwkkwwwwwwkY",
            "kwwwwwwwwwk.",
            ".kkgwwwwgk..",
            "...kkkkkk...",
          ],
          [
            "............",
            "............",
            "............",
            ".........kk.",
            "kk..kkkkkwwk",
            "kwkkwwwwwwkY",
            "kwwwgggwwwk.",
            ".kkkgggwwk..",
            "....kgkkk...",
          ],
        ],
      },
      sparkle: { fps: 6, frames: sparkle },
      poof: { fps: 8, frames: puff },
    },
  },
  {
    id: "paint-roller",
    name: "Paint Roller",
    emoji: "🖌️",
    bible: false,
    mode: "letter",
    story:
      "A painter walks in from the left with a roller and sets down a bucket. At each letter he rolls up and down twice, leaving one white streak tile over it, with a drip or two; then he steps to the next letter. When the word is painted over he wipes his brow and walks off.",
    sprites: {
      painterRoll: {
        fps: 5,
        frames: [hcat(painterStand, rollerHigh), hcat(painterStand, rollerLow)],
      },
      painterWalk: {
        fps: 6,
        frames: [hcat(painterStand, rollerLow), hcat(painterStep, rollerLow)],
      },
      streak: {
        frames: [
          [
            ".gwwwwwwg.",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            "gwwwwwwwwg",
            ".gwg..gwg.",
            "..g....g..",
          ],
        ],
      },
      drip: { frames: [[".g.", "gwg", "gwg", ".g."]] },
      bucket: {
        frames: [
          ["..kkk..", ".k...k.", "kkkkkkk", "kwwwwwk", "kGgGGGk", "kGgGGGk", ".kgGGk.", ".kGGGk.", ".kkkkk."],
        ],
      },
    },
  },
  {
    id: "ninja",
    name: "Ninja Slice",
    emoji: "🥷",
    bible: false,
    mode: "word",
    story:
      "A ninja runs in from the left, dashes across the word in a blur, and lands past its right edge with sword drawn. After a beat a slash flashes across the middle of the word (slashLeft + slashMid repeated + slashRight); the top half of the letters slides up-right, the bottom half slides down-left, and both fade. The ninja bows and vanishes in a puff of smoke.",
    sprites: {
      run: { fps: 8, frames: [ninjaRunA, ninjaRunB] },
      dash: { frames: [hcat(speedLines, ninjaRunB)] },
      pose: { frames: [ninjaPose] },
      slashLeft: { frames: [["..cc", "cuww", "..cc"]] },
      slashMid: { frames: [["cccccccc", "wwwwwwww", "cccccccc"]] },
      slashRight: { frames: [["cc....", "wwwcu.", "cc...."]] },
      ting: { fps: 6, frames: sparkle },
      smoke: { fps: 8, frames: puff },
    },
  },
];
