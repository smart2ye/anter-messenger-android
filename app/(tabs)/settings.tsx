import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DEFAULT_ANTER_API_URL, loadAnterApiUrl, saveAnterApiUrl } from "@/lib/anter-connection";
import { scheduleIncomingCallPreview } from "@/lib/notifications";
import { getSavedMobileProfile, loginToAnter, logoutFromAnter, type AnterMobileUser } from "@/lib/anter-mobile-api";

export default function SettingsScreen() {
  const router = useRouter();
  const [apiUrl, setApiUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<AnterMobileUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    loadAnterApiUrl().then(setApiUrl).catch(() => undefined);
    getSavedMobileProfile().then(setProfile).catch(() => undefined);
  }, []);

  async function saveConnectionDraft() {
    try {
      const normalized = await saveAnterApiUrl(apiUrl);
      setApiUrl(normalized);
      setSaved(true);
      Alert.alert("تم الحفظ", "سيستخدم Messenger هذا الرابط لتزامن المحادثات الحية مع موقع ANTER.");
    } catch {
      Alert.alert("رابط غير صالح", "استخدم رابط HTTPS لخادم ANTER قبل حفظ الإعداد.");
    }
  }

  async function testIncomingCallNotification() {
    const scheduled = await scheduleIncomingCallPreview("مساعد أنتر");
    Alert.alert(
      scheduled ? "تم إرسال تنبيه تجريبي" : "إذن الإشعارات غير متاح",
      scheduled
        ? "افتح لوحة إشعارات Android للتحقق من تنبيه المكالمة الواردة."
        : "فعّل إذن الإشعارات من إعدادات Android ثم حاول مرة أخرى.",
    );
  }

  async function login() {
    if (!identifier.trim() || !password) {
      Alert.alert("بيانات ناقصة", "أدخل اسم المستخدم أو البريد أو الجوال وكلمة المرور.");
      return;
    }
    setIsLoggingIn(true);
    try {
      const user = await loginToAnter(identifier.trim(), password);
      setProfile(user);
      setPassword("");
      Alert.alert("تم ربط الحساب", `أهلاً ${user.name}، أصبح التطبيق جاهزاً للمراسلة الحية.`);
    } catch (error) {
      Alert.alert("تعذر تسجيل الدخول", error instanceof Error ? error.message : "تحقق من رابط الخادم وبيانات الحساب.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function logout() {
    await logoutFromAnter();
    setProfile(null);
    router.replace("/login" as never);
    Alert.alert("تم تسجيل الخروج", "حُذف رمز الجهاز من الهاتف.");
  }

  return (
    <ScreenContainer containerClassName="bg-[#071526]" className="px-4" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={styles.title}>الإعدادات</Text><Text style={styles.subtitle}>إدارة الربط والأذونات وخصوصية المراسلة.</Text></View>

      <View style={styles.accountCard}>
        <View style={styles.accountIcon}><IconSymbol name="person.crop.circle.fill" size={34} color="#69B7FF" /></View>
        <View style={styles.accountCopy}><Text style={styles.accountTitle}>{profile ? `تم ربط ${profile.name}` : "حساب ANTER غير مربوط"}</Text><Text style={styles.accountText}>{profile ? `@${profile.username} · رمز الجهاز محفوظ في التخزين الآمن.` : "تُرسل كلمة المرور إلى رابط HTTPS الرسمي للتحقق فقط ولا تُحفظ داخل التطبيق."}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>رابط خادم ANTER</Text>
        <Text style={styles.sectionHint}>الخادم الرسمي المعتمد هو Render، ويمكن تغيير الرابط فقط عند استخدام بيئة ANTER موثوقة أخرى.</Text>
        <TextInput
          value={apiUrl}
          onChangeText={(value) => { setApiUrl(value); setSaved(false); }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder={DEFAULT_ANTER_API_URL}
          placeholderTextColor="#6F86A1"
          style={styles.input}
          textAlign="left"
        />
        <Pressable onPress={saveConnectionDraft} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <Text style={styles.saveButtonText}>{saved ? "تم حفظ المسودة" : "حفظ إعداد الاتصال"}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ربط حساب ANTER</Text>
        {profile ? (
          <Pressable onPress={logout} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}><Text style={styles.logoutText}>تسجيل الخروج من هذا الهاتف</Text></Pressable>
        ) : (
          <>
            <TextInput value={identifier} onChangeText={setIdentifier} autoCapitalize="none" placeholder="اسم المستخدم أو البريد أو رقم الجوال" placeholderTextColor="#6F86A1" style={styles.input} textAlign="right" />
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="كلمة المرور" placeholderTextColor="#6F86A1" style={styles.input} textAlign="right" />
            <Pressable disabled={isLoggingIn} onPress={login} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed, isLoggingIn && styles.disabled]}><Text style={styles.loginText}>{isLoggingIn ? "جارٍ الربط…" : "ربط حساب ANTER"}</Text></Pressable>
          </>
        )}
      </View>

      <View style={styles.infoRow}><IconSymbol name="bell.fill" size={20} color="#9ED0FF" /><Text style={styles.infoText}>تُطلب أذونات الإشعارات والميكروفون فقط عند تفعيل ميزاتها وربط الحساب.</Text></View>
      <Pressable onPress={testIncomingCallNotification} style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}>
        <IconSymbol name="bell.fill" size={18} color="#CFE9FF" /><Text style={styles.notificationButtonText}>اختبار تنبيه مكالمة واردة</Text>
      </Pressable>
        <View style={styles.infoRow}><IconSymbol name="lock.fill" size={20} color="#9ED0FF" /><Text style={styles.infoText}>لا يحتفظ سجل المكالمات بمحتوى الصوت؛ بل بالحالة والوقت والمدة فقط.</Text></View>

        <View style={styles.legalSection}>
          <Text style={styles.sectionTitle}>عن ANTER Messenger والسياسات</Text>
          <Text style={styles.sectionHint}>راجع طريقة عمل التطبيق وشروط استخدامه وسياسة الخصوصية في أي وقت.</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push("/about" as never)} style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}><Text style={styles.legalLinkText}>ما هو ANTER Messenger؟</Text><IconSymbol name="chevron.right" size={18} color="#9ED0FF" /></Pressable>
          <Pressable accessibilityRole="link" onPress={() => router.push("/terms" as never)} style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}><Text style={styles.legalLinkText}>الشروط والأحكام</Text><IconSymbol name="chevron.right" size={18} color="#9ED0FF" /></Pressable>
          <Pressable accessibilityRole="link" onPress={() => router.push("/privacy" as never)} style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}><Text style={styles.legalLinkText}>سياسة الخصوصية</Text><IconSymbol name="chevron.right" size={18} color="#9ED0FF" /></Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  header: { paddingTop: 12, paddingBottom: 20 },
  title: { color: "#F3F8FF", fontSize: 29, fontWeight: "800", textAlign: "right" },
  subtitle: { color: "#AABBD2", fontSize: 13, lineHeight: 20, marginTop: 5, textAlign: "right" },
  accountCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#2B5279", backgroundColor: "#10233B" },
  accountIcon: { width: 46, alignItems: "center", justifyContent: "center" },
  accountCopy: { flex: 1 },
  accountTitle: { color: "#EAF4FF", fontSize: 15, fontWeight: "800", textAlign: "right" },
  accountText: { color: "#AABBD2", fontSize: 12, lineHeight: 19, marginTop: 4, textAlign: "right" },
  section: { marginTop: 18, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: "#1D3854", backgroundColor: "#0D2138" },
  sectionTitle: { color: "#EAF4FF", fontSize: 15, fontWeight: "800", textAlign: "right" },
  sectionHint: { color: "#91A9C5", fontSize: 12, lineHeight: 19, marginTop: 4, textAlign: "right" },
  input: { marginTop: 12, minHeight: 47, borderRadius: 13, borderWidth: 1, borderColor: "#2B5279", backgroundColor: "#071526", color: "#EAF4FF", paddingHorizontal: 12, fontSize: 13 },
  saveButton: { marginTop: 11, minHeight: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#65B4FF" },
  saveButtonText: { color: "#061323", fontWeight: "900", fontSize: 13 },
  loginButton: { marginTop: 11, minHeight: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#38C98A" },
  loginText: { color: "#071526", fontWeight: "900", fontSize: 13 },
  logoutButton: { marginTop: 11, minHeight: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#8C4550", backgroundColor: "#311B28" },
  logoutText: { color: "#FFC9D0", fontWeight: "800", fontSize: 13 },
  notificationButton: { marginTop: 11, minHeight: 48, flexDirection: "row", gap: 8, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#315A81", backgroundColor: "#102A45" },
  notificationButtonText: { color: "#CFE9FF", fontWeight: "800", fontSize: 13 },
  infoRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: "#0A1A2D" },
  infoText: { flex: 1, color: "#AABBD2", fontSize: 12, lineHeight: 19, textAlign: "right" },
  legalSection: { marginTop: 18, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: "#1D3854", backgroundColor: "#0D2138" },
  legalLink: { minHeight: 47, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: "#254866", backgroundColor: "#0A1A2D" },
  legalLinkText: { color: "#CFE9FF", fontSize: 12, fontWeight: "800", textAlign: "right" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
