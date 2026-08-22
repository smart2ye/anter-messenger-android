import { useState } from "react";
import { Alert, ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { startAnterBrowserLogin } from "@/lib/anter-browser-auth";

export default function LoginScreen() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function login() {
    setIsLoggingIn(true);
    try {
      const result = await startAnterBrowserLogin();
      if (result.type === "cancel" || result.type === "dismiss") {
        Alert.alert("لم يكتمل تسجيل الدخول", "يمكنك المحاولة مجدداً عندما تكون جاهزاً.");
      }
    } catch (error) {
      Alert.alert("تعذر فتح تسجيل الدخول", error instanceof Error ? error.message : "تحقق من اتصال الإنترنت ثم أعد المحاولة.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <ScreenContainer containerClassName="bg-[#071526]" className="px-5 justify-center" edges={["top", "bottom", "left", "right"]}>
      <View style={styles.brand}><Image source={require("@/assets/images/icon.png")} style={styles.brandMark} /><Text style={styles.eyebrow}>شبكة ANTER</Text><Text style={styles.title}>مرحباً بك في الرسائل</Text><Text style={styles.subtitle}>تابع إلى موقع ANTER لتسجيل الدخول، ثم ستعود تلقائياً إلى محادثاتك هنا.</Text></View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>تسجيل دخول آمن</Text>
        <Text style={styles.cardCopy}>تظهر صفحة الدخول الرسمية في نافذة محمية، ويعود التطبيق تلقائياً بعد نجاح الجلسة.</Text>
        <Pressable disabled={isLoggingIn} onPress={() => { void login(); }} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed, isLoggingIn && styles.disabled]}>
          {isLoggingIn ? <ActivityIndicator color="#26104F" /> : <Text style={styles.loginText}>المتابعة إلى تسجيل دخول ANTER</Text>}
        </Pressable>
      </View>
      <Text style={styles.notice}>ستبقى محادثاتك مرتبطة بحسابك نفسه على موقع ANTER والهاتف.</Text>
      <View style={styles.legalLinks}>
        <Pressable accessibilityRole="link" onPress={() => router.push("/about" as never)} style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}><Text style={styles.legalLinkText}>ما هو ANTER Messenger؟</Text></Pressable>
        <View style={styles.legalDivider} />
        <Pressable accessibilityRole="link" onPress={() => router.push("/terms" as never)} style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}><Text style={styles.legalLinkText}>الشروط والأحكام</Text></Pressable>
        <View style={styles.legalDivider} />
        <Pressable accessibilityRole="link" onPress={() => router.push("/privacy" as never)} style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}><Text style={styles.legalLinkText}>سياسة الخصوصية</Text></Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", marginBottom: 28 },
  brandMark: { width: 82, height: 82, borderRadius: 26, shadowColor: "#9B71FF", shadowOpacity: 0.4, shadowRadius: 18, elevation: 8 },
  eyebrow: { color: "#70B7FF", fontSize: 12, fontWeight: "800", marginTop: 14 },
  title: { color: "#F3F8FF", fontSize: 28, lineHeight: 38, fontWeight: "900", marginTop: 6, textAlign: "center" },
  subtitle: { color: "#AABBD2", fontSize: 14, lineHeight: 22, marginTop: 8, maxWidth: 330, textAlign: "center" },
  card: { padding: 18, borderRadius: 22, borderWidth: 1, borderColor: "#254866", backgroundColor: "#0D2138" },
  cardTitle: { color: "#EAF4FF", fontSize: 17, fontWeight: "900", textAlign: "right" },
  cardCopy: { color: "#AABBD2", fontSize: 13, lineHeight: 21, marginTop: 8, textAlign: "right" },
  loginButton: { marginTop: 14, minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#65B4FF" },
  loginText: { color: "#061323", fontSize: 14, fontWeight: "900" },
  notice: { color: "#89A3C0", fontSize: 11, lineHeight: 18, marginTop: 18, textAlign: "center" },
  legalLinks: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 12 },
  legalLink: { paddingVertical: 4 },
  legalLinkText: { color: "#77BEFF", fontSize: 10, fontWeight: "800", textAlign: "center" },
  legalDivider: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#456684" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
