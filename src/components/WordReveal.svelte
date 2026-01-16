<script lang="ts">
  import { settings } from "../stores";
  $: text = $settings.passage.text;
  $: reference = $settings.passage.reference;
  let changeTimeout;
  let showAgainTimeout;

  const wordRegex = /[a-zA-Z0-9]/;
  const defaultCharacterTimeout = 5_000;
  let characterTimeout = defaultCharacterTimeout;

  let wordGroups;
  let shownLetters;

  // Track manually hidden words and whether all letters are revealed
  let hiddenWords: Set<number> = new Set();
  let allRevealed = false;

  // Double-tap detection
  let lastTapTime: Map<number, number> = new Map();
  const DOUBLE_TAP_THRESHOLD = 400; // ms

  $: getShownLetters = (wordGroups) => {
    const letters = new Array(
      wordGroups.reduce((acc, word) => word.letters.length + acc, 0)
    ).fill(false) as boolean[];

    for (let group of wordGroups) {
      for (let i = 0; i < group.letters.length; i++) {
        if (!wordRegex.test(group.letters[i])) {
          letters[group.offset + i] = true;
        }
      }
    }

    return letters;
  };

  const initWordGroups = () => {
    wordGroups = text
      .split(/\s/g)
      .filter(Boolean)
      .map((word, i, arr) => {
        const offset = arr
          .slice(0, i)
          .reduce((acc, word) => acc + word.length, 0);

        return {
          offset,
          letters: word,
        };
      });

    const wordGroupOffset = wordGroups.reduce((acc, wordGroup) => {
      return acc + wordGroup.letters.length;
    }, 0);

    const referenceGroups = reference
      .split(/\s/g)
      .filter(Boolean)
      .map((word, i, arr) => {
        const offset =
          wordGroupOffset +
          arr.slice(0, i).reduce((acc, word) => acc + word.length, 0);

        return {
          isReferenceStart: i === 0,
          offset,
          letters: word,
        };
      });

    wordGroups = [...wordGroups, ...referenceGroups];
  };

  const initShownLetters = () => {
    shownLetters = getShownLetters(wordGroups);
    hiddenWords = new Set();
    allRevealed = false;
    lastTapTime = new Map();
  };

  $: init = () => {
    initWordGroups();
    initShownLetters();

    const charCount = (text + reference)
      .split("")
      .filter((char) => wordRegex.test(char)).length;
    const timeRemaining = new Date(
      $settings.endTime.getTime() - new Date().getTime()
    ).getTime();

    const iterationTime = charCount * characterTimeout;

    if (iterationTime > timeRemaining) {
      characterTimeout = (timeRemaining - 10_000) / charCount;
    } else {
      characterTimeout = defaultCharacterTimeout;
    }

    onWordChange();
  };

  const clearTimer = () => {
    clearTimeout(changeTimeout);
    clearTimeout(showAgainTimeout);
  };

  $: $settings.endTime, text, clearTimer(), init();

  function onWordChange() {
    changeTimeout = setTimeout(() => {
      const hidden = shownLetters
        .map((letter, i) => !letter && i)
        .filter((idx: false | number) => {
          return idx !== false;
        });

      if (hidden.length) {
        const toShow = hidden[Math.floor(Math.random() * hidden.length)];

        shownLetters[toShow] = true;

        onWordChange();
      } else if (wordGroups.length) {
        allRevealed = true;
        showAgainTimeout = setTimeout(showAgain, 10_000);
      }
    }, characterTimeout);
  }

  function showAgain() {
    // Don't cycle if user has hidden any words
    if (hiddenWords.size > 0) {
      return;
    }

    const timeRemaining = new Date(
      $settings.endTime.getTime() - new Date().getTime()
    ).getTime();

    const iterationTime =
      (text + reference).split("").filter((char) => wordRegex.test(char))
        .length * characterTimeout;

    if (iterationTime < timeRemaining) {
      allRevealed = false;
      shownLetters = getShownLetters(wordGroups);
      onWordChange();
    }
  }

  function handleWordTap(wordIndex: number, event: MouseEvent | TouchEvent) {
    if (!allRevealed) return;

    const now = Date.now();
    const lastTap = lastTapTime.get(wordIndex) || 0;

    if (hiddenWords.has(wordIndex)) {
      // Word is hidden - check for double-tap to restore
      if (now - lastTap < DOUBLE_TAP_THRESHOLD) {
        hiddenWords.delete(wordIndex);
        hiddenWords = hiddenWords; // Trigger reactivity
        lastTapTime.delete(wordIndex);
      } else {
        lastTapTime.set(wordIndex, now);
      }
    } else {
      // Word is visible - single tap to hide
      hiddenWords.add(wordIndex);
      hiddenWords = hiddenWords; // Trigger reactivity
      lastTapTime.set(wordIndex, now);
    }
  }
</script>

{#if wordGroups}
  <div class="flex gap-5 text-3xl max-w-full flex-wrap justify-center mx-8">
    {#each wordGroups as group, groupIndex}
      {#key group.letters + groupIndex}
        {#if group.isReferenceStart}
          <div class="w-full" />
        {/if}
        <span
          class="flex space-x-1 {group.isReferenceStart ? 'ml-auto' : ''} {allRevealed ? 'cursor-pointer select-none' : ''}"
          on:click={(e) => handleWordTap(groupIndex, e)}
          on:touchend|preventDefault={(e) => handleWordTap(groupIndex, e)}
          role="button"
          tabindex={allRevealed ? 0 : -1}
        >
          {#each group.letters.split("") as letter, letterIndex}
            {@const isSymbol = !wordRegex.test(letter)}
            {@const isWordHidden = hiddenWords.has(groupIndex)}
            <div
              class="w-7 uppercase text-center {!isSymbol
                ? 'border-b-2 border-gray-300 '
                : ''} font-semibold text-gray-700"
            >
              <div
                class="transition-all duration-500 ease-out
                  {!isSymbol && !shownLetters[group.offset + letterIndex]
                    ? 'opacity-0 -translate-y-2 scale-75'
                    : !isSymbol && isWordHidden
                      ? 'opacity-0 scale-0 rotate-180 blur-sm'
                      : 'opacity-100 scale-100 rotate-0 blur-0'}"
              >
                {letter}
              </div>
            </div>
          {/each}
        </span>
      {/key}
    {/each}
  </div>
{/if}
