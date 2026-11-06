"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProgressBar, ProgressRing, useScrollProgress } from "@/components/ui/scroll-progress";
import { pad2 } from "@/content/course";
import type { LessonSection } from "@/lib/content/markdown";

/** A heading counts as "being read" once its top passes this line (px from the viewport top). */
const READ_LINE = 140;

/**
 * Sticky "on this page" list for a lesson: numbered sections with their sub-sections.
 * Highlights what you're reading, and the learner from the course route walks along the
 * rail to it, then stands there reading a book, grinning more the further into the
 * chapter you get (and cheering at the last section).
 */
export function LessonToc({
  items,
  label,
}: {
  items: LessonSection[];
  label: string;
}) {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // Reading progress through the article that holds these headings.
  const firstId = items[0]?.id;
  const article = useCallback(
    () => (firstId ? (document.getElementById(firstId)?.closest("article") ?? null) : null),
    [firstId],
  );
  const read = useScrollProgress(article);

  // Scroll-spy: the last heading above the read line is the active one.
  useEffect(() => {
    const heads = items
      .map((it) => document.getElementById(it.id))
      .filter((h): h is HTMLElement => !!h);
    let raf = 0;
    const update = () => {
      raf = 0;
      let i = 0;
      heads.forEach((h, k) => {
        if (h.getBoundingClientRect().top <= READ_LINE) i = k;
      });
      // At the very bottom the last sections may never reach the line; finish anyway.
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      )
        i = heads.length - 1;
      setActive(i);
    };
    const onScroll = () => {
      raf ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  // Keep the active item in view inside the sidebar.
  useEffect(() => {
    const li = list.current?.children[active] as HTMLElement | undefined;
    const box = scroller.current;
    if (li && box) box.scrollTo({ top: li.offsetTop - box.clientHeight / 3 });
  }, [active]);

  let n = 0;
  return (
    <nav aria-label={label}>
      <ProgressBar value={read} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted font-medium">{label}</p>
        <ProgressRing value={read} />
      </div>
      <div
        ref={scroller}
        className="lesson-toc-scroll relative mt-4 max-h-[calc(100vh-14rem)] overflow-y-auto pr-2"
      >
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-[18px] w-0.5 rounded-full bg-[var(--border)]"
        />
        <ol ref={list} className="relative text-sm">
          {items.map((it, i) => {
            const num = it.depth === 2 ? pad2(++n) : null;
            return (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  aria-current={i === active ? "location" : undefined}
                  data-depth={it.depth}
                  className="lesson-toc-link"
                >
                  {num && (
                    <span className="font-mono text-xs opacity-70">{num}</span>
                  )}
                  <span>{it.title}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
