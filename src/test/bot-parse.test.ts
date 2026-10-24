import { describe, expect, it } from "vitest";

import { isValidCustomCommandName, listSize, parseCommand } from "@/lib/bot-parse";

describe("parseCommand", () => {
  it("splits name and rest, lowercasing the name", () => {
    expect(parseCommand("/Say hello there")).toEqual({
      name: "say",
      rest: "hello there",
      args: ["hello", "there"],
    });
  });

  it("works without a slash and with !", () => {
    expect(parseCommand("stats")?.name).toBe("stats");
    expect(parseCommand("!stats")?.name).toBe("stats");
  });

  it("returns null for empty input", () => {
    expect(parseCommand("   ")).toBeNull();
    expect(parseCommand("/")).toBeNull();
  });
});

describe("isValidCustomCommandName", () => {
  it("rejects built-in names so they cannot be overwritten", () => {
    expect(isValidCustomCommandName("help")).toBe(false);
    expect(isValidCustomCommandName("addowner")).toBe(false);
  });

  it("accepts simple names and rejects bad characters", () => {
    expect(isValidCustomCommandName("rules")).toBe(true);
    expect(isValidCustomCommandName("a")).toBe(false);
    expect(isValidCustomCommandName("قوانين")).toBe(false);
  });
});

describe("listSize", () => {
  it("defaults to 10 and caps at 30", () => {
    expect(listSize(undefined)).toBe(10);
    expect(listSize("5")).toBe(5);
    expect(listSize("500")).toBe(30);
  });
});
