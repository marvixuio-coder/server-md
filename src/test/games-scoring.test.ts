import { describe, expect, it } from "vitest";

import { convertPreview, RIDDLE_SCORE } from "@/lib/score";
import { APPLE_SCORE, GRID, initialSnake, maxApples, step } from "@/lib/snake";
import { isRightAnswer } from "@/lib/riddles";

describe("score to points", () => {
  it("every 100 score gives 5 points", () => {
    expect(convertPreview(100)).toEqual({ spend: 100, gain: 5 });
  });
  it("only full hundreds convert", () => {
    expect(convertPreview(250)).toEqual({ spend: 200, gain: 10 });
    expect(convertPreview(99)).toEqual({ spend: 0, gain: 0 });
  });
});

describe("rewards", () => {
  it("one apple = 1 score, one riddle = 10 score", () => {
    expect(APPLE_SCORE).toBe(1);
    expect(RIDDLE_SCORE).toBe(10);
  });
});

describe("snake", () => {
  it("grows by one when it eats an apple", () => {
    const s = initialSnake();
    const head = s[0]!;
    const r = step(s, "right", { x: head.x + 1, y: head.y });
    expect(r.ate).toBe(true);
    expect(r.snake.length).toBe(s.length + 1);
  });
  it("keeps its length when it just moves", () => {
    const s = initialSnake();
    expect(step(s, "up", null).snake.length).toBe(s.length);
  });
  it("dies when it hits the wall", () => {
    const s = [{ x: GRID - 1, y: 0 }];
    expect(step(s, "right", null).dead).toBe(true);
  });
  it("server never credits more apples than the game time allows", () => {
    expect(maxApples(3000)).toBe(10);
    expect(maxApples(0)).toBe(0);
  });
});

describe("riddle answers", () => {
  it("accepts any listed answer, ignoring alef forms", () => {
    expect(isRightAnswer({ q: "?", a: ["إبرة"] }, " ابره ")).toBe(true);
    expect(isRightAnswer({ q: "?", a: ["قلم"] }, "مشط")).toBe(false);
  });
});
