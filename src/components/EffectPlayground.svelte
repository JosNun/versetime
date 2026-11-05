<script lang="ts">
  import AnimatedWord from "./AnimatedWord.svelte";
  import { EFFECT_ART } from "../lib/destroy/art";
  import { CHOREOGRAPHY } from "../lib/destroy/effects";
  import { pickEffect } from "../lib/destroy/engine";

  const params = new URLSearchParams(location.search);
  const text =
    params.get("text") ?? "The LORD is my shepherd; I shall not want. He restoreth my soul. Psalm 23:1";
  const words = text.split(/\s+/).filter(Boolean);

  let effect = params.get("effect") ?? "random";
  let hidden = new Set<number>();
  let busy = new Set<number>();
  let lastPlayed = "";
  let refs: Record<number, AnimatedWord> = {};

  const nameOf = (id: string) => {
    const e = EFFECT_ART.find((e) => e.id === id);
    return e ? `${e.emoji} ${e.name}` : id;
  };

  async function tap(i: number) {
    if (busy.has(i)) return;
    if (hidden.has(i)) {
      refs[i].restore();
      hidden.delete(i);
      hidden = hidden;
      return;
    }
    const id = effect === "random" ? pickEffect() : effect;
    lastPlayed = nameOf(id);
    busy = busy.add(i);
    await refs[i].destroy(id);
    busy.delete(i);
    busy = busy;
    hidden = hidden.add(i);
  }

  function restoreAll() {
    hidden.forEach((i) => refs[i].restore());
    hidden = new Set();
  }

  function step(dir: number) {
    const ids = ["random", ...EFFECT_ART.map((e) => e.id)];
    effect = ids[(ids.indexOf(effect) + dir + ids.length) % ids.length];
  }

  // Hook for automated checks: window.__destroyWord(index, effectId)
  (window as any).__destroyWord = (i: number, id?: string) => refs[i].destroy(id);
</script>

<div class="min-h-screen flex flex-col items-center px-4 py-6 gap-6 text-gray-700 overflow-hidden">
  <div class="w-full max-w-2xl flex flex-col gap-3">
    <h1 class="text-xl font-bold">Word destroyer playground</h1>
    <div class="flex gap-2 items-center">
      <button class="px-3 py-2 rounded bg-gray-100 font-bold" on:click={() => step(-1)}>◀</button>
      <select class="flex-1 px-3 py-2 rounded border border-gray-300 bg-white" bind:value={effect}>
        <option value="random">🎲 Random</option>
        {#each EFFECT_ART as e, i}
          <option value={e.id}>
            {i + 1}. {e.emoji} {e.name}{CHOREOGRAPHY[e.id] ? "" : " (not built yet)"}
          </option>
        {/each}
      </select>
      <button class="px-3 py-2 rounded bg-gray-100 font-bold" on:click={() => step(1)}>▶</button>
    </div>
    <div class="flex gap-2 items-center text-sm">
      <button class="px-3 py-2 rounded bg-gray-700 text-white font-bold" on:click={restoreAll}>Restore all</button>
      <span class="text-gray-500">Tap a word to destroy it · tap again to bring it back</span>
    </div>
    <div class="text-sm text-gray-500 h-5">{lastPlayed ? `Last: ${lastPlayed}` : ""}</div>
  </div>

  <div class="flex gap-5 text-3xl max-w-full flex-wrap justify-center mt-16">
    {#each words as word, i}
      <AnimatedWord
        bind:this={refs[i]}
        letters={word}
        shown={word.split("").map(() => true)}
        hidden={hidden.has(i)}
        canInteract={true}
        on:tap={() => tap(i)}
      />
    {/each}
  </div>
</div>
