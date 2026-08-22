import { describe, expect, it } from "vitest";

import { isNewerRelease } from "../lib/messenger-release-utils";

describe("official Messenger releases", () => {
  it("recognizes a newer semantic version", () => {
    expect(isNewerRelease("1.2.0", "1.1.0")).toBe(true);
    expect(isNewerRelease("1.1.0", "1.1.0")).toBe(false);
    expect(isNewerRelease("1.0.9", "1.1.0")).toBe(false);
  });
});
