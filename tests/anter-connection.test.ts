import { describe, expect, it } from "vitest";

import {
  AnterConnectionError,
  fetchWithRetry,
  normalizeAnterApiUrl,
} from "../lib/anter-connection";
import { vi } from "vitest";

describe("ANTER connection configuration", () => {
  it("accepts and normalizes an HTTPS ANTER URL", () => {
    expect(normalizeAnterApiUrl("https://anter.example.com/")).toBe("https://anter.example.com");
  });

  it("rejects insecure or malformed connection URLs", () => {
    expect(normalizeAnterApiUrl("http://anter.example.com")).toBeNull();
    expect(normalizeAnterApiUrl("not-a-url")).toBeNull();
  });

  it("retries temporary network failures with exponential delays", async () => {
    const delays: number[] = [];
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockRejectedValueOnce(new TypeError("Network request failed"))
      .mockResolvedValueOnce("ready");

    await expect(fetchWithRetry(operation, {
      baseDelayMs: 25,
      sleep: async (delay) => { delays.push(delay); },
    })).resolves.toBe("ready");

    expect(operation).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([25, 50]);
  });

  it("does not retry authentication and permission failures", async () => {
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(
      new AnterConnectionError("انتهت الجلسة", { retryable: false }),
    );

    await expect(fetchWithRetry(operation)).rejects.toThrow("انتهت الجلسة");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
