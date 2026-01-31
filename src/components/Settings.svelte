<script lang="ts">
  import { isValid } from "date-fns";
  import { settings, type Translation } from "../stores";

  let isOpen = true;
  let reference = "";

  const inputHour = $settings.endTime.getHours().toString().padStart(2, "0");
  const inputMinute = $settings.endTime
    .getMinutes()
    .toString()
    .padStart(2, "0");

  $: inputValue = inputHour + ":" + inputMinute;

  // Book name to bolls.life book ID mapping
  const bookNameToId: Record<string, number> = {
    "genesis": 1, "gen": 1, "ge": 1,
    "exodus": 2, "exod": 2, "ex": 2,
    "leviticus": 3, "lev": 3, "le": 3,
    "numbers": 4, "num": 4, "nu": 4,
    "deuteronomy": 5, "deut": 5, "de": 5,
    "joshua": 6, "josh": 6, "jos": 6,
    "judges": 7, "judg": 7, "jdg": 7,
    "ruth": 8, "rth": 8, "ru": 8,
    "1 samuel": 9, "1samuel": 9, "1 sam": 9, "1sam": 9, "1 sa": 9, "1sa": 9,
    "2 samuel": 10, "2samuel": 10, "2 sam": 10, "2sam": 10, "2 sa": 10, "2sa": 10,
    "1 kings": 11, "1kings": 11, "1 kgs": 11, "1kgs": 11, "1 ki": 11, "1ki": 11,
    "2 kings": 12, "2kings": 12, "2 kgs": 12, "2kgs": 12, "2 ki": 12, "2ki": 12,
    "1 chronicles": 13, "1chronicles": 13, "1 chr": 13, "1chr": 13, "1 ch": 13, "1ch": 13,
    "2 chronicles": 14, "2chronicles": 14, "2 chr": 14, "2chr": 14, "2 ch": 14, "2ch": 14,
    "ezra": 15, "ezr": 15,
    "nehemiah": 16, "neh": 16, "ne": 16,
    "esther": 17, "esth": 17, "es": 17,
    "job": 18, "jb": 18,
    "psalms": 19, "psalm": 19, "ps": 19, "psa": 19,
    "proverbs": 20, "prov": 20, "pr": 20,
    "ecclesiastes": 21, "eccl": 21, "ecc": 21, "ec": 21,
    "song of solomon": 22, "song of songs": 22, "song": 22, "sos": 22, "ss": 22,
    "isaiah": 23, "isa": 23, "is": 23,
    "jeremiah": 24, "jer": 24, "je": 24,
    "lamentations": 25, "lam": 25, "la": 25,
    "ezekiel": 26, "ezek": 26, "eze": 26,
    "daniel": 27, "dan": 27, "da": 27,
    "hosea": 28, "hos": 28, "ho": 28,
    "joel": 29, "joe": 29, "jl": 29,
    "amos": 30, "am": 30,
    "obadiah": 31, "obad": 31, "ob": 31,
    "jonah": 32, "jon": 32, "jnh": 32,
    "micah": 33, "mic": 33, "mi": 33,
    "nahum": 34, "nah": 34, "na": 34,
    "habakkuk": 35, "hab": 35,
    "zephaniah": 36, "zeph": 36, "zep": 36,
    "haggai": 37, "hag": 37, "hg": 37,
    "zechariah": 38, "zech": 38, "zec": 38,
    "malachi": 39, "mal": 39, "ml": 39,
    "matthew": 40, "matt": 40, "mat": 40, "mt": 40,
    "mark": 41, "mrk": 41, "mk": 41,
    "luke": 42, "luk": 42, "lk": 42,
    "john": 43, "joh": 43, "jn": 43,
    "acts": 44, "act": 44, "ac": 44,
    "romans": 45, "rom": 45, "ro": 45,
    "1 corinthians": 46, "1corinthians": 46, "1 cor": 46, "1cor": 46, "1 co": 46, "1co": 46,
    "2 corinthians": 47, "2corinthians": 47, "2 cor": 47, "2cor": 47, "2 co": 47, "2co": 47,
    "galatians": 48, "gal": 48, "ga": 48,
    "ephesians": 49, "eph": 49,
    "philippians": 50, "phil": 50, "php": 50,
    "colossians": 51, "col": 51,
    "1 thessalonians": 52, "1thessalonians": 52, "1 thess": 52, "1thess": 52, "1 th": 52, "1th": 52,
    "2 thessalonians": 53, "2thessalonians": 53, "2 thess": 53, "2thess": 53, "2 th": 53, "2th": 53,
    "1 timothy": 54, "1timothy": 54, "1 tim": 54, "1tim": 54, "1 ti": 54, "1ti": 54,
    "2 timothy": 55, "2timothy": 55, "2 tim": 55, "2tim": 55, "2 ti": 55, "2ti": 55,
    "titus": 56, "tit": 56,
    "philemon": 57, "phlm": 57, "phm": 57,
    "hebrews": 58, "heb": 58,
    "james": 59, "jas": 59, "jm": 59,
    "1 peter": 60, "1peter": 60, "1 pet": 60, "1pet": 60, "1 pe": 60, "1pe": 60,
    "2 peter": 61, "2peter": 61, "2 pet": 61, "2pet": 61, "2 pe": 61, "2pe": 61,
    "1 john": 62, "1john": 62, "1 jn": 62, "1jn": 62,
    "2 john": 63, "2john": 63, "2 jn": 63, "2jn": 63,
    "3 john": 64, "3john": 64, "3 jn": 64, "3jn": 64,
    "jude": 65, "jud": 65,
    "revelation": 66, "rev": 66, "re": 66,
  };

  function parseReference(ref: string): { bookId: number; chapter: number; verseStart: number; verseEnd: number } | null {
    // Match patterns like "John 3:16", "John 3:16-17", "1 John 3:16", "1 Corinthians 13:4-7"
    const match = ref.match(/^(\d?\s*[a-zA-Z\s]+?)\s*(\d+):(\d+)(?:-(\d+))?$/);
    if (!match) return null;

    const bookName = match[1].trim().toLowerCase();
    const chapter = parseInt(match[2], 10);
    const verseStart = parseInt(match[3], 10);
    const verseEnd = match[4] ? parseInt(match[4], 10) : verseStart;

    const bookId = bookNameToId[bookName];
    if (!bookId) return null;

    return { bookId, chapter, verseStart, verseEnd };
  }

  async function fetchFromESV(): Promise<{ reference: string; text: string }> {
    const res = (await fetch(
      `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(
        reference
      )}&include-verse-numbers=false&include-short-copyright=false&include-passage-references=false&include-footnotes=false&include-headings=false&include-selahs=false`,
      {
        headers: {
          Authorization: `Token ${import.meta.env.PUBLIC_ESV_API_KEY}`,
        },
      }
    ).then((res) => res.json())) as {
      canonical: string;
      query: string;
      passages: string[];
    };

    return {
      reference: res.canonical.trim(),
      text: res.passages.map((text) => text.trim()).join(""),
    };
  }

  async function fetchFromBolls(translation: string): Promise<{ reference: string; text: string }> {
    const parsed = parseReference(reference);
    if (!parsed) {
      throw new Error("Could not parse reference. Please use format like 'John 3:16' or 'John 3:16-17'");
    }

    const { bookId, chapter, verseStart, verseEnd } = parsed;
    const verses: string[] = [];

    // Fetch each verse in the range
    for (let verse = verseStart; verse <= verseEnd; verse++) {
      const res = await fetch(
        `https://bolls.life/get-text/${translation}/${bookId}/${chapter}/${verse}/`
      );
      const data = await res.json() as { text: string };
      // Remove HTML tags from the text
      const cleanText = data.text.replace(/<[^>]*>/g, "").trim();
      verses.push(cleanText);
    }

    return {
      reference: reference,
      text: verses.join(" "),
    };
  }

  async function fetchReference() {
    try {
      let result: { reference: string; text: string };

      if ($settings.translation === "ESV") {
        result = await fetchFromESV();
      } else {
        result = await fetchFromBolls($settings.translation);
      }

      settings.update((settings) => ({
        ...settings,
        passage: {
          reference: result.reference,
          text: result.text,
        },
      }));
    } catch (error) {
      console.error("Failed to fetch verse:", error);
      alert(error instanceof Error ? error.message : "Failed to fetch verse");
    }
  }

  function onTranslationChange(newTranslation: Translation) {
    settings.update((settings) => ({
      ...settings,
      translation: newTranslation,
    }));
  }

  function onDateChange(dateInput: string) {
    const [hours, minutes] = dateInput.split(":");

    const newDate = new Date();
    newDate.setHours(parseInt(hours));
    newDate.setMinutes(parseInt(minutes));

    if (!isValid(newDate)) {
      return;
    }

    settings.update((settings) => ({
      ...settings,
      endTime: newDate,
    }));
  }
