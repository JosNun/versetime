<script lang="ts">
  import { onMount } from "svelte";
  import { EFFECT_ART } from "../lib/destroy/art";
  import { frameToDataURL, validateEffect, type SpriteDef } from "../lib/destroy/pixel";

  // Letters in the app are ~30px tall; sprites at 3x land around 48px, which is "in-app" size.
  const APP_SCALE = 3;
  const ZOOM_SCALE = 6;

  let tick = 0;
  onMount(() => {
    const id = setInterval(() => (tick += 1), 1000 / 60);
    return () => clearInterval(id);
  });

  function currentFrame(sprite: SpriteDef, t: number) {
    const fps = sprite.fps ?? 6;
    const i = Math.floor((t / 60) * fps) % sprite.frames.length;
    return frameToDataURL(sprite.frames[i]);
  }

  const size = (sprite: SpriteDef, scale: number) =>
    `width:${sprite.frames[0][0].length * scale}px;height:${sprite.frames[0].length * scale}px`;

  // ?ids=lumberjack,worm limits the gallery to specific effects
  const only = new URLSearchParams(location.search).get("ids")?.split(",");
  const effects = EFFECT_ART.filter((e) => !only || only.includes(e.id)).map((e) => ({
    ...e,
    errors: validateEffect(e),
  }));
</script>

<div class="p-8 max-w-6xl mx-auto font-sans text-gray-700">
  <h1 class="text-3xl font-bold mb-1">Word Destroyer Sprites</h1>
  <p class="text-gray-500 mb-8">
    {effects.length} effects. Each sprite shows looping at app size ({APP_SCALE}x) and zoomed ({ZOOM_SCALE}x), with its frame strip.
  </p>

  {#each effects as effect, i}
    <section class="mb-10 border-t-2 border-gray-200 pt-6">
      <div class="flex items-baseline gap-3 flex-wrap">
        <h2 class="text-2xl font-bold">{i + 1}. {effect.emoji} {effect.name}</h2>
        {#if effect.bible}<span class="text-xs font-bold bg-yellow-200 px-2 py-0.5 rounded">BIBLE</span>{/if}
        <span class="text-xs font-bold bg-gray-200 px-2 py-0.5 rounded uppercase">{effect.mode === "letter" ? "per letter" : "whole word"}</span>
      </div>
      <p class="text-gray-500 mt-1 mb-4">{effect.story}</p>
      {#if effect.errors.length}
        <pre class="text-red-600 text-xs mb-4">{effect.errors.join("\n")}</pre>
      {/if}

      <div class="flex flex-wrap gap-8 items-end">
        {#each Object.entries(effect.sprites) as [name, sprite]}
          <div class="flex flex-col items-start gap-2">
            <div class="flex items-end gap-4">
              <img alt={name} src={currentFrame(sprite, tick)} style="{size(sprite, APP_SCALE)};image-rendering:pixelated" />
              <img alt={name} src={currentFrame(sprite, tick)} style="{size(sprite, ZOOM_SCALE)};image-rendering:pixelated" />
            </div>
            {#if sprite.frames.length > 1}
              <div class="flex gap-1">
                {#each sprite.frames as frame}
                  <img alt="" src={frameToDataURL(frame)} class="border border-gray-200" style="{size(sprite, 2)};image-rendering:pixelated" />
                {/each}
              </div>
            {/if}
            <div class="text-xs text-gray-400">{name} · {sprite.frames[0][0].length}×{sprite.frames[0].length} · {sprite.frames.length}f</div>
          </div>
        {/each}

        <!-- Sample word in the app's letter style, for scale -->
        <div class="flex space-x-1 text-3xl ml-auto">
          {#each "GRACE".split("") as letter}
            <div class="w-7 uppercase text-center border-b-2 border-gray-300 font-semibold text-gray-700">{letter}</div>
          {/each}
        </div>
      </div>
    </section>
  {/each}
</div>
