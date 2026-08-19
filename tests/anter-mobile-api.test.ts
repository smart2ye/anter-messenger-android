import { describe, expect, it } from "vitest";

import { buildMobileApiUrl } from "../lib/mobile-api-paths";

describe("ANTER Messenger API paths", () => {
  it("keeps the mobile API namespace stable", () => {
    expect(buildMobileApiUrl("https://anter.example.com/", "/auth/login")).toBe(
      "https://anter.example.com/api/mobile/v1/auth/login",
    );
  });
});
