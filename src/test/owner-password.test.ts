import { describe, expect, it } from "vitest";

import { passwordMatches } from "@/lib/owner-password";

describe("owner password check", () => {
  it("accepts only the exact password", async () => {
    expect(await passwordMatches("open_sesame1", "open_sesame1")).toBe(true);
    expect(await passwordMatches("Open_sesame1", "open_sesame1")).toBe(false);
    expect(await passwordMatches("open_sesame", "open_sesame1")).toBe(false);
    expect(await passwordMatches("", "open_sesame1")).toBe(false);
  });
});
