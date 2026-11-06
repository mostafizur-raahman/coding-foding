"use client";

import { useState, type ReactNode } from "react";

/**
 * A lesson figure that stays still while you read. Its animation waits on the first frame
 * until the reader presses Play, and stops again on Pause, so nothing moves on its own.
 */
export function DiagramFrame({ caption, viewBox, children }: { caption?: string; viewBox: string; children: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className={`dg ${playing ? "dg-playing" : ""}`}>
      <div className="dg-scroll">
        <button
          type="button"
          className="dg-play"
          aria-pressed={playing}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause diagram" : "Play diagram"}
        >
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zM9 3h3v10H9z" /></svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" /></svg>
          )}
          <span>{playing ? "Pause" : "Play"}</span>
        </button>
        <svg viewBox={viewBox} role="img" aria-label={caption} className="dg-svg">
          {children}
        </svg>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
