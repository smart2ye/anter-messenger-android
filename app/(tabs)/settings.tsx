import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getSavedMobileProfile, logoutFromAnter, type AnterMobileUser } from "@/lib/anter-mobile-api";
import { currentMessengerVersion, fetchOfficialMessengerRelease } from "@/lib/messenger-release";
import { isNewerRelease } from "@/lib/messenger-release-utils";

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<AnterMobileUser | null>(null);

  useEffect(() => {
    getSavedMobileProfile().then(setProfile).catch(() => undefined);
  }, []);

  async function checkForUpdate() {
    try {
      const release = await fetchOfficialMessengerRelease();
      if (!isNewerRelease(release.version, currentMessengerVersion())) {
        Alert.alert("ANTER Messenger محدّث", `أنت تستخدم الإصدار ${currentMessengerVersion()}.`);
        return;
      }
      Alert.alert("يتوفر تحديث جديد", `الإصدار ${release.version} جاهز للتنزيل.`, [
        { text: "لاحقاً", style: "cancel" },
        { text: "تنزيل التحديث", onPress: () => { void WebBrowser.openBrowserAsync(release.downloadUrl); } },
      ]);
    } catch (error) {
      Alert.alert("تعذر التحقق من التحديث", error instanceof Error ? error.message : "حاول مجدداً لاحقاً.");
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
        <View style={styles.header}><Text style={styles.title}>الإعدادات</Text><Text style={styles.subtitle}>إدارة حسابك وتفضيلات ANTER Messenger.</Text></View>

      <View style={styles.accountCard}>
        <View style={styles.accountIcon}><IconSymbol name="person.crop.circle.fill" size={34} color="#69B7FF" /></View>
        <View style={styles.accountCopy}><Text style={styles.accountTitle}>{profile ? profile.name : "سجّل الدخول إلى حسابك"}</Text><Text style={styles.accountText}>{profile ? `@${profile.username}` : "تابع إلى موقع ANTER للدخول إلى محادثاتك."}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>حساب ANTER</Text>
        {profile ? (
          <Pressable onPress={logout} style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}><Text style={styles.logoutText}>تسجيل الخروج من هذا الهاتف</Text></Pressable>
        ) : (
          <Pressable onPress={() => router.replace("/login" as never)} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}><Text style={styles.loginText}>تسجيل الدخول من موقع ANTER</Text></Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إصدار التطبيق</Text>
        <Text style={styles.sectionHint}>ANTER Messenger {currentMessengerVersion()}</Text>
        <Pressable onPress={() => { void checkForUpdate(); }} style={({ pressed }) => [styles.updateButton, pressed && styles.pressed]}><Text style={styles.updateButtonText}>التحقق من التحديثات</Text></Pressable>
      </View>

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
  loginButton: { marginTop: 11, minHeight: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#38C98A" },
  loginText: { color: "#071526", fontWeight: "900", fontSize: 13 },
  logoutButton: { marginTop: 11, minHeight: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#8C4550", backgroundColor: "#311B28" },
  logoutText: { color: "#FFC9D0", fontWeight: "800", fontSize: 13 },
  updateButton: { marginTop: 11, minHeight: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#315A81", backgroundColor: "#102A45" },
  updateButtonText: { color: "#CFE9FF", fontWeight: "800", fontSize: 13 },
  legalSection: { marginTop: 18, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: "#1D3854", backgroundColor: "#0D2138" },
  legalLink: { minHeight: 47, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: "#254866", backgroundColor: "#0A1A2D" },
  legalLinkText: { color: "#CFE9FF", fontSize: 12, fontWeight: "800", textAlign: "right" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
