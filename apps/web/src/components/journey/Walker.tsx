/**
 * The learner from the sketch: round head, smile, stick body. Feet sit at (0,0)
 * so the motion path places the feet exactly on the line.
 * - .walker-body is tilted (lean) by the animation; .leg/.arm swing via CSS.
 * - .is-struggling shows sweat (DSA valley); .is-cheering raises the arms.
 */
type WalkerProps = {
  x: number;
  y: number;
  scale: number;
  mood?: "sad" | "happy";
  /** Static copy (e.g. a faded "before" silhouette) — not picked up by animations. */
  decorative?: boolean;
};

export function Walker({ x, y, scale, mood, decorative = false }: WalkerProps) {
  return (
    <g
      className="walker"
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
          <circle cx="0" cy="-93" r="17" fill="var(--bg)" />
          <circle cx="-6" cy="-97" r="1.8" fill="var(--fg)" stroke="none" />
          <circle cx="6" cy="-97" r="1.8" fill="var(--fg)" stroke="none" />
          <path className="mouth-happy" d="M -7 -88 Q 0 -81 7 -88" strokeWidth="3" />
          <path className="mouth-sad" d="M -7 -83 Q 0 -90 7 -83" strokeWidth="3" />
          <g className="sweat" fill="var(--accent-2)" stroke="none">
            <path d="M 22 -104 q 4 7 0 10 q -4 -3 0 -10 Z" />
            <path d="M 27 -90 q 4 7 0 10 q -4 -3 0 -10 Z" />
          </g>
        </g>
      </g>
    </g>
  );
}
