"use client";

import {
  Children,
  isValidElement,
  useId,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

const LABELS: Record<string, string> = {
  c: "C",
  cpp: "C++",
  go: "Go",
  python: "Python",
  java: "Java",
  rust: "Rust",
  javascript: "JavaScript",
  csharp: "C#",
  typescript: "TypeScript",
  bash: "Shell",
  asm: "Assembly",
};

// The reader's language, shared by every tab group on every page (like a docs site).
const KEY = "cf:code-lang";
const EVENT = "cf-code-lang";
const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const choose = (lang: string) => {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    // private mode: the choice just isn't remembered
  }
  window.dispatchEvent(new Event(EVENT));
};

type Pre = ReactElement<{ "data-lang"?: string; "data-label"?: string }>;

/** One example in several languages: a tab per highlighted <pre> from the Markdown. */
export function CodeTabs({ children }: { children?: ReactNode }) {
  const blocks = Children.toArray(children).filter((c): c is Pre =>
    isValidElement(c),
  );
  const langs = blocks.map((b) => b.props["data-lang"] ?? "text");
  const preferred = useSyncExternalStore(subscribe, read, () => null);
  const active = Math.max(0, preferred ? langs.indexOf(preferred) : 0);
  const id = useId();

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + langs.length) % langs.length;
    choose(langs[next]!);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div className="code-tabs">
      <div role="tablist" aria-label="Code language" className="code-tabs-bar">
        {langs.map((lang, i) => (
          <button
            key={lang + i}
            id={`${id}-tab-${i}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => choose(lang)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {blocks[i]!.props["data-label"] ?? LABELS[lang] ?? lang}
          </button>
        ))}
      </div>
      {blocks.map((b, i) => (
        <div
          key={i}
          id={`${id}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${i}`}
          hidden={i !== active}
        >
          {b}
        </div>
      ))}
    </div>
  );
}
