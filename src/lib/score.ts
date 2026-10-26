/** Score → points exchange (applied in the database by convert_score_to_points). */
export const SCORE_PER_BLOCK = 100;
export const POINTS_PER_BLOCK = 5;
/** Score for a riddle solved without revealing the answer (once per riddle per account). */
export const RIDDLE_SCORE = 10;

/** What converting all full hundreds of `score` would spend and give. */
export function convertPreview(score: number) {
  const blocks = Math.floor(Math.max(0, score) / SCORE_PER_BLOCK);
  return { spend: blocks * SCORE_PER_BLOCK, gain: blocks * POINTS_PER_BLOCK };
}
