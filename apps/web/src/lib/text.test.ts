import { describe, expect, it } from "vitest";
import { splitWords } from "./text";

describe("splitWords", () => {
  it("keeps the full text", () => {
    const s = "Everything you need, in one path.";
    expect(splitWords(s, "en").join("")).toBe(s);
  });
  it("never splits inside Bangla conjuncts or vowel signs", () => {
    const s = "যা দরকার সব, একটাই path এ। ক্ষমতা প্রশ্ন";
    const words = splitWords(s, "bn");
    expect(words.join("")).toBe(s);
    expect(words.some((w) => w.includes("ক্ষমতা"))).toBe(true);
    expect(words.some((w) => w.includes("প্রশ্ন"))).toBe(true);
    expect(words.every((w) => !/^[া-্]/.test(w))).toBe(true); // no word starts with a kar/hasanta
  });
});
