import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { completeAnterBrowserLogin } from "@/lib/anter-browser-auth";

export default function AnterBrowserAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const started = useRef(false);
  const [message, setMessage] = useState("جارٍ تأكيد تسجيل الدخول…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const complete = async () => {
      if (params.error) throw new Error("أُلغي تسجيل الدخول من موقع ANTER.");
      if (!params.code || !params.state) throw new Error("لم تكتمل بيانات العودة من موقع ANTER.");
      const user = await completeAnterBrowserLogin(params.code, params.state);
      setMessage(`أهلاً ${user.name}، جارٍ فتح محادثاتك…`);
      router.replace("/(tabs)" as never);
    };

    complete().catch((error) => setMessage(error instanceof Error ? error.message : "تعذر إكمال تسجيل الدخول."));
  }, [params.code, params.error, params.state, router]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color="#C9A8FF" />
      <Text style={styles.title}>ANTER Messenger</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 28, backgroundColor: "#12072B" },
  title: { color: "#F6F1FF", fontSize: 22, fontWeight: "900" },
  message: { color: "#D4C9E7", fontSize: 15, lineHeight: 24, textAlign: "center" },
});
