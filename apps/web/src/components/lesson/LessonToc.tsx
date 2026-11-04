"use client";

import { useEffect, useRef, useState } from "react";
import { mouthPath, Walker } from "@/components/journey/Walker";
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
  const rider = useRef<SVGGElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

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

  // Walk the learner to the active item and keep it in view inside the sidebar.
  useEffect(() => {
    const li = list.current?.children[active] as HTMLElement | undefined;
    const g = rider.current;
    if (!li || !g) return;
    const walker = g.querySelector<SVGGElement>(".walker")!;
    const y = li.offsetTop + li.offsetHeight / 2 + 12; // feet just below the item's middle
    g.style.transform = `translate(18px, ${y}px)`;
    const last = active === items.length - 1;
    walker.classList.remove("is-reading");
    walker.classList.add("is-walking");
    // Book down to walk over, back up once there (the last section gets a cheer instead).
    const stop = setTimeout(() => {
      walker.classList.remove("is-walking");
      walker.classList.toggle("is-reading", !last);
    }, 650);
    const progress = items.length > 1 ? active / (items.length - 1) : 1;
    g.querySelector("[data-walker-mouth]")?.setAttribute(
      "d",
      mouthPath(-0.2 + 1.2 * progress),
    );
    walker.classList.toggle("is-cheering", last);

    const box = scroller.current;
    if (box) {
      const top = li.offsetTop - box.clientHeight / 3;
      box.scrollTo({ top, behavior: "smooth" });
    }
    return () => clearTimeout(stop);
  }, [active, items.length]);

  let n = 0;
  return (
    <nav aria-label={label}>
      <p className="font-mono text-xs tracking-[0.2em] text-muted uppercase">
        {label}
      </p>
      <div
        ref={scroller}
        className="lesson-toc-scroll relative mt-4 max-h-[calc(100vh-14rem)] overflow-y-auto pr-2"
      >
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-[18px] w-0.5 rounded-full bg-[var(--border)]"
        />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
        >
          <g ref={rider} className="lesson-toc-rider">
            <Walker x={0} y={0} scale={0.38} expressive />
          </g>
        </svg>
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
