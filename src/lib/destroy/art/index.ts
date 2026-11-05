import type { EffectArt } from "../pixel";
import { BIBLE_A } from "./bible-a";
import { BIBLE_B } from "./bible-b";
import { FUN_A } from "./fun-a";
import { FUN_B } from "./fun-b";

export const EFFECT_ART: EffectArt[] = [...BIBLE_A, ...BIBLE_B, ...FUN_A, ...FUN_B];
