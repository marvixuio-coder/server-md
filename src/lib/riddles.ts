import type { Riddle } from "@/components/riddles-data";

export const normAnswer = (s: string) =>
  s.trim().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة$/g, "ه").replace(/\s+/g, " ");

export function isRightAnswer(r: Riddle, guess: string) {
  const g = normAnswer(guess);
  return !!g && r.a.some((x) => normAnswer(x) === g);
}
