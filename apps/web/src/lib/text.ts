/**
 * Split text into words for kinetic animation without breaking Bangla conjuncts
 * (যুক্তাক্ষর) or vowel signs (কার). Character-level splitting would tear "ক্ষ"/"প্র"
 * apart, so we only ever split on word boundaries via Intl.Segmenter.
 */
export function splitWords(text: string, locale: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(locale, { granularity: "word" });
    const out: string[] = [];
    let buf = "";
    for (const { segment, isWordLike } of seg.segment(text)) {
      // Attach whitespace/punctuation to the preceding word so spacing is preserved.
      if (isWordLike && buf.trim()) {
        out.push(buf);
        buf = "";
      }
      buf += segment;
    }
    if (buf) out.push(buf);
    return out;
  }
  return text.split(/(?<=\s)/);
}
