import { Walker } from "@/components/journey/Walker";

/**
 * Sketchbook characters around the sign-in page: the same learner who walks the course,
 * caught reading on one side and flexing on the other, plus a friend peeking over the
 * main button. Decorative only, stroke-drawn so every theme recolours them.
 */

export function ReadingLearner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 260" aria-hidden="true" className={className} fill="none">
      {/* a thought: "?" with a little sparkle */}
      <g className="auth-doodle" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M128 38 C 128 22, 158 22, 158 40 C 158 54, 142 54, 142 68" />
        <circle cx="142" cy="82" r="2.5" className="auth-doodle-fill" />
        <path d="M176 70 l 0 12 M 170 76 l 12 0" />
      </g>
      {/* a stack of books to stand beside */}
      <g className="auth-ink" strokeWidth={3.5} strokeLinejoin="round">
        <path d="M24 214 h 70 v 16 h -70 Z" />
        <path d="M30 198 h 58 v 16 h -58 Z" />
        <path d="M20 230 h 180" strokeLinecap="round" />
      </g>
      <Walker x={142} y={230} scale={1.25} pose="is-reading" mood="happy" decorative />
    </svg>
  );
}

export function FlexingLearner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 260" aria-hidden="true" className={className} fill="none">
      <g className="auth-doodle" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        {/* lightning: "I got this" */}
        <path d="M58 30 L 40 66 L 56 66 L 46 100 L 76 56 L 60 56 Z" />
        <path d="M168 44 l 6 14 l 15 2 l -11 10 l 3 15 l -13 -8 l -13 8 l 3 -15 l -11 -10 l 15 -2 Z" />
      </g>
      <path d="M30 230 h 170" className="auth-ink" strokeWidth={3.5} strokeLinecap="round" />
      <Walker x={112} y={230} scale={1.25} pose="is-flexing" mood="happy" decorative />
    </svg>
  );
}

/** Head and hands over an edge, as if hiding behind what it sits on. */
export function PeekingLearner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 46" aria-hidden="true" className={className} fill="none">
      <g className="auth-ink" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 44 C 22 14, 68 14, 68 44" className="auth-peek-head" />
        <g className="auth-peek-eyes">
          <circle cx="37" cy="31" r="2.2" className="auth-ink-fill" />
          <circle cx="53" cy="31" r="2.2" className="auth-ink-fill" />
        </g>
        <path d="M40 39 Q 45 42 50 39" />
        {/* fingers gripping the edge */}
        <path d="M8 44 v -5 M 13 44 v -6 M 18 44 v -5" />
        <path d="M72 44 v -5 M 77 44 v -6 M 82 44 v -5" />
      </g>
    </svg>
  );
}
