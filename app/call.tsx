import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

export default function CallScreen() {
  const router = useRouter();
  const { name = "جهة اتصال ANTER" } = useLocalSearchParams<{ name?: string }>();

  return (
    <View style={styles.page}>
      <View style={styles.top}><Text style={styles.brand}>ANTER Messenger</Text><Text style={styles.secure}>مكالمة صوتية آمنة عبر ANTER</Text></View>
      <View style={styles.center}>
        <View style={styles.pulseOuter}><View style={styles.avatar}><Text style={styles.avatarText}>أ</Text></View></View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.status}>جارٍ الرنين…</Text>
        <Text style={styles.note}>تتطلب المكالمة المتابعة المتبادلة، وسيظهر سجلها داخل المحادثة بعد ربط خادم ANTER.</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="إنهاء الاتصال" onPress={() => router.back()} style={({ pressed }) => [styles.endButton, pressed && styles.pressed]}><IconSymbol name="phone.down.fill" size={26} color="#FFF" /></Pressable>
        <Text style={styles.endText}>إنهاء</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 28, justifyContent: "space-between", backgroundColor: "#071526" },
  top: { paddingTop: 26, alignItems: "center" }, brand: { color: "#EAF4FF", fontSize: 19, fontWeight: "800" }, secure: { color: "#87A8CA", fontSize: 12, marginTop: 5 },
  center: { alignItems: "center", marginTop: -35 }, pulseOuter: { width: 166, height: 166, borderRadius: 83, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#315F8B", backgroundColor: "#0F2C49" }, avatar: { width: 124, height: 124, borderRadius: 46, alignItems: "center", justifyContent: "center", backgroundColor: "#2A6EA8" }, avatarText: { color: "#F4FAFF", fontSize: 58, fontWeight: "900" }, name: { color: "#F3F8FF", fontSize: 25, fontWeight: "800", marginTop: 25 }, status: { color: "#73BDFF", fontSize: 15, marginTop: 7 }, note: { maxWidth: 310, color: "#91A9C5", fontSize: 12, lineHeight: 20, textAlign: "center", marginTop: 28 },
  actions: { alignItems: "center", paddingBottom: 28 }, endButton: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "#E15461" }, endText: { color: "#E7EFF9", fontSize: 12, marginTop: 9 }, pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});

