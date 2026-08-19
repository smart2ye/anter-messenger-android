import { describe, expect, it } from "vitest";

import { incomingCallNotificationContent } from "../lib/notification-content";

describe("ANTER incoming call notifications", () => {
  it("creates a privacy-focused notification that opens the relevant chat", () => {
    const content = incomingCallNotificationContent("مساعد أنتر");
    expect(content.title).toBe("مكالمة واردة عبر ANTER");
    expect(content.body).toContain("مساعد أنتر");
    expect(content.data.url).toBe("/chat/anter-assistant");
  });
});
