import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { assistantConversation, type ConversationSummary } from "@/lib/messenger-state";
import { hasLiveSession, listLiveConversations } from "@/lib/anter-mobile-api";

function ConversationCard({ item }: { item: ConversationSummary }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`فتح محادثة ${item.name}`}
      onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id } } as never)}
      style={({ pressed }) => [styles.conversation, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>أ</Text>
        {item.state === "online" ? <View style={styles.onlineDot} /> : null}
      </View>
      <View style={styles.conversationBody}>
        <View style={styles.conversationTopline}>
          <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
          <Text style={styles.updated}>{item.updatedLabel}</Text>
        </View>
        <Text numberOfLines={1} style={styles.preview}>{item.preview}</Text>
      </View>
      <IconSymbol name="chevron.right" size={22} color="#8EA5C5" />
    </Pressable>
  );
}

export default function InboxScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([assistantConversation]);
  const [isLive, setIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshConversations = useCallback(async () => {
    const connected = await hasLiveSession();
    setIsLive(connected);
    if (!connected) {
      setConversations([assistantConversation]);
      return;
    }
    const rows = await listLiveConversations();
    setConversations(rows.map((row) => ({
      id: row.user.username,
      name: row.user.name,
      handle: `@${row.user.username}`,
      preview: row.latestMessage.content || "رسالة بدون نص",
      updatedLabel: row.unreadCount ? `${row.unreadCount} جديد` : row.user.isOnline ? "متصل الآن" : "محادثة",
      state: row.user.isOnline ? "online" : "away",
    })));
  }, []);

  useEffect(() => {
    refreshConversations().catch(() => setIsLive(false));
  }, [refreshConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshConversations();
    } finally {
      setRefreshing(false);
    }
  }, [refreshConversations]);

  return (
    <ScreenContainer containerClassName="bg-[#071526]" className="px-4" edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>شبكة ANTER</Text>
          <Text style={styles.title}>الرسائل</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="بدء محادثة جديدة"
          onPress={() => router.push("/contacts" as never)}
          style={({ pressed }) => [styles.composeButton, pressed && styles.pressed]}
        >
          <IconSymbol name="square.and.pencil" size={22} color="#061323" />
        </Pressable>
      </View>

      <View style={styles.connectionCard}>
        <View style={styles.connectionIcon}><IconSymbol name="lock.fill" size={19} color="#57A9FF" /></View>
        <View style={styles.connectionCopy}>
          <Text style={styles.connectionTitle}>{isLive ? "متصل بخادم ANTER" : "وضع المعاينة المحلي"}</Text>
          <Text style={styles.connectionText}>{isLive ? "اسحب لتحديث المحادثات الحية. لا تظهر إلا المحادثات ذات المتابعة المتبادلة." : "اربط خادم ANTER من الإعدادات لعرض محادثاتك الحقيقية بأمان."}</Text>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConversationCard item={item} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<Text style={styles.listLabel}>{isLive ? "المحادثات الحية" : "المحادثات المتاحة"}</Text>}
        ListEmptyComponent={isLive ? <View style={styles.empty}><ActivityIndicator color="#65B4FF" /><Text style={styles.emptyText}>لا توجد محادثات حية بعد. ابدأ من جهات الاتصال.</Text></View> : null}
        ListFooterComponent={
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/contacts" as never)}
            style={({ pressed }) => [styles.contactsLink, pressed && styles.pressed]}
          >
            <IconSymbol name="person.2.fill" size={20} color="#9ED0FF" />
            <Text style={styles.contactsLinkText}>عرض الحسابات المتابَعة المتبادلة</Text>
          </Pressable>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingBottom: 18 },
  eyebrow: { color: "#77B7FF", fontSize: 12, fontWeight: "700", textAlign: "right" },
  title: { color: "#F3F8FF", fontSize: 30, lineHeight: 40, fontWeight: "800", textAlign: "right" },
  composeButton: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#65B4FF" },
  connectionCard: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 14, borderWidth: 1, borderColor: "#264562", borderRadius: 18, backgroundColor: "#0D2138" },
  connectionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#102D4B" },
  connectionCopy: { flex: 1 },
  connectionTitle: { color: "#EAF4FF", fontSize: 14, fontWeight: "800", textAlign: "right" },
  connectionText: { color: "#AABBD2", fontSize: 12, lineHeight: 19, marginTop: 3, textAlign: "right" },
  listContent: { paddingTop: 22, paddingBottom: 26, gap: 10 },
  listLabel: { color: "#AABBD2", fontSize: 13, fontWeight: "700", marginBottom: 1, textAlign: "right" },
  conversation: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: 18, borderWidth: 1, borderColor: "#1D3854", backgroundColor: "#10233B" },
  avatar: { width: 48, height: 48, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#2A6EA8", position: "relative" },
  avatarText: { color: "#F4FAFF", fontSize: 22, fontWeight: "900" },
  onlineDot: { position: "absolute", right: -1, bottom: -1, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#10233B", backgroundColor: "#38C98A" },
  conversationBody: { flex: 1, minWidth: 0 },
  conversationTopline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, color: "#F3F8FF", fontSize: 16, fontWeight: "800", textAlign: "right" },
  updated: { color: "#67D6A6", fontSize: 11, fontWeight: "700" },
  preview: { color: "#AABBD2", fontSize: 13, lineHeight: 20, marginTop: 4, textAlign: "right" },
  contactsLink: { marginTop: 8, padding: 14, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderWidth: 1, borderColor: "#2A5277", backgroundColor: "#0B1C31" },
  contactsLinkText: { color: "#B6DBFF", fontSize: 13, fontWeight: "800" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 38 },
  emptyText: { color: "#91A9C5", fontSize: 13, textAlign: "center" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
