import { describe, expect, it } from "vitest";

import { assistantConversation, canStartConversation } from "../lib/messenger-state";

describe("ANTER Messenger conversation rules", () => {
  it("keeps the ANTER assistant as the initial eligible conversation", () => {
    expect(assistantConversation.id).toBe("anter-assistant");
    expect(assistantConversation.state).toBe("online");
  });

  it("allows starting a conversation only after mutual follow eligibility", () => {
    expect(canStartConversation(true)).toBe(true);
    expect(canStartConversation(false)).toBe(false);
  });
});

