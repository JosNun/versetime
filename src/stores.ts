import { addMinutes } from "date-fns";
import { writable } from "svelte/store";

export type Translation = "ESV" | "NIV";

export const settings = writable<{
  endTime: Date;
  translation: Translation;
  passage: {
    text: string;
    reference: string;
  };
}>({
  endTime: addMinutes(new Date(), 5),
  translation: "ESV",
  passage: {
    text: "",
    reference: "",
  },
});
