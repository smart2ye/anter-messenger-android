import { describe, expect, it } from "vitest";

import { canDeleteForEveryone, getVisibleMessageActions } from "../lib/message-actions";

describe("إجراءات بطاقة الرسالة", () => {
  it("يبقي الرد متاحاً في المعاينة المحلية", () => {
    expect(getVisibleMessageActions({ isLive: false, hasServerMessage: false })).toEqual(["reply"]);
  });

  it("يعرض الرد والتوجيه والحذف للرسالة المرتبطة بالخادم", () => {
    expect(getVisibleMessageActions({ isLive: true, hasServerMessage: true })).toEqual(["reply", "forward", "delete"]);
  });

  it("يقصر الحذف عند الجميع على صاحب الرسالة", () => {
    expect(canDeleteForEveryone("me")).toBe(true);
    expect(canDeleteForEveryone("other")).toBe(false);
    expect(canDeleteForEveryone("system")).toBe(false);
  });
});
