<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { destroyWord, resetGlyphs } from "../lib/destroy/engine";

  const wordRegex = /[a-zA-Z0-9]/;

  /** The word's characters, including punctuation. */
  export let letters: string;
  /** Per-character reveal state (punctuation is always shown). */
  export let shown: boolean[];
  /** Hidden after being tapped away. */
  export let hidden = false;
  export let canInteract = false;

  let className = "";
  export { className as class };

  let wordElement: HTMLElement;
  let destroying = false;

  const dispatch = createEventDispatcher<{ tap: void }>();

  function handleTap() {
    if (!canInteract || destroying) return;
    dispatch("tap");
  }

  /** Play a destroy effect (random unless given) and resolve when the word is gone. */
  export async function destroy(effectId?: string) {
    if (destroying) return;
    destroying = true;
    try {
      await destroyWord(wordElement, effectId);
    } finally {
      destroying = false;
    }
  }

  /** Clear effect leftovers; call just before un-hiding so letters fade back in. */
  export function restore() {
    resetGlyphs(wordElement);
  }
</script>

<span
  bind:this={wordElement}
  class="flex space-x-1 {className} {canInteract ? 'cursor-pointer select-none' : ''}"
  on:click={handleTap}
  on:touchend|preventDefault={handleTap}
  role="button"
  tabindex={canInteract ? 0 : -1}
>
  {#each letters.split("") as letter, i}
    {@const isSymbol = !wordRegex.test(letter)}
    <div
      class="w-7 uppercase text-center {!isSymbol ? 'border-b-2 border-gray-300 ' : ''} font-semibold text-gray-700"
    >
      <div
        data-glyph={isSymbol ? undefined : ""}
        class="transition-all duration-500 ease-out
          {!isSymbol && !shown[i]
            ? 'opacity-0 -translate-y-2 scale-75'
            : !isSymbol && hidden
              ? 'opacity-0'
              : 'opacity-100 scale-100 rotate-0 blur-0'}"
      >
        {letter}
      </div>
    </div>
  {/each}
</span>
