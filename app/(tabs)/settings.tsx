import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { loadAnterApiUrl, saveAnterApiUrl } from "@/lib/anter-connection";
import { scheduleIncomingCallPreview } from "@/lib/notifications";

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadAnterApiUrl().then(setApiUrl).catch(() => undefined);
  }, []);

  async function saveConnectionDraft() {
    try {
      const normalized = await saveAnterApiUrl(apiUrl);
      setApiUrl(normalized);
      setSaved(true);
      Alert.alert("تم الحفظ محلياً", "تم تجهيز رابط الخادم. سيُستخدم عند إضافة واجهة الربط الآمنة في ANTER.");
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

  return (
    <ScreenContainer containerClassName="bg-[#071526]" className="px-4" edges={["top", "left", "right"]}>
      <View style={styles.header}><Text style={styles.title}>الإعدادات</Text><Text style={styles.subtitle}>إدارة الربط والأذونات وخصوصية المراسلة.</Text></View>

      <View style={styles.accountCard}>
        <View style={styles.accountIcon}><IconSymbol name="person.crop.circle.fill" size={34} color="#69B7FF" /></View>
        <View style={styles.accountCopy}><Text style={styles.accountTitle}>حساب ANTER غير مربوط</Text><Text style={styles.accountText}>لن يطلب التطبيق كلمة مرورك محلياً. سيكون الربط عبر واجهة مصادقة آمنة من خادم ANTER.</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>رابط خادم ANTER</Text>
        <Text style={styles.sectionHint}>أدخل رابط HTTPS الرسمي فقط عند تجهيز API المخصص للتطبيق.</Text>
        <TextInput
          value={apiUrl}
          onChangeText={(value) => { setApiUrl(value); setSaved(false); }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://your-anter-domain"
          placeholderTextColor="#6F86A1"
          style={styles.input}
          textAlign="left"
        />
        <Pressable onPress={saveConnectionDraft} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <Text style={styles.saveButtonText}>{saved ? "تم حفظ المسودة" : "حفظ إعداد الاتصال"}</Text>
        </Pressable>
      </View>

      <View style={styles.infoRow}><IconSymbol name="bell.fill" size={20} color="#9ED0FF" /><Text style={styles.infoText}>تُطلب أذونات الإشعارات والميكروفون فقط عند تفعيل ميزاتها وربط الحساب.</Text></View>
      <Pressable onPress={testIncomingCallNotification} style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}>
        <IconSymbol name="bell.fill" size={18} color="#CFE9FF" /><Text style={styles.notificationButtonText}>اختبار تنبيه مكالمة واردة</Text>
      </Pressable>
      <View style={styles.infoRow}><IconSymbol name="lock.fill" size={20} color="#9ED0FF" /><Text style={styles.infoText}>لا يحتفظ سجل المكالمات بمحتوى الصوت؛ بل بالحالة والوقت والمدة فقط.</Text></View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  notificationButton: { marginTop: 11, minHeight: 48, flexDirection: "row", gap: 8, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#315A81", backgroundColor: "#102A45" },
  notificationButtonText: { color: "#CFE9FF", fontWeight: "800", fontSize: 13 },
  infoRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: "#0A1A2D" },
  infoText: { flex: 1, color: "#AABBD2", fontSize: 12, lineHeight: 19, textAlign: "right" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
