import { describe, expect, it } from "vitest";

import { isValidUsername, normalizeUsername, usernameToEmail } from "@/lib/username";

describe("username rules", () => {
  it("treats usernames as case-insensitive", () => {
    expect(normalizeUsername("  Marvix_1 ")).toBe("marvix_1");
    expect(usernameToEmail("Marvix")).toBe(usernameToEmail("marvix"));
  });

  it("accepts 3-20 English letters, numbers or underscore", () => {
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("a".repeat(20))).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("a".repeat(21))).toBe(false);
    expect(isValidUsername("مرفكس")).toBe(false);
    expect(isValidUsername("has space")).toBe(false);
  });
});
