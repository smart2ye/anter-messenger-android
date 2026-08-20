import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { assistantMessages, type ChatMessage } from "@/lib/messenger-state";
import { clearLiveAssistantMemory, getConversationActivity, getSavedMobileProfile, hasLiveSession, listLiveMessages, sendLiveMessage, updateConversationTyping, type AnterMobileMessage, type AnterMobileUser } from "@/lib/anter-mobile-api";

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "الآن" : date.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
}

function mapLiveMessages(rows: AnterMobileMessage[], myUserId: number): ChatMessage[] {
  return rows.map((row) => ({
    id: `live-${row.id}`,
    body: row.content,
    from: row.senderId === myUserId ? "me" : "other",
    time: formatTime(row.createdAt),
    isRead: row.isRead,
  }));
}

function AssistantMessageText({ body }: { body: string }) {
  const segments = body.split(/(\*\*[^*]+\*\*)/g);
  return <Text style={styles.messageText}>{segments.map((segment, index) => segment.startsWith("**") && segment.endsWith("**") ? <Text key={`${segment}-${index}`} style={styles.assistantBold}>{segment.slice(2, -2)}</Text> : segment)}</Text>;
}

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(assistantMessages);
  const [isLive, setIsLive] = useState(false);
  const [peer, setPeer] = useState<AnterMobileUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isClearingMemory, setIsClearingMemory] = useState(false);
  const typingActiveRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetUsername = id === "anter-assistant" ? "anter_assistant" : id;
  const title = peer?.name ?? (id === "anter-assistant" ? "مساعد أنتر" : "محادثة ANTER");
  const isAssistant = targetUsername === "anter_assistant";

  const loadLiveMessages = useCallback(async () => {
    const connected = await hasLiveSession();
    if (!connected) {
      setIsLive(false);
      return;
    }
    const profile = await getSavedMobileProfile();
    if (!profile) {
      setIsLive(false);
      return;
    }
    const [payload, activity] = await Promise.all([
      listLiveMessages(targetUsername),
      getConversationActivity(targetUsername),
    ]);
    setPeer(payload.user);
    setMessages(mapLiveMessages(payload.messages, profile.id));
    setIsPeerTyping(activity.isTyping);
    setIsLive(true);
  }, [targetUsername]);

  useEffect(() => {
    setLoading(true);
    loadLiveMessages().catch(() => setIsLive(false)).finally(() => setLoading(false));
  }, [loadLiveMessages]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      loadLiveMessages().catch(() => undefined);
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive, loadLiveMessages]);

  const stopTyping = useCallback(async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isLive && typingActiveRef.current) {
      typingActiveRef.current = false;
      await updateConversationTyping(targetUsername, false).catch(() => undefined);
    }
  }, [isLive, targetUsername]);

  useEffect(() => () => { stopTyping().catch(() => undefined); }, [stopTyping]);

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!isLive) return;
    if (!value.trim()) {
      stopTyping().catch(() => undefined);
      return;
    }
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      updateConversationTyping(targetUsername, true).catch(() => { typingActiveRef.current = false; });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { stopTyping().catch(() => undefined); }, 1800);
  }

  async function sendMessage() {
    const body = draft.trim();
    if (!body) return;
    if (!isLive) {
      setMessages((current) => [...current, { id: `local-${Date.now()}`, body, from: "me", time: "محلياً" }]);
      setDraft("");
      return;
    }
    setIsSending(true);
    try {
      await sendLiveMessage(targetUsername, body);
      setDraft("");
      await stopTyping();
      await loadLiveMessages();
    } catch (error) {
      Alert.alert("تعذر الإرسال", error instanceof Error ? error.message : "حاول مجدداً.");
    } finally {
      setIsSending(false);
    }
  }

  async function clearAssistantMemory() {
    if (!isLive || isClearingMemory) return;
    setIsClearingMemory(true);
    try {
      const result = await clearLiveAssistantMemory(targetUsername);
      Alert.alert("ذاكرة مساعد أنتر", result.message);
    } catch (error) {
      Alert.alert("تعذر مسح الذاكرة", error instanceof Error ? error.message : "حاول مجدداً.");
    } finally {
      setIsClearingMemory(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", default: undefined })} style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="رجوع" onPress={() => router.back()} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}><IconSymbol name="chevron.right" size={25} color="#D7ECFF" /></Pressable>
        {!isAssistant ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/call", params: { name: title } } as never)} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}><IconSymbol name="phone.fill" size={20} color="#6FC2FF" /></Pressable> : null}
        <View style={styles.titleArea}><View style={styles.titleLine}><Text style={styles.title}>{title}</Text>{isAssistant ? <View style={styles.assistantBadge}><Text style={styles.assistantBadgeText}>مساعد آلي</Text></View> : null}</View><Text style={styles.handle}>@{peer?.username ?? targetUsername}</Text><Text style={styles.status}>{peer?.isOnline ? "متصل الآن" : isLive ? "مرتبط عبر ANTER" : "معاينة محلية"}</Text></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>أ</Text><View style={styles.onlineDot} /></View>
      </View>

      <View style={styles.banner}><IconSymbol name="lock.fill" size={16} color="#90C9FF" /><Text style={styles.bannerText}>{isLive ? "رسائل حية عبر ANTER. تُفرض المتابعة المتبادلة على الخادم." : "وضع معاينة محلي: لا تُرسل الرسائل إلى ANTER قبل ربط الخادم."}</Text></View>
      {isAssistant ? <View style={styles.memoryNotice}><View style={styles.memoryCopy}><Text style={styles.memoryTitle}>ذاكرة مساعد أنتر</Text><Text style={styles.memoryText}>يتذكر الاسم والسياق والتفضيلات داخل ANTER فقط. يمكنك مسح الذاكرة من دون حذف رسائل المحادثة.</Text></View><Pressable disabled={!isLive || isClearingMemory} accessibilityRole="button" accessibilityLabel="مسح ذاكرة مساعد أنتر" onPress={clearAssistantMemory} style={({ pressed }) => [styles.clearMemoryButton, pressed && styles.pressed, (!isLive || isClearingMemory) && styles.disabled]}>{isClearingMemory ? <ActivityIndicator color="#D8ECFF" size="small" /> : <Text style={styles.clearMemoryText}>مسح الذاكرة</Text>}</Pressable></View> : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => item.from === "system" ? <View style={styles.systemBubble}><Text style={styles.systemText}>{item.body}</Text></View> : <View style={[styles.bubbleWrap, item.from === "me" ? styles.mineWrap : styles.otherWrap]}><View style={[styles.bubble, item.from === "me" ? styles.mineBubble : styles.otherBubble]}>{item.from === "other" && isAssistant ? <AssistantMessageText body={item.body} /> : <Text style={[styles.messageText, item.from === "me" && styles.mineText]}>{item.body}</Text>}<View style={styles.messageMeta}><Text style={[styles.timeText, item.from === "me" && styles.mineTime]}>{item.time}</Text>{item.from === "me" && isLive ? <Text style={[styles.readState, item.isRead ? styles.readStateSeen : styles.mineTime]}>{item.isRead ? "تمت القراءة" : "تم الإرسال"}</Text> : null}</View></View></View>}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => loadLiveMessages().catch(() => Alert.alert("تعذر التحديث", "تحقق من اتصالك بخادم ANTER."))}
        ListEmptyComponent={loading ? <ActivityIndicator color="#65B4FF" /> : null}
      />

      {isPeerTyping ? <View style={styles.typingIndicator}><View style={styles.typingDots}><View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} /></View><Text style={styles.typingText}>{title} يكتب الآن</Text></View> : null}

      <View style={styles.callLog}><IconSymbol name="phone.fill" size={15} color="#84BFFF" /><View style={styles.callLogCopy}><Text style={styles.callLogTitle}>سجل المكالمات</Text><Text style={styles.callLogText}>ستظهر حالات المكالمة المستلمة أو المرفوضة أو الفائتة داخل هذه المحادثة بعد الربط.</Text></View><Pressable onPress={() => router.push({ pathname: "/call", params: { name: title } } as never)} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryText}>معاودة الاتصال</Text></Pressable></View>

      <View style={styles.composer}><TextInput value={draft} onChangeText={handleDraftChange} placeholder={isAssistant ? "اكتب سؤالك لمساعد أنتر..." : "اكتب رسالة..."} placeholderTextColor="#7590AF" multiline style={styles.input} textAlign="right" /><Pressable disabled={isSending} accessibilityRole="button" accessibilityLabel="إرسال الرسالة" onPress={sendMessage} style={({ pressed }) => [styles.sendButton, pressed && styles.pressed, isSending && styles.disabled]}>{isSending ? <ActivityIndicator color="#061323" /> : <IconSymbol name="paperplane.fill" size={20} color="#061323" />}</Pressable></View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#071526" },
  header: { minHeight: 76, paddingHorizontal: 15, paddingTop: 22, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: "#193550", backgroundColor: "#0B1C31" },
  headerButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#102A45" },
  titleArea: { flex: 1 }, titleLine: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 6 }, title: { color: "#F3F8FF", fontSize: 16, fontWeight: "800", textAlign: "right" }, handle: { color: "#7E9BBB", fontSize: 10, marginTop: 1, textAlign: "right" }, status: { color: "#4CD598", fontSize: 11, marginTop: 2, textAlign: "right" }, assistantBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7, backgroundColor: "#1E5E95" }, assistantBadgeText: { color: "#E4F4FF", fontSize: 9, fontWeight: "800" },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#2A6EA8", position: "relative" }, avatarText: { color: "#F4FAFF", fontSize: 20, fontWeight: "900" }, onlineDot: { position: "absolute", right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#0B1C31", backgroundColor: "#38C98A" },
  banner: { flexDirection: "row", gap: 8, alignItems: "center", paddingHorizontal: 16, paddingVertical: 9, backgroundColor: "#0D2742" }, bannerText: { flex: 1, color: "#B9DAF8", fontSize: 11, textAlign: "right" },
  memoryNotice: { flexDirection: "row", gap: 10, alignItems: "center", marginHorizontal: 13, marginTop: 10, padding: 11, borderRadius: 14, borderWidth: 1, borderColor: "#215671", backgroundColor: "#0B2734" }, memoryCopy: { flex: 1 }, memoryTitle: { color: "#DCF5FF", fontSize: 12, fontWeight: "800", textAlign: "right" }, memoryText: { color: "#A8CFDB", fontSize: 10, lineHeight: 15, marginTop: 3, textAlign: "right" }, clearMemoryButton: { minWidth: 70, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: "#47728D", backgroundColor: "#123C50" }, clearMemoryText: { color: "#D8ECFF", fontSize: 10, fontWeight: "800" },
  messages: { padding: 16, gap: 10 }, bubbleWrap: { flexDirection: "row" }, mineWrap: { justifyContent: "flex-start" }, otherWrap: { justifyContent: "flex-end" }, bubble: { maxWidth: "82%", padding: 12, borderRadius: 18 }, mineBubble: { backgroundColor: "#65B4FF", borderBottomLeftRadius: 5 }, otherBubble: { backgroundColor: "#142B46", borderBottomRightRadius: 5 }, messageText: { color: "#EAF4FF", fontSize: 14, lineHeight: 22, textAlign: "right" }, mineText: { color: "#061323" }, messageMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5 }, timeText: { color: "#8EA5C5", fontSize: 10, textAlign: "right" }, mineTime: { color: "#234A70" }, readState: { fontSize: 10, fontWeight: "700" }, readStateSeen: { color: "#0B5844" },
  assistantBold: { color: "#FFFFFF", fontWeight: "900" }, systemBubble: { alignSelf: "center", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, backgroundColor: "#0B1C31", maxWidth: "92%" }, systemText: { color: "#AABBD2", fontSize: 11, lineHeight: 18, textAlign: "center" },
  typingIndicator: { alignSelf: "flex-end", marginHorizontal: 16, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "#10233B" }, typingDots: { flexDirection: "row", gap: 3 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#65B4FF" }, typingText: { color: "#B6D9FC", fontSize: 11, fontWeight: "700" },
  callLog: { marginHorizontal: 13, marginBottom: 8, flexDirection: "row", gap: 9, alignItems: "center", padding: 11, borderRadius: 15, borderWidth: 1, borderColor: "#294B6D", backgroundColor: "#0C2036" }, callLogCopy: { flex: 1 }, callLogTitle: { color: "#DDEEFF", fontSize: 12, fontWeight: "800", textAlign: "right" }, callLogText: { color: "#8EA5C5", fontSize: 10, lineHeight: 15, marginTop: 2, textAlign: "right" }, retryButton: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 10, backgroundColor: "#173B60" }, retryText: { color: "#CFE9FF", fontSize: 10, fontWeight: "800" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 9, padding: 12, paddingBottom: 18, borderTopWidth: 1, borderTopColor: "#193550", backgroundColor: "#0B1C31" }, input: { flex: 1, maxHeight: 108, minHeight: 46, borderRadius: 16, borderWidth: 1, borderColor: "#294B6D", backgroundColor: "#071526", color: "#EAF4FF", paddingHorizontal: 13, paddingVertical: 11, fontSize: 14 }, sendButton: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#65B4FF" }, pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] }, disabled: { opacity: 0.45 },
});
