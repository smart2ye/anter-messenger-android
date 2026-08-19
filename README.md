# ANTER Messenger Android

تطبيق Android مستقل للمراسلة داخل شبكة ANTER. يعرض محادثات ANTER وجهات الاتصال ذات المتابعة المتبادلة، ويدعم حالات الإرسال والقراءة ومؤشر الكتابة وتجربة اتصال وإشعار واردة أولية.

## التشغيل المحلي

```bash
pnpm install
pnpm test
pnpm check
pnpm android
```

## الربط بخادم ANTER

من شاشة الإعدادات، أدخل رابط HTTPS الرسمي لخادم ANTER، ثم سجّل الدخول. يُحفظ رمز الجهاز في SecureStore على Android ولا تُحفظ كلمة المرور داخل التطبيق.

## البناء عبر GitHub Actions

يعمل سير **Android CI** تلقائياً عند الدفع إلى `main` أو عند فتح Pull Request. ينفذ الاختبارات وفحص TypeScript، ثم ينشئ APK ويُرفقه في قسم **Artifacts** الخاص بتشغيل GitHub Actions لمدة 14 يوماً.

> يستخدم البناء `expo prebuild` داخل بيئة GitHub Actions، لذلك لا تُضاف مجلدات Android المولّدة إلى المستودع.
