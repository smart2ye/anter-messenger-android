import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { assistantConversation, type ConversationSummary } from "@/lib/messenger-state";
import { getSavedMobileProfile, hasLiveSession, listLiveContacts, listLiveConversations, type AnterMobileUser } from "@/lib/anter-mobile-api";
import { LIVE_SYNC_INTERVAL_MS } from "@/lib/live-sync";

function formatConversationTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "الآن" : date.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
}

function UserAvatar({ user, large = false }: { user: Pick<AnterMobileUser, "name" | "isOnline">; large?: boolean }) {
  return (
    <View style={[styles.avatar, large && styles.onlineAvatar]}>
      <Text style={[styles.avatarText, large && styles.onlineAvatarText]}>{user.name.trim().slice(0, 1) || "أ"}</Text>
      {user.isOnline ? <View style={[styles.onlineDot, large && styles.onlineDotLarge]} /> : null}
    </View>
  );
}

function OnlineFriendsStrip({ contacts }: { contacts: AnterMobileUser[] }) {
  if (!contacts.length) {
    return <View style={styles.onlineEmpty}><Text style={styles.onlineEmptyText}>لا يوجد أصدقاء متصلون الآن.</Text></View>;
  }

  return (
    <FlatList
      horizontal
      data={contacts}
      keyExtractor={(item) => item.username}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.onlineList}
      renderItem={({ item }) => <OnlineFriend user={item} />}
    />
  );
}

function OnlineFriend({ user }: { user: AnterMobileUser }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`مراسلة ${user.name}`}
      onPress={() => router.push({ pathname: "/chat/[id]", params: { id: user.username } } as never)}
      style={({ pressed }) => [styles.onlineFriend, pressed && styles.pressed]}
    >
      <UserAvatar user={user} large />
      <Text numberOfLines={1} style={styles.onlineFriendName}>{user.name}</Text>
    </Pressable>
  );
}

function ConversationCard({ item }: { item: ConversationSummary }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`فتح محادثة ${item.name}`}
      onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id } } as never)}
      style={({ pressed }) => [styles.conversation, pressed && styles.pressed]}
    >
      <UserAvatar user={{ name: item.name, isOnline: item.state === "online" }} />
      <View style={styles.conversationBody}>
        <View style={styles.conversationTopline}>
          <View style={styles.nameLine}><Text numberOfLines={1} style={styles.name}>{item.name}</Text><Text numberOfLines={1} style={styles.handle}>{item.handle}</Text></View>
          <Text style={styles.updated}>{item.updatedLabel}</Text>
        </View>
        <View style={styles.previewLine}><Text numberOfLines={1} style={styles.preview}>{item.sentByMe ? "أنت: " : ""}{item.preview}</Text>{item.unreadCount ? <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unreadCount > 99 ? "+99" : item.unreadCount}</Text></View> : null}</View>
      </View>
      <IconSymbol name="chevron.right" size={22} color="#8EA5C5" />
    </Pressable>
  );
}

