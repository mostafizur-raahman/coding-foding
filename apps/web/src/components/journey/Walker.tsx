/**
 * The learner from the sketch: round head, smile, stick body. Feet sit at (0,0)
 * so the motion path places the feet exactly on the line.
 * - .walker-body is tilted (lean) by the animation; .leg/.arm swing via CSS.
 * - .is-struggling shows sweat (DSA valley); .is-cheering raises the arms;
 *   .is-flexing strikes a double-biceps pose; .is-reading holds an open book.
 * - `expressive` swaps the two fixed mouths for one whose curve the caller animates
 *   (via [data-walker-mouth]), so the mood can change gradually.
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
};

/** Mouth for `expressive` walkers: smile -1 (frown) … 1 (big grin). */
export function mouthPath(smile: number) {
  return `M -8 -86 Q 0 ${(-86 + smile * 9).toFixed(1)} 8 -86`;
}

export function Walker({ x, y, scale, mood, decorative = false, expressive = false, pose }: WalkerProps) {
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
