import { describe, expect, it } from "vitest";

import { aboutAnterMessenger, privacyPolicy, termsAndConditions } from "../lib/legal-content";

describe("صفحات معلومات ANTER Messenger", () => {
  it("تقدم تعريفاً واضحاً للتطبيق", () => {
    expect(aboutAnterMessenger.title).toBe("ما هو ANTER Messenger؟");
    expect(aboutAnterMessenger.sections.length).toBeGreaterThan(1);
  });

  it("تتضمن الشروط سياسة الاستخدام والحساب", () => {
    expect(termsAndConditions.sections.map((section) => section.title)).toContain("الحساب والدخول");
    expect(termsAndConditions.sections.map((section) => section.title)).toContain("الاستخدام المقبول");
  });

  it("تغطي سياسة الخصوصية الجلسة والرسائل والأذونات", () => {
    const content = privacyPolicy.sections.flatMap((section) => section.paragraphs).join(" ");
    expect(content).toContain("رمز جلسة الجهاز");
    expect(content).toContain("الرسائل");
    expect(content).toContain("الإشعارات");
  });
});
