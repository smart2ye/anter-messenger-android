import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { hasLiveSession, listLiveContacts, type AnterMobileUser } from "@/lib/anter-mobile-api";

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<AnterMobileUser[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshContacts = useCallback(async () => {
    const connected = await hasLiveSession();
    setIsLive(connected);
    if (!connected) return;
    setContacts(await listLiveContacts());
  }, []);

  useEffect(() => {
    refreshContacts().catch(() => setIsLive(false));
  }, [refreshContacts]);

  return (
    <ScreenContainer containerClassName="bg-[#071526]" className="px-4" edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>جهات الاتصال</Text>
        <Text style={styles.subtitle}>تظهر الحسابات التي توجد متابعة متبادلة معها فقط.</Text>
      </View>

      <View style={styles.privacyCard}>
        <IconSymbol name="checkmark.shield.fill" size={22} color="#38C98A" />
        <Text style={styles.privacyText}>تحمي ANTER المراسلة والاتصال بشرط المتابعة المتبادلة.</Text>
      </View>

      {isLive ? <FlatList
        data={contacts}
        keyExtractor={(item) => item.username}
        refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); try { await refreshContacts(); } finally { setRefreshing(false); } }}
        contentContainerStyle={styles.liveList}
        renderItem={({ item }) => <View style={styles.contactCard}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text>{item.isOnline ? <View style={styles.onlineDot} /> : null}</View><View style={styles.contactCopy}><Text style={styles.name}>{item.name}</Text><Text style={styles.handle}>@{item.username} · {item.isOnline ? "متصل الآن" : "متاح للمراسلة"}</Text></View><Pressable onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.username } } as never)} style={({ pressed }) => [styles.messageButton, pressed && styles.pressed]}><Text style={styles.messageButtonText}>مراسلة</Text></Pressable></View>}
        ListEmptyComponent={<View style={styles.emptyState}><ActivityIndicator color="#65B4FF" /><Text style={styles.emptyTitle}>لا توجد جهات مؤهلة بعد</Text><Text style={styles.emptyText}>تأكد من وجود متابعة متبادلة في ANTER ثم اسحب للتحديث.</Text></View>}
      /> : <View style={styles.emptyState}>
          <IconSymbol name="person.2.fill" size={28} color="#5E82A8" />
          <Text style={styles.emptyTitle}>يتعذر تحميل جهات الاتصال الآن</Text>
          <Text style={styles.emptyText}>اسحب للأسفل لإعادة المحاولة.</Text>
        </View>}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingBottom: 20 },
  title: { color: "#F3F8FF", fontSize: 29, fontWeight: "800", textAlign: "right" },
  subtitle: { color: "#AABBD2", fontSize: 13, lineHeight: 20, marginTop: 5, textAlign: "right" },
  privacyCard: { flexDirection: "row", gap: 10, alignItems: "center", padding: 13, borderWidth: 1, borderColor: "#214C51", borderRadius: 16, backgroundColor: "#0B292E" },
  privacyText: { flex: 1, color: "#D6F7E7", fontSize: 12, lineHeight: 19, textAlign: "right" },
  contactCard: { marginTop: 18, flexDirection: "row", gap: 11, alignItems: "center", padding: 13, borderWidth: 1, borderColor: "#1D3854", borderRadius: 18, backgroundColor: "#10233B" },
  avatar: { width: 48, height: 48, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#2A6EA8", position: "relative" },
  avatarText: { color: "#F4FAFF", fontSize: 22, fontWeight: "900" },
  onlineDot: { position: "absolute", right: -1, bottom: -1, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#10233B", backgroundColor: "#38C98A" },
  contactCopy: { flex: 1 },
  name: { color: "#F3F8FF", fontSize: 16, fontWeight: "800", textAlign: "right" },
  handle: { color: "#AABBD2", fontSize: 12, marginTop: 4, textAlign: "right" },
  messageButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, backgroundColor: "#65B4FF" },
  messageButtonText: { color: "#061323", fontSize: 12, fontWeight: "900" },
  emptyState: { alignItems: "center", paddingHorizontal: 26, paddingTop: 78 },
  emptyTitle: { color: "#D9EAFC", fontSize: 16, fontWeight: "800", marginTop: 12 },
  emptyText: { color: "#91A9C5", fontSize: 13, lineHeight: 22, marginTop: 6, textAlign: "center" },
  liveList: { paddingTop: 8, paddingBottom: 32 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
