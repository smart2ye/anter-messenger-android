import { LIVE_SYNC_INTERVAL_MS } from "../lib/live-sync";
import { describe, expect, it } from "vitest";

describe("ANTER Messenger live synchronization", () => {
  it("refreshes live conversations quickly enough to stay aligned with the website", () => {
    expect(LIVE_SYNC_INTERVAL_MS).toBe(2500);
  });
});
