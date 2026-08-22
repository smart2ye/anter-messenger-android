import { describe, expect, it } from "vitest";

import { describeLoginConnectionFailure } from "../lib/anter-connection";
import { buildMobileApiUrl } from "../lib/mobile-api-paths";

describe("ANTER Messenger API paths", () => {
  it("keeps the mobile API namespace stable", () => {
    expect(buildMobileApiUrl("https://anter.example.com/", "/auth/login")).toBe(
      "https://anter.example.com/api/mobile/v1/auth/login",
    );
  });

  it("explains native network failures without mistaking them for invalid credentials", () => {
    const error = describeLoginConnectionFailure(
      new TypeError("Network request failed"),
      "https://anter-1.onrender.com",
    );

    expect(error.message).toContain("تعذر اتصال التطبيق بخادم ANTER");
    expect(error.message).toContain("anter-1.onrender.com");
  });
});
