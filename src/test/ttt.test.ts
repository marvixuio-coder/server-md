import { describe, expect, it } from "vitest";

import { AI_SMART_RATE, aiMove, fromBoardString, WIN_POINTS, WIN_SCORE } from "@/lib/ttt";

describe("X O AI", () => {
  it("plays its best move 80% of the time", () => {
    expect(AI_SMART_RATE).toBe(0.8);
  });

  it("takes a winning cell when playing smart", () => {
    // O O _ / X X _ / X _ _  -> O wins at 2
    const board = fromBoardString("OO_XX_X__");
    expect(aiMove(board, () => 0.79)).toBe(2);
  });

  it("blocks the player when playing smart", () => {
    // X X _ / O _ _ / _ _ _  -> must block at 2
    const board = fromBoardString("XX_O_____");
    expect(aiMove(board, () => 0.1)).toBe(2);
  });

  it("plays a random free cell the other 20%", () => {
    const board = fromBoardString("XX_O_____");
    const rolls = [0.85, 0];
    const cell = aiMove(board, () => rolls.shift() ?? 0);
    expect(cell).toBe(2); // first free cell picked by the random roll of 0
  });
});

describe("win reward", () => {
  it("gives 50 score and 5 points per win", () => {
    expect(WIN_SCORE).toBe(50);
    expect(WIN_POINTS).toBe(5);
  });
});
