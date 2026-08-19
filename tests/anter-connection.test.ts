import { describe, expect, it } from "vitest";

import { normalizeAnterApiUrl } from "../lib/anter-connection";

describe("ANTER connection configuration", () => {
  it("accepts and normalizes an HTTPS ANTER URL", () => {
    expect(normalizeAnterApiUrl("https://anter.example.com/")).toBe("https://anter.example.com");
  });

  it("rejects insecure or malformed connection URLs", () => {
    expect(normalizeAnterApiUrl("http://anter.example.com")).toBeNull();
    expect(normalizeAnterApiUrl("not-a-url")).toBeNull();
  });
});

