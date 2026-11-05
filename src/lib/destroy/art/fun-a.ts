import { flipX, type EffectArt, type Frame } from "../pixel";

const lumberjackHead = [
  ".....kkkkk..........",
  "....krrrrrk...kkk...",
  "...krrrrrrrk.kgggk..",
  "...kwwwwwwwk.kBggwk.",
  "...ksssskssk.kBggwk.",
  "...kssssssssk.Bkkk..",
  "...kBsBBBBkk..B.....",
  "....kBBBBBk...B.....",
  "...krRrRrRrk..B.....",
  "..krRrRrRrRrkkB.....",
  "..kRrRrRrRrRksBk....",
  "..kssRrRrRrRk.B.....",
  "...kuuuuuuuk..B.....",
];

export const FUN_A: EffectArt[] = [
  {
    id: "lumberjack",
    name: "Lumberjack",
    emoji: "🪓",
    bible: false,
    mode: "word",
    story:
      "Walks in from the left, chops the word's first letter a few times (chips fly), yells TIMBER! and the whole word topples over to the right.",
    sprites: {
      walk: {
        fps: 6,
        frames: [
          [
            ...lumberjackHead,
            "...kuuukuuuk........",
            "...kBBk.kBBk........",
            "...kkkk.kkkk........",
          ],
          [
            ...lumberjackHead,
            "...kuuk.kuuk........",
            "..kBBk...kBBk.......",
            "..kkkk...kkkk.......",
          ],
        ],
      },
      chop: {
        fps: 5,
        frames: [
          [
            ...lumberjackHead,
            "...kuuukuuuk........",
            "...kBBk.kBBk........",
            "...kkkk.kkkk........",
          ],
          [
            ".....kkkkk..........",
            "....krrrrrk.........",
            "...krrrrrrrk........",
            "...kwwwwwwwk........",
            "...ksssskssk........",
            "...kssssssssk.......",
            "...kBsBBBBkk........",
            "....kBBBBBk.........",
            "...krRrRrRrk....kkk.",
            "..krRrRrRrRrk..kgggk",
            "..kRrRrRrRrRsBBBkggk",
            "..kssRrRrRrRk...kgwk",
            "...kuuuuuuuk....kwk.",
            "...kuuukuuuk.....k..",
            "...kBBk.kBBk........",
            "...kkkk.kkkk........",
          ],
        ],
      },
      chip: {
        frames: [[".kk.", "kbbk", ".kk."]],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Shared bits for the effects below
// ---------------------------------------------------------------------------

const smokePuff: Frame[] = [
  [
    "..........",
    "..........",
    "..........",
    "...GGGG...",
    "..GwwggG..",
    "..GwgggG..",
    "...GGGG...",
    "..........",
    "..........",
    "..........",
  ],
  [
    "..........",
    "...GG.GG..",
    "..GwwGwgG.",
    ".GwwggggG.",
    ".GwgggggG.",
    "..GggggG..",
    "...GGGG...",
    "..........",
    "..........",
    "..........",
  ],
  [
    "..GG..GG..",
    ".GwgGGwgG.",
    "GwggggggG.",
    "GggggggggG",
    "GggggggggG",
    ".GggggggG.",
    "..GGGGGG..",
    "..........",
    "..........",
    "..........",
  ],
];

const letterBits: Frame[] = [
  ["kk", "kd"],
  ["dd", "dk"],
  ["Gd", "dG"],
];

// ---------------------------------------------------------------------------
// Blaster: space cadet
// ---------------------------------------------------------------------------

const cadetTop = [
  ".....kkkkkkkk.....",
  "....kwwwwwwwwk....",
  "...kwgwwwwwwwwk...",
  "...kwkkkkkkkkwk...",
  "...kwksssskskwk...",
  "...kwkssssnskwk...",
  "...kwkkkkkkkkwk...",
  "....kwwwwwwwwk....",
  "...kkoooooookk....",
  "..koookoooooookkkk",
  "..kookYYYYoosGGGck",
  "..ksskooooookkkk..",
  "...kYYYYYYYk......",
];

const cadetLegsTogether = [
  "...koookoook......",
  "...kwwk.kwwk......",
  "...kkkk.kkkk......",
];

const cadetLegsApart = [
  "...kook.kook......",
  "..kwwk...kwwk.....",
  "..kkkk...kkkk.....",
];

// ---------------------------------------------------------------------------
// Alien abduction: saucer
// ---------------------------------------------------------------------------

const saucerTop = [
  ".........kkkkkk.........",
  "........kwccccck........",
  ".......kwcllllcck.......",
  ".......kclkllklck.......",
  ".......kcllllllck.......",
  "......kkkkkkkkkkkk......",
  "....kkggggggggggggkk....",
  "..kkgggwggggggggggggkk..",
  ".kGGGGGGGGGGGGGGGGGGGGk.",
];

const saucerBottom = [
  ".kddddddddddddddddddddk.",
  "...kkkddddddddddddkkk...",
  "......kkkkkkkkkkkk......",
];

// ---------------------------------------------------------------------------
// Hungry worm
// ---------------------------------------------------------------------------

const wormHeadTop = [
  "...kkkkkk...",
  "..kllllllk..",
  ".klllllwwwk.",
  ".klllllwkwk.",
  "kllllllwwwk.",
];

// ---------------------------------------------------------------------------
// Chomper: round purple critter
// ---------------------------------------------------------------------------

const chomperEyes = [
  "....kkkkkk....",
  "..kkppppppkk..",
  ".kpppwwppwwpk.",
  ".kpppwkppwkpk.",
  "kppppppppppppk",
];

const chomperClosed = [
  ...chomperEyes,
  "kpnppppppppnpk",
  "kppwwwwwwwwppk",
  "kppkkkkkkkkppk",
  "kPppppppppppPk",
  ".kPPppppppPPk.",
  "..kkPPPPPPkk..",
  "....kkkkkk....",
];

const chomperOpen = [
  ...chomperEyes,
  "kpkkkkkkkkkkpk",
  "kpkwRRRRRRwkpk",
  "kpkRRRRRRRRkpk",
  "kpkRRrrrrRRkpk",
  ".kpkwRRRRwkpk.",
  "..kpkkkkkkpk..",
  "...kkPPPPkk...",
];

const chomperFeet = ["...kok..kok...", "...kkk..kkk..."];
const chomperFeetTucked = ["....kk..kk....", ".............."];

// ---------------------------------------------------------------------------
// Rocket launch: flames tile under every letter
// ---------------------------------------------------------------------------

const flameMid: Frame[] = [
  [
    "ffffff",
    "fyyffy",
    "yyffyy",
    "oyyyyo",
    "ooyyoo",
    "rooyor",
    ".royr.",
    ".roor.",
    "..rr..",
    "..r...",
  ],
  [
    "ffffff",
    "yffyyf",
    "yyffyy",
    "oyyyyo",
    "ooyyoo",
    "roooor",
    "rooor.",
    ".ror..",
    ".rr...",
    "......",
  ],
  [
    "ffffff",
    "yfffyy",
    "yyfyyy",
    "yyyyyo",
    "oyyooo",
    "oooorr",
    "rooor.",
    "..oor.",
    "...rr.",
    "....r.",
  ],
];

const flameLeft: Frame[] = [
  ["..f", ".yf", ".yy", ".oy", "..o", "..r", "...", "...", "...", "..."],
  ["..f", "..y", ".yy", ".oo", ".ro", "..r", "...", "...", "...", "..."],
  ["..f", ".yf", "oyy", ".oo", "..r", "...", "...", "...", "...", "..."],
];

const finLeft = [
  ".....k",
  "....kr",
  "...krr",
  "..krRr",
  ".krRrr",
  "krRrrr",
  "kkkkkk",
];

// ---------------------------------------------------------------------------
// Bulldozer
// ---------------------------------------------------------------------------

const dozerBody = [
  "...kkkkkkkk.............",
  "...kYYYYYYk.............",
  "...kccYYcck.........kkk.",
  "...kccskcck..k.....kGgk.",
  "...kccuucck..k.....kGgk.",
  "..kkkkkkkkkkkkkk...kGgk.",
  "..kYYYYYYYYYYYYk...kGgk.",
  "..kYYYYYYYYYYYYkkkkkGgk.",
  "..kYYYYYYYYYYYYkYYYkGgk.",
  "..kYYYYYYYYYYYYkkkkkGgk.",
  "..kkkkkkkkkkkkkk...kGgk.",
  ".kdddddddddddddk...kGgk.",
];

FUN_A.push(
  {
    id: "blaster",
    name: "Blaster",
    emoji: "🔫",
    bible: false,
    mode: "letter",
    story:
      "A space cadet walks in from the left and plants their feet. For each letter (left to right, faster on long words) they fire a bolt with a muzzle flash; the bolt hits with a sparkle and the letter bursts into a few pixel bits that fall and fade. They blow on the blaster and walk off.",
    sprites: {
      walk: {
        fps: 6,
        frames: [
          [...cadetTop, ...cadetLegsTogether],
          [...cadetTop, ...cadetLegsApart],
        ],
      },
      stand: { frames: [[...cadetTop, ...cadetLegsTogether]] },
      muzzleFlash: {
        fps: 12,
        frames: [
          ["..y..", ".yfy.", "yfwfy", ".yfy.", "..y.."],
          ["y...y", ".yfy.", ".fwf.", ".yfy.", "y...y"],
        ],
      },
      bolt: {
        frames: [[".uuuuuu.", "ucwwwwcu", ".uuuuuu."]],
      },
      hit: {
        fps: 10,
        frames: [
          ["...o...", "..oyo..", ".oyfyo.", "oyfwfyo", ".oyfyo.", "..oyo..", "...o..."],
          ["o..o..o", ".o.y.o.", "..yfy..", "oyfwfyo", "..yfy..", ".o.y.o.", "o..o..o"],
        ],
      },
      bits: { frames: letterBits },
    },
  },
  {
    id: "alien-abduction",
    name: "Alien Abduction",
    emoji: "🛸",
    bible: false,
    mode: "word",
    story:
      "A saucer swoops in from the top right and hovers over the middle of the word. A tractor beam (beamLeft + beamMid repeated + beamRight, stretched tall, drawn behind the letters and clipped to a trapezoid) widens to cover the whole word; the word wobbles, floats up while shrinking into the saucer with sparkles, the beam shuts off and the saucer zips away.",
    sprites: {
      saucer: {
        fps: 4,
        frames: [
          [...saucerTop, "kGGyGGGrGGGyGGGrGGGyGGGk", ...saucerBottom],
          [...saucerTop, "kGGrGGGyGGGrGGGyGGGrGGGk", ...saucerBottom],
        ],
      },
      beamLeft: {
        fps: 6,
        frames: [
          ["Yy", "Yy", "Yy", "Yy", "Yy", "Yy", "Yy", "Yy"],
          ["Yy", "Yw", "Yy", "Yy", "Yy", "Yy", "Yw", "Yy"],
        ],
      },
      beamMid: {
        fps: 6,
        frames: [
          ["yfyy", "yfwy", "yfyy", "yfyf", "wfyf", "yyyf", "yfyf", "ywyf"],
          ["yfyf", "yfyf", "yyyf", "yfwf", "yfyy", "yfyy", "wfyy", "yfyy"],
        ],
      },
      beamRight: {
        fps: 6,
        frames: [
          ["yY", "yY", "yY", "yY", "yY", "yY", "yY", "yY"],
          ["yY", "yY", "wY", "yY", "yY", "yY", "yY", "wY"],
        ],
      },
      sparkle: {
        fps: 8,
        frames: [
          ["..y..", "..w..", "ywwwy", "..w..", "..y.."],
          [".....", "..y..", ".ywy.", "..y..", "....."],
        ],
      },
    },
  },
  {
    id: "hungry-worm",
    name: "Hungry Worm",
    emoji: "🐛",
    bible: false,
    mode: "letter",
    story:
      "A worm head pops up at the word's left edge and inches right along the baseline. At each letter it opens wide, gulps the letter (letter shrinks into its mouth, a crumb or two drops) and a body segment is added behind its head; segments start small and get bigger as it eats (segS → segM → segL), so long words make a long, fat worm. At the end it burps a little cloud and wiggles off to the right.",
    sprites: {
      headClosed: {
        frames: [
          [
            ...wormHeadTop,
            "kllllllllllk",
            "kllllllnlllk",
            "kLlllllkkkkk",
            ".kLLlllllllk",
            "..kkkkkkkkk.",
          ],
        ],
      },
      headOpen: {
        frames: [
          [
            ...wormHeadTop,
            "klllllllwkk.",
            "kllllllkRRk.",
            "kLlllllkRRk.",
            ".kLLllllwkk.",
            "..kkkkkkkk..",
          ],
        ],
      },
      segS: {
        frames: [[".kkkk.", "kwlllk", "kllllk", "kllllk", "kLLLLk", ".kkkk."]],
      },
      segM: {
        frames: [
          ["..kkkk..", ".kwlllk.", "kllllllk", "kllllllk", "kllllllk", "kLllllLk", ".kLLLLk.", "..kkkk.."],
        ],
      },
      segL: {
        frames: [
          [
            "...kkkk...",
            ".kkwlllkk.",
            ".kwlllllk.",
            "kllllllllk",
            "kllllllllk",
            "kllllllllk",
            "kLllllllLk",
            ".kLllllLk.",
            ".kkLLLLkk.",
            "...kkkk...",
          ],
        ],
      },
      tail: {
        frames: [["...kkk", ".kklll", "klllLL", ".kkkkk"]],
      },
      burp: {
        frames: [
          [
            "..kkk....",
            ".kwwwkkk.",
            "kwwwwwwwk",
            "kwwgwwwwk",
            ".kwwwwgk.",
            ".kkwwwkk.",
            "...kkk...",
          ],
        ],
      },
      crumb: { frames: letterBits },
    },
  },
  {
    id: "chomper",
    name: "Chomper",
    emoji: "👾",
    bible: false,
    mode: "letter",
    story:
      "A round purple critter bounces in from the left and hops from letter to letter. On each one it lands, opens its big mouth, CHOMP, and the letter is gone with a couple of crumbs flying (hop + chomp speed up on long words). After the last letter it does a happy bounce with a heart and hops off to the right.",
    sprites: {
      hop: {
        fps: 6,
        frames: [
          [...chomperClosed, ...chomperFeet],
          [...chomperClosed, ...chomperFeetTucked],
        ],
      },
      chomp: {
        fps: 6,
        frames: [
          [...chomperOpen, ...chomperFeet],
          [...chomperClosed, ...chomperFeet],
        ],
      },
      crumb: { frames: letterBits },
      heart: {
        frames: [[".kk.kk.", "krnkrrk", "krrrrrk", ".krrrk.", "..krk..", "...k..."]],
      },
    },
  },
  {
    id: "rocket-launch",
    name: "Rocket Launch",
    emoji: "🚀",
    bible: false,
    mode: "word",
    story:
      "Fins pop onto both ends of the word and flames ignite underneath (flameLeft + one flameMid per letter + flameRight). The word rumbles as smoke puffs billow out at the base, then the word, fins and flames blast straight up off the top of the screen, leaving a few puffs that drift and fade.",
    sprites: {
      finLeft: { frames: [finLeft] },
      finRight: { frames: [flipX(finLeft)] },
      flameLeft: { fps: 12, frames: flameLeft },
      flameMid: { fps: 12, frames: flameMid },
      flameRight: { fps: 12, frames: flameLeft.map(flipX) },
      smoke: { fps: 6, frames: smokePuff },
    },
  },
  {
    id: "bulldozer",
    name: "Bulldozer",
    emoji: "🚜",
    bible: false,
    mode: "letter",
    story:
      "A little yellow bulldozer rolls in from the left. As its blade reaches each letter, the letter tips over into a rubble pile in front of the blade that grows (pileS → pileM → pileL) as more letters are scooped. Past the last letter it shoves the pile off the right edge, the pile bursts into a dust cloud, and the dozer reverses away.",
    sprites: {
      dozer: {
        fps: 8,
        frames: [
          [
            ...dozerBody,
            "kdgddgddgddgddgdk..kGgk.",
            "kdddddddddddddddk..kkkk.",
            ".kkkkkkkkkkkkkkk........",
          ],
          [
            ...dozerBody,
            "kgddgddgddgddgddk..kGgk.",
            "kdddddddddddddddk..kkkk.",
            ".kkkkkkkkkkkkkkk........",
          ],
        ],
      },
      pileS: {
        frames: [["...kk...", "..kGdk..", ".kdGGdk.", "kdGdddGk", "kkkkkkkk"]],
      },
      pileM: {
        frames: [
          [
            ".....kk.....",
            "...kkGdk....",
            "..kdGGdGkk..",
            ".kGdddGdGdk.",
            "kdGdGddGddGk",
            "kkkkkkkkkkkk",
          ],
        ],
      },
      pileL: {
        frames: [
          [
            "......kkk.......",
            "....kkGdGk......",
            "...kdGddGdkk....",
            "..kGdGGdddGdk...",
            ".kdddGdGGdGddkk.",
            "kGdGddGdddGdGGdk",
            "kdGddGdGddGdddGk",
            "kkkkkkkkkkkkkkkk",
          ],
        ],
      },
      dust: { fps: 6, frames: smokePuff },
    },
  }
);
