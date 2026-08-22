import { useState } from "react";
import { Alert, ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { DEFAULT_ANTER_API_URL } from "@/lib/anter-connection";
import { loginToAnter } from "@/lib/anter-mobile-api";

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function login() {
    if (!identifier.trim() || !password) {
      Alert.alert("بيانات ناقصة", "أدخل اسم المستخدم أو البريد أو رقم الجوال وكلمة المرور.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const user = await loginToAnter(identifier.trim(), password);
      setPassword("");
      router.replace("/(tabs)" as never);
      Alert.alert("تم تسجيل الدخول", `أهلاً ${user.name}، أصبحت محادثاتك متزامنة مع ANTER.`);
    } catch (error) {
      Alert.alert("تعذر تسجيل الدخول", error instanceof Error ? error.message : "تحقق من بيانات حساب ANTER واتصالك بالإنترنت.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <ScreenContainer containerClassName="bg-[#071526]" className="px-5 justify-center" edges={["top", "bottom", "left", "right"]}>
      <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandLetter}>أ</Text></View><Text style={styles.eyebrow}>شبكة ANTER</Text><Text style={styles.title}>مرحباً بك في الرسائل</Text><Text style={styles.subtitle}>سجّل الدخول بحسابك الحالي في ANTER لتظهر محادثاتك نفسها على الموقع والهاتف.</Text></View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>تسجيل الدخول</Text>
        <TextInput value={identifier} onChangeText={setIdentifier} autoCapitalize="none" autoCorrect={false} placeholder="اسم المستخدم أو البريد أو رقم الجوال" placeholderTextColor="#7890AD" style={styles.input} textAlign="right" returnKeyType="next" />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="كلمة المرور" placeholderTextColor="#7890AD" style={styles.input} textAlign="right" returnKeyType="done" onSubmitEditing={() => { void login(); }} />
        <Pressable disabled={isLoggingIn} onPress={() => { void login(); }} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed, isLoggingIn && styles.disabled]}>
          {isLoggingIn ? <ActivityIndicator color="#061323" /> : <Text style={styles.loginText}>دخول إلى ANTER Messenger</Text>}
        </Pressable>
        <Text style={styles.serverText}>الخادم المعتمد: {DEFAULT_ANTER_API_URL}</Text>
      </View>
      <Text style={styles.notice}>تُستخدم كلمة المرور لتسجيل الدخول فقط، ولا تُحفظ داخل التطبيق. تُحفظ جلسة الجهاز في التخزين الآمن.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", marginBottom: 28 },
  brandMark: { width: 76, height: 76, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "#2B86E8", shadowColor: "#59ABFF", shadowOpacity: 0.35, shadowRadius: 18, elevation: 8 },
  brandLetter: { color: "#FFFFFF", fontSize: 42, fontWeight: "900" },
  eyebrow: { color: "#70B7FF", fontSize: 12, fontWeight: "800", marginTop: 14 },
  title: { color: "#F3F8FF", fontSize: 28, lineHeight: 38, fontWeight: "900", marginTop: 6, textAlign: "center" },
  subtitle: { color: "#AABBD2", fontSize: 14, lineHeight: 22, marginTop: 8, maxWidth: 330, textAlign: "center" },
  card: { padding: 18, borderRadius: 22, borderWidth: 1, borderColor: "#254866", backgroundColor: "#0D2138" },
  cardTitle: { color: "#EAF4FF", fontSize: 17, fontWeight: "900", textAlign: "right" },
  input: { marginTop: 12, minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#2D587E", backgroundColor: "#071526", color: "#F3F8FF", paddingHorizontal: 14, fontSize: 14 },
  loginButton: { marginTop: 14, minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#65B4FF" },
  loginText: { color: "#061323", fontSize: 14, fontWeight: "900" },
  serverText: { color: "#8EA5C5", fontSize: 10, marginTop: 13, textAlign: "center" },
  notice: { color: "#89A3C0", fontSize: 11, lineHeight: 18, marginTop: 18, textAlign: "center" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