export default function InboxScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([assistantConversation]);
  const [contacts, setContacts] = useState<AnterMobileUser[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshConversations = useCallback(async () => {
    const connected = await hasLiveSession();
    setIsLive(connected);
    if (!connected) {
      setConversations([assistantConversation]);
      setContacts([]);
      return;
    }
    const [profile, rows, contactRows] = await Promise.all([getSavedMobileProfile(), listLiveConversations(), listLiveContacts()]);
    setContacts(contactRows);
    setConversations(rows.map((row) => ({
      id: row.user.username,
      name: row.user.name,
      handle: `@${row.user.username}`,
      preview: row.latestMessage.content || "رسالة بدون نص",
      updatedLabel: formatConversationTime(row.latestMessage.createdAt),
      state: row.user.isOnline ? "online" : "away",
      unreadCount: row.unreadCount,
      sentByMe: profile?.id === row.latestMessage.senderId,
    })));
  }, []);

  useEffect(() => {
    refreshConversations().catch(() => setIsLive(false));
  }, [refreshConversations]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshConversations().catch(() => setIsLive(false));
    }, LIVE_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
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
          <Text style={styles.connectionTitle}>{isLive ? "محادثاتك متزامنة" : "جارٍ تحديث محادثاتك"}</Text>
          <Text style={styles.connectionText}>{isLive ? "تظهر المحادثات والقراءة والظهور عبر أجهزتك المرتبطة بحساب ANTER." : "سيستأنف التطبيق التحديث تلقائياً عند توفر الاتصال."}</Text>
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
        ListHeaderComponent={<View><View style={styles.onlineCard}><View style={styles.onlineHeading}><View style={styles.onlineHeadingCopy}><View style={styles.onlineTitleDot} /><Text style={styles.onlineTitle}>الأصدقاء المتصلون</Text></View><Text style={styles.onlineCount}>{isLive ? `${contacts.filter((item) => item.isOnline).length} متصل` : ""}</Text></View>{isLive ? <OnlineFriendsStrip contacts={contacts.filter((item) => item.isOnline)} /> : <View style={styles.onlineEmpty}><Text style={styles.onlineEmptyText}>يتم تحديث حالة الأصدقاء.</Text></View>}</View><Text style={styles.listLabel}>المحادثات</Text></View>}
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
  listContent: { paddingTop: 18, paddingBottom: 26, gap: 7 },
  onlineCard: { marginBottom: 21, paddingTop: 14, paddingBottom: 8, borderWidth: 1, borderColor: "#264562", borderRadius: 18, backgroundColor: "#0D2138" },
  onlineHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, marginBottom: 9 },
  onlineHeadingCopy: { flexDirection: "row", alignItems: "center", gap: 7 },
  onlineTitleDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#38C98A" },
  onlineTitle: { color: "#EAF4FF", fontSize: 14, fontWeight: "800" },
  onlineCount: { color: "#8DAAC8", fontSize: 11, fontWeight: "700" },
  onlineList: { paddingHorizontal: 11, gap: 12, paddingBottom: 5 },
  onlineFriend: { width: 70, alignItems: "center", gap: 6 },
  onlineAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#275D90" },
  onlineAvatarText: { fontSize: 24 },
  onlineDotLarge: { width: 15, height: 15, borderRadius: 8, borderWidth: 3, borderColor: "#0D2138" },
  onlineFriendName: { color: "#CBE1F8", fontSize: 11, fontWeight: "700", textAlign: "center", width: "100%" },
  onlineEmpty: { alignItems: "center", marginHorizontal: 11, paddingVertical: 16, paddingHorizontal: 12, borderRadius: 13, backgroundColor: "#102A45" },
  onlineEmptyText: { color: "#91A9C5", fontSize: 12, textAlign: "center" },
  listLabel: { color: "#D5E7F9", fontSize: 15, fontWeight: "800", marginBottom: 5, textAlign: "right" },
  conversation: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 16, backgroundColor: "#0B1C31" },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#2A6EA8", position: "relative" },
  avatarText: { color: "#F4FAFF", fontSize: 22, fontWeight: "900" },
  onlineDot: { position: "absolute", right: -1, bottom: -1, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#0B1C31", backgroundColor: "#38C98A" },
  conversationBody: { flex: 1, minWidth: 0 },
  conversationTopline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  nameLine: { flex: 1, minWidth: 0, gap: 1 },
  name: { color: "#F3F8FF", fontSize: 15, fontWeight: "800", textAlign: "right" },
  handle: { color: "#7994B2", fontSize: 10, textAlign: "right" },
  updated: { color: "#8EA5C5", fontSize: 10, fontWeight: "700" },
  previewLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 },
  preview: { flex: 1, color: "#AABBD2", fontSize: 12, lineHeight: 19, textAlign: "right" },
  unreadBadge: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#52A7FF" },
  unreadText: { color: "#061323", fontSize: 10, fontWeight: "900" },
  contactsLink: { marginTop: 8, padding: 14, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderWidth: 1, borderColor: "#2A5277", backgroundColor: "#0B1C31" },
  contactsLinkText: { color: "#B6DBFF", fontSize: 13, fontWeight: "800" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 38 },
  emptyText: { color: "#91A9C5", fontSize: 13, textAlign: "center" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
