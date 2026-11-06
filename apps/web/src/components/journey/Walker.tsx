import { INTRO_REST, studentFrame } from "@/lib/journey/gait";

/**
 * The learner from the sketch: round head, smile, stick body. Feet sit at (0,0)
 * so the motion path places the feet exactly on the line.
 * - .walker-body is tilted (lean) by the animation; .leg/.arm swing via CSS.
 * - .is-struggling shows sweat (DSA valley); .is-cheering raises the arms;
 *   .is-flexing strikes a double-biceps pose; .is-reading holds an open book.
 * - `expressive` swaps the two fixed mouths for one whose curve the caller animates
 *   (via [data-walker-mouth]), so the mood can change gradually.
 * - `look="student"` draws the line-art student instead, with the same hooks plus a
 *   skeleton (see lib/journey/gait.ts) that the caller animates. It has no face.
 */
type WalkerProps = {
  x: number;
  y: number;
  scale: number;
  mood?: "sad" | "happy";
  /** Static copy (e.g. a faded "before" silhouette) — not picked up by animations. */
  decorative?: boolean;
  expressive?: boolean;
  /** Static pose classes, e.g. "is-reading" or "is-flexing", for illustrations. */
  pose?: string;
  look?: "student";
};

/** Mouth for `expressive` walkers: smile -1 (frown) … 1 (big grin). */
export function mouthPath(smile: number) {
  return `M -8 -86 Q 0 ${(-86 + smile * 9).toFixed(1)} 8 -86`;
}

const SHOE = "M-4,0 L10,0 C10,-3 6,-4 4,-7 L-4,-7 Z";

/** The line-art student. Legs, arms and book get their shapes from `studentFrame`. */
function StudentFigure() {
  const f = studentFrame({ distance: 0, slope: 0, intro: INTRO_REST });
  return (
    <g data-rig="">
      <path data-leg-a="" d={f.legA} />
      <path data-leg-b="" d={f.legB} />
      <g data-upper="" transform={f.upper}>
        <path d="M-4,-50 C-2,-64 -1,-78 -1,-90 C-8,-93 -10,-104 -7,-110 C-4,-117 6,-118 9,-111 C11,-104 7,-94 -1,-91 C1,-78 2,-64 2,-50" />
        <path d="M-3,-86 C-14,-86 -18,-80 -18,-70 L-18,-57 C-18,-51 -13,-49 -4,-51 M-2,-86 C1,-80 1,-72 -2,-64" />
        <path data-arm-free="" d={f.armFree} />
        <path data-arm-hold="" d={f.armHold} />
        <g data-book="" transform={f.book}>
          <path d="M-6,-11 L9,-7 L6,11 L-9,7 Z M-3,-1 L2,0.4" />
        </g>
        <path className="arm-cheer" d="M1,-84 C8,-92 13,-102 17,-117" />
        <g className="sweat" fill="var(--accent-2)" stroke="none">
          <path d="M 22 -104 q 4 7 0 10 q -4 -3 0 -10 Z" />
          <path d="M 27 -90 q 4 7 0 10 q -4 -3 0 -10 Z" />
        </g>
      </g>
      <g data-shoe-a="" transform={f.shoeA}>
        <path d={SHOE} fill="var(--bg)" />
      </g>
      <g data-shoe-b="" transform={f.shoeB}>
        <path d={SHOE} fill="var(--bg)" />
        {/* Laces: loose until the scene ties them, then a bow. Tied is the static default. */}
        <g stroke="var(--journey-accent)" strokeWidth="1.2">
          <path data-lace-loose="" d="M3,-6 C-1,-3 -3,-2 -6,0 M3,-6 C7,-3 10,-2 13,0" opacity="0" />
          <g data-lace-bow="">
            <path d="M3,-7 C-3,-13 -9,-10 -5,-7 C-3,-6 0,-6 3,-7 C9,-13 15,-10 11,-7 C9,-6 6,-6 3,-7 M3,-7 L0,-3 M3,-7 L6,-3" />
          </g>
        </g>
      </g>
    </g>
  );
}

export function Walker({ x, y, scale, mood, decorative = false, expressive = false, pose, look }: WalkerProps) {
  if (look === "student") {
    return (
      <g className="walker" data-look="student" data-walker={decorative ? undefined : ""} transform={`translate(${x} ${y})`}>
        <g transform={`scale(${scale})`}>
          <g
            className="walker-body"
            data-walker-body={decorative ? undefined : ""}
            fill="none"
            stroke="var(--fg)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <StudentFigure />
          </g>
        </g>
      </g>
    );
  }
  return (
    <g
      className={pose ? `walker ${pose}` : "walker"}
      data-walker={decorative ? undefined : ""}
      data-mood={mood}
      transform={`translate(${x} ${y})`}
    >
      <g transform={`scale(${scale})`}>
        <g
          className="walker-body"
          data-walker-body={decorative ? undefined : ""}
          fill="none"
          stroke="var(--fg)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line className="leg leg-a" x1="0" y1="-42" x2="-13" y2="-2" />
          <line className="leg leg-b" x1="0" y1="-42" x2="13" y2="-2" />
          <line x1="0" y1="-42" x2="0" y2="-74" />
          <line className="arm arm-a" x1="0" y1="-66" x2="-16" y2="-46" />
          <line className="arm arm-b" x1="0" y1="-66" x2="16" y2="-46" />
          <polyline className="arm-cheer" points="-20,-100 0,-68 20,-100" />
          <g className="arm-read">
            <polyline points="0,-66 -10,-56 -15,-52" />
            <polyline points="0,-66 10,-56 15,-52" />
            <path className="book" d="M -17 -58 L 0 -54 L 17 -58 L 17 -44 L 0 -40 L -17 -44 Z" fill="var(--bg)" strokeWidth="3" />
            <path d="M 0 -54 L 0 -40" strokeWidth="2.5" />
            <path className="book-page" d="M 0 -54 L 15 -57 L 15 -45 L 0 -41" fill="var(--bg)" strokeWidth="2.5" />
          </g>
          <g className="arm-flex">
            <polyline points="0,-66 -21,-64 -23,-86" />
            <polyline points="0,-66 21,-64 23,-86" />
            <path d="M -6 -66 Q -13 -76 -21 -68" strokeWidth="3.5" />
            <path d="M 6 -66 Q 13 -76 21 -68" strokeWidth="3.5" />
            <circle cx="-23" cy="-89" r="3.5" fill="var(--fg)" stroke="none" />
            <circle cx="23" cy="-89" r="3.5" fill="var(--fg)" stroke="none" />
          </g>
          <circle cx="0" cy="-93" r="17" fill="var(--bg)" />
          <circle className="eye" cx="-6" cy="-97" r="1.8" fill="var(--fg)" stroke="none" />
          <circle className="eye" cx="6" cy="-97" r="1.8" fill="var(--fg)" stroke="none" />
          {expressive ? (
            <path data-walker-mouth d={mouthPath(0)} strokeWidth="3" />
          ) : (
            <>
              <path className="mouth-happy" d="M -7 -88 Q 0 -81 7 -88" strokeWidth="3" />
              <path className="mouth-sad" d="M -7 -83 Q 0 -90 7 -83" strokeWidth="3" />
            </>
          )}
          <g className="sweat" fill="var(--accent-2)" stroke="none">
            <path d="M 22 -104 q 4 7 0 10 q -4 -3 0 -10 Z" />
            <path d="M 27 -90 q 4 7 0 10 q -4 -3 0 -10 Z" />
          </g>
        </g>
      </g>
    </g>
  );
}
