/**
 * Line colour per part. One calm accent for every part: the course reads as one thing, and
 * colour is kept for meaning (links, actions, status) rather than decoration.
 * (Takes the part index so callers needn't change if parts ever get their own colours.)
 */
export const partLine: (index: number) => string = () => "var(--accent-1)";
