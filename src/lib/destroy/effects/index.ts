import type { Choreography } from "../engine";
import { BIBLE_A } from "./bible-a";
import { BIBLE_B } from "./bible-b";
import { FUN_A } from "./fun-a";
import { FUN_B } from "./fun-b";

/** Effect id → choreography. Effects missing here fall back to a simple fade. */
export const CHOREOGRAPHY: Record<string, Choreography> = { ...BIBLE_A, ...BIBLE_B, ...FUN_A, ...FUN_B };