</script>

<div>
  <button
    class="fixed left-4 top-3 text-gray-400"
    on:click={() => (isOpen = true)}
  >
    Settings
  </button>
  <div
    class="fixed left-0 top-0 z-10 w-96 max-w-full h-full bg-gray-200 pb-3 overflow-auto translate transition flex flex-col {!isOpen
      ? '-translate-x-full'
      : ''}"
  >
    <div class="flex justify-between items-center px-4 py-3">
      <div class="font-bold text-gray-500 uppercase text-sm tracking-wide">
        Settings
      </div>

      <button class="text-gray-600" on:click={() => (isOpen = false)}>X</button>
    </div>

    <div class="px-4 space-y-4">
      <label class="block">
        <div class="font-bold text-sm text-gray-600 tracking-wide border">
          Countdown To
        </div>
        <input
          type="time"
          class="px-4 py-2 text-gray-600 rounded mt-1"
          bind:value={inputValue}
          on:change={(e) => onDateChange(e.currentTarget.value)}
        />
      </label>

      <label class="block">
        <div class="font-bold text-sm text-gray-600 tracking-wide border">
          Translation
        </div>
        <select
          class="px-4 py-2 text-gray-600 rounded mt-1 w-full"
          value={$settings.translation}
          on:change={(e) => onTranslationChange(e.currentTarget.value as Translation)}
        >
          <option value="ESV">ESV (English Standard Version)</option>
          <option value="NIV">NIV (New International Version)</option>
        </select>
      </label>

      <form
        on:submit={(e) => {
          e.preventDefault();
          fetchReference();
        }}
      >
        <div class="font-bold text-sm text-gray-600 tracking-wide border">
          Reference
        </div>
        <div class="flex items-center space-x-2">
          <input
            type="text"
            placeholder="e.g. 'John 3:16'"
            class="px-4 py-2 text-gray-600 rounded mt-1 flex-1 min-w-0"
            bind:value={reference}
          />
          <button
            class="hover:bg-gray-300 transition px-2 py-1 rounded"
            type="submit">Fetch</button
          >
        </div>
      </form>
    </div>
    <div class="text-xs text-gray-600 mt-auto px-4 py-2">
      {#if $settings.translation === "ESV"}
        Scripture quotations are from The ESV® Bible (The Holy Bible, English
        Standard Version®), copyright © 2001 by Crossway, a publishing ministry of
        Good News Publishers. Used by permission. All rights reserved.
      {:else if $settings.translation === "NIV"}
        Scripture quotations taken from The Holy Bible, New International Version® NIV®.
        Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission.
        All rights reserved worldwide.
      {/if}
    </div>
  </div>
</div>
