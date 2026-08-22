import { describe, expect, it } from "vitest";

import { buildBrowserAuthorizationUrl } from "../lib/browser-auth-url";

describe("ANTER browser login URL", () => {
  it("keeps the callback and state when opening ANTER browser authorization", () => {
    const url = new URL(buildBrowserAuthorizationUrl(
      "https://anter-1.onrender.com/",
      "anter-messenger://auth/callback",
      "secure-state",
    ));

    expect(url.pathname).toBe("/auth/messenger/authorize");
    expect(url.searchParams.get("redirect_uri")).toBe("anter-messenger://auth/callback");
    expect(url.searchParams.get("state")).toBe("secure-state");
  });
});
