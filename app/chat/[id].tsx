import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { canDeleteForEveryone, getVisibleMessageActions } from "@/lib/message-actions";
import { type ChatMessage } from "@/lib/messenger-state";
import { clearLiveAssistantMemory, deleteLiveMessage, forwardLiveMessage, getConversationActivity, getSavedMobileProfile, hasLiveSession, listLiveContacts, listLiveMessages, sendLiveMessage, updateConversationTyping, type AnterMobileMessage, type AnterMobileUser } from "@/lib/anter-mobile-api";
import { LIVE_SYNC_INTERVAL_MS } from "@/lib/live-sync";

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
    serverId: row.id,
    parent: row.parent ? {
      id: row.parent.id,
      body: row.parent.content,
      from: row.parent.senderId === myUserId ? "me" : "other",
      isDeletedEveryone: row.parent.isDeletedEveryone,
    } : undefined,
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [peer, setPeer] = useState<AnterMobileUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isClearingMemory, setIsClearingMemory] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [forwardContacts, setForwardContacts] = useState<AnterMobileUser[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
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
    }, LIVE_SYNC_INTERVAL_MS);
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
      Alert.alert("تعذر الإرسال الآن", "سيظهر لك الاتصال مجدداً فور اكتمال تحديث المحادثة.");
      return;
    }
    setIsSending(true);
    try {
      await sendLiveMessage(targetUsername, body, replyTo?.serverId);
      setDraft("");
      setReplyTo(null);
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

  async function copyMessage(message: ChatMessage) {
    try {
      await Clipboard.setStringAsync(message.body);
      Alert.alert("تم النسخ", "حُفظ نص الرسالة في حافظة الجهاز.");
    } catch {
      Alert.alert("تعذر النسخ", "تعذر الوصول إلى حافظة الجهاز الآن.");
    }
  }

  async function deleteMessage(message: ChatMessage, scope: "me" | "everyone") {
    if (!isLive || !message.serverId) return;
    try {
      await deleteLiveMessage(message.serverId, scope);
      setActiveMessageId(null);
      await loadLiveMessages();
    } catch (error) {
      Alert.alert("تعذر الحذف", error instanceof Error ? error.message : "حاول مجدداً.");
    }
  }

  async function beginForward(message: ChatMessage) {
    if (!isLive || !message.serverId) return;
    try {
      const contacts = await listLiveContacts();
      setForwardContacts(contacts.filter((contact) => contact.username !== targetUsername));
      setForwardingMessage(message);
      setActiveMessageId(null);
    } catch (error) {
      Alert.alert("تعذر إعادة التوجيه", error instanceof Error ? error.message : "حاول مجدداً.");
    }
  }

  async function completeForward(target: AnterMobileUser) {
    if (!forwardingMessage?.serverId || isForwarding) return;
    setIsForwarding(true);
    try {
      await forwardLiveMessage(forwardingMessage.serverId, target.username);
      setForwardingMessage(null);
      Alert.alert("تمت إعادة التوجيه", `أُرسلت الرسالة إلى ${target.name}.`);
    } catch (error) {
      Alert.alert("تعذر إعادة التوجيه", error instanceof Error ? error.message : "حاول مجدداً.");
    } finally {
      setIsForwarding(false);
    }
  }

  function openMessageActions(message: ChatMessage) {
    if (message.from === "system") return;
    const actions: Array<{ text: string; style?: "cancel" | "destructive"; onPress?: () => void }> = [
      { text: "رد", onPress: () => setReplyTo(message) },
      { text: "نسخ", onPress: () => { void copyMessage(message); } },
    ];
    if (isLive && message.serverId) {
      actions.push({ text: "إعادة توجيه", onPress: () => { void beginForward(message); } });
      actions.push({ text: "حذف عندي", style: "destructive", onPress: () => { void deleteMessage(message, "me"); } });
    if (canDeleteForEveryone(message.from)) actions.push({ text: "حذف عند الجميع", style: "destructive", onPress: () => { void deleteMessage(message, "everyone"); } });
    }
    actions.push({ text: "إلغاء", style: "cancel" });
    Alert.alert("إجراءات الرسالة", "اضغط مطولاً على أي رسالة لفتح هذه القائمة.", actions);
  }

  function beginReply(message: ChatMessage) {
    setReplyTo(message);
    setActiveMessageId(null);
  }

  function requestDelete(message: ChatMessage) {
    const actions: Array<{ text: string; style?: "cancel" | "destructive"; onPress?: () => void }> = [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف عندي", style: "destructive", onPress: () => { void deleteMessage(message, "me"); } },
    ];
    if (message.from === "me") {
      actions.push({ text: "حذف عند الجميع", style: "destructive", onPress: () => { void deleteMessage(message, "everyone"); } });
    }
    Alert.alert("حذف الرسالة", "اختر نطاق الحذف. لا يمكن التراجع عن الحذف عند الجميع.", actions);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", default: undefined })} style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="رجوع" onPress={() => router.back()} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}><IconSymbol name="chevron.right" size={25} color="#D7ECFF" /></Pressable>
        {!isAssistant ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/call", params: { name: title } } as never)} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}><IconSymbol name="phone.fill" size={20} color="#6FC2FF" /></Pressable> : null}
        <View style={styles.titleArea}><View style={styles.titleLine}><Text style={styles.title}>{title}</Text></View><Text style={styles.handle}>@{peer?.username ?? targetUsername}</Text><Text style={styles.status}>{peer?.isOnline ? "متصل الآن" : isLive ? "متاح للمراسلة" : "جارٍ تحديث المحادثة"}</Text></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>أ</Text><View style={styles.onlineDot} /></View>
      </View>

      <View style={styles.banner}><IconSymbol name="lock.fill" size={16} color="#90C9FF" /><Text style={styles.bannerText}>المراسلات الخاصة متاحة للحسابات ذات المتابعة المتبادلة.</Text></View>
      {isAssistant ? <View style={styles.memoryNotice}><View style={styles.memoryCopy}><Text style={styles.memoryTitle}>ذاكرة مساعد أنتر</Text><Text style={styles.memoryText}>يحتفظ المساعد بسياق هذه المحادثة لتحسين المتابعة، ويمكنك مسحه في أي وقت.</Text></View><Pressable disabled={!isLive || isClearingMemory} accessibilityRole="button" accessibilityLabel="مسح ذاكرة مساعد أنتر" onPress={clearAssistantMemory} style={({ pressed }) => [styles.clearMemoryButton, pressed && styles.pressed, (!isLive || isClearingMemory) && styles.disabled]}>{isClearingMemory ? <ActivityIndicator color="#D8ECFF" size="small" /> : <Text style={styles.clearMemoryText}>مسح الذاكرة</Text>}</Pressable></View> : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.from === "system") return <View style={styles.systemBubble}><Text style={styles.systemText}>{item.body}</Text></View>;
          const isActive = activeMessageId === item.id;
          const isMine = item.from === "me";
          const visibleActions = getVisibleMessageActions({ isLive, hasServerMessage: Boolean(item.serverId) });
          return (
            <View style={[styles.messageGroup, isMine ? styles.mineWrap : styles.otherWrap]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إجراءات الرسالة"
                onPress={() => setActiveMessageId((current) => current === item.id ? null : item.id)}
                onLongPress={() => openMessageActions(item)}
                style={({ pressed }) => [styles.bubble, isMine ? styles.mineBubble : styles.otherBubble, isActive && styles.activeBubble, pressed && styles.pressed]}
              >
                <View style={styles.messageTopLine}>
                  <Text style={[styles.messageOwner, isMine && styles.mineOwner]}>{isMine ? "أنت" : title}</Text>
                  <IconSymbol name="ellipsis.circle.fill" size={16} color={isMine ? "#164662" : "#86A9CB"} />
                </View>
                {item.parent ? <View style={[styles.quotedMessage, isMine && styles.mineQuotedMessage]}><Text style={[styles.quotedName, isMine && styles.mineQuotedText]}>{item.parent.from === "me" ? "أنت" : title}</Text><Text numberOfLines={1} style={[styles.quotedText, isMine && styles.mineQuotedText]}>{item.parent.isDeletedEveryone ? "تم حذف الرسالة" : item.parent.body}</Text></View> : null}
                {item.from === "other" && isAssistant ? <AssistantMessageText body={item.body} /> : <Text style={[styles.messageText, isMine && styles.mineText]}>{item.body}</Text>}
                <View style={styles.messageMeta}><Text style={[styles.timeText, isMine && styles.mineTime]}>{item.time}</Text>{isMine && isLive ? <Text style={[styles.readState, item.isRead ? styles.readStateSeen : styles.mineTime]}>{item.isRead ? "تمت القراءة" : "تم الإرسال"}</Text> : null}</View>
              </Pressable>
              {isActive ? <View style={[styles.messageActions, isMine ? styles.mineActions : styles.otherActions]}>
                {visibleActions.includes("reply") ? <Pressable accessibilityRole="button" accessibilityLabel="الرد على الرسالة" onPress={() => beginReply(item)} style={({ pressed }) => [styles.messageActionButton, pressed && styles.pressed]}><IconSymbol name="arrowshape.turn.up.left.fill" size={15} color="#CFE9FF" /><Text style={styles.messageActionText}>رد</Text></Pressable> : null}
                {visibleActions.includes("forward") ? <Pressable accessibilityRole="button" accessibilityLabel="إعادة توجيه الرسالة" onPress={() => { void beginForward(item); }} style={({ pressed }) => [styles.messageActionButton, pressed && styles.pressed]}><IconSymbol name="arrowshape.turn.up.right.fill" size={15} color="#CFE9FF" /><Text style={styles.messageActionText}>توجيه</Text></Pressable> : null}
                {visibleActions.includes("delete") ? <Pressable accessibilityRole="button" accessibilityLabel="حذف الرسالة" onPress={() => requestDelete(item)} style={({ pressed }) => [styles.messageActionButton, styles.deleteActionButton, pressed && styles.pressed]}><IconSymbol name="trash.fill" size={15} color="#FFD7DD" /><Text style={styles.deleteActionText}>حذف</Text></Pressable> : null}
              </View> : null}
            </View>
          );
        }}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => loadLiveMessages().catch(() => Alert.alert("تعذر التحديث", "تحقق من اتصالك بخادم ANTER."))}
        ListEmptyComponent={loading ? <ActivityIndicator color="#65B4FF" /> : null}
      />

      {isPeerTyping ? <View style={styles.typingIndicator}><View style={styles.typingDots}><View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} /></View><Text style={styles.typingText}>{title} يكتب الآن</Text></View> : null}

      {replyTo ? <View style={styles.replyPreview}><View style={styles.replyCopy}><Text style={styles.replyToName}>{replyTo.from === "me" ? "الرد على رسالتك" : `الرد على ${title}`}</Text><Text numberOfLines={1} style={styles.replyToText}>{replyTo.body}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="إلغاء الرد" onPress={() => setReplyTo(null)} style={({ pressed }) => [styles.cancelReplyButton, pressed && styles.pressed]}><Text style={styles.cancelReplyText}>إلغاء</Text></Pressable></View> : null}
      <View style={styles.composer}><TextInput value={draft} onChangeText={handleDraftChange} placeholder={isAssistant ? "اكتب سؤالك لمساعد أنتر..." : "اكتب رسالة..."} placeholderTextColor="#7590AF" multiline style={styles.input} textAlign="right" /><Pressable disabled={isSending} accessibilityRole="button" accessibilityLabel="إرسال الرسالة" onPress={sendMessage} style={({ pressed }) => [styles.sendButton, pressed && styles.pressed, isSending && styles.disabled]}>{isSending ? <ActivityIndicator color="#061323" /> : <IconSymbol name="paperplane.fill" size={20} color="#061323" />}</Pressable></View>
      <Modal transparent visible={forwardingMessage !== null} animationType="slide" onRequestClose={() => setForwardingMessage(null)}><View style={styles.forwardOverlay}><View style={styles.forwardSheet}><View style={styles.forwardHeader}><View><Text style={styles.forwardTitle}>إعادة توجيه الرسالة</Text><Text numberOfLines={1} style={styles.forwardPreview}>{forwardingMessage?.body}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="إغلاق إعادة التوجيه" onPress={() => setForwardingMessage(null)} style={({ pressed }) => [styles.closeForwardButton, pressed && styles.pressed]}><Text style={styles.closeForwardText}>إغلاق</Text></Pressable></View><FlatList data={forwardContacts} keyExtractor={(item) => item.username} renderItem={({ item }) => <Pressable disabled={isForwarding} onPress={() => { void completeForward(item); }} style={({ pressed }) => [styles.forwardContact, pressed && styles.pressed, isForwarding && styles.disabled]}><View style={styles.forwardAvatar}><Text style={styles.forwardAvatarText}>{item.name.slice(0, 1)}</Text></View><View style={styles.forwardContactCopy}><Text style={styles.forwardContactName}>{item.name}</Text><Text style={styles.forwardContactHandle}>@{item.username}</Text></View></Pressable>} ListEmptyComponent={<Text style={styles.forwardEmpty}>لا توجد جهة متابعة متبادلة أخرى لإعادة التوجيه إليها.</Text>} /></View></View></Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#071526" },
  header: { minHeight: 76, paddingHorizontal: 15, paddingTop: 22, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: "#193550", backgroundColor: "#0B1C31" },
  headerButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#102A45" },
  titleArea: { flex: 1 }, titleLine: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 6 }, title: { color: "#F3F8FF", fontSize: 16, fontWeight: "800", textAlign: "right" }, handle: { color: "#7E9BBB", fontSize: 10, marginTop: 1, textAlign: "right" }, status: { color: "#4CD598", fontSize: 11, marginTop: 2, textAlign: "right" },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#2A6EA8", position: "relative" }, avatarText: { color: "#F4FAFF", fontSize: 20, fontWeight: "900" }, onlineDot: { position: "absolute", right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#0B1C31", backgroundColor: "#38C98A" },
  banner: { flexDirection: "row", gap: 8, alignItems: "center", paddingHorizontal: 16, paddingVertical: 9, backgroundColor: "#0D2742" }, bannerText: { flex: 1, color: "#B9DAF8", fontSize: 11, textAlign: "right" },
  memoryNotice: { flexDirection: "row", gap: 10, alignItems: "center", marginHorizontal: 13, marginTop: 10, padding: 11, borderRadius: 14, borderWidth: 1, borderColor: "#215671", backgroundColor: "#0B2734" }, memoryCopy: { flex: 1 }, memoryTitle: { color: "#DCF5FF", fontSize: 12, fontWeight: "800", textAlign: "right" }, memoryText: { color: "#A8CFDB", fontSize: 10, lineHeight: 15, marginTop: 3, textAlign: "right" }, clearMemoryButton: { minWidth: 70, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: "#47728D", backgroundColor: "#123C50" }, clearMemoryText: { color: "#D8ECFF", fontSize: 10, fontWeight: "800" },
  messages: { padding: 16, gap: 11 }, messageGroup: { maxWidth: "86%" }, mineWrap: { alignSelf: "flex-end", alignItems: "flex-end" }, otherWrap: { alignSelf: "flex-start", alignItems: "flex-start" }, bubble: { width: "100%", padding: 12, borderRadius: 18, borderWidth: 1 }, mineBubble: { backgroundColor: "#65B4FF", borderColor: "#8BC9FF", borderBottomLeftRadius: 5 }, otherBubble: { backgroundColor: "#142B46", borderColor: "#284A6A", borderBottomRightRadius: 5 }, activeBubble: { borderColor: "#9CD4FF", shadowColor: "#000000", shadowOpacity: 0.24, shadowRadius: 7, elevation: 3 }, messageTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }, messageOwner: { color: "#91CFFF", fontSize: 10, fontWeight: "900", textAlign: "right" }, mineOwner: { color: "#164662" }, quotedMessage: { borderRightWidth: 3, borderRightColor: "#67B8FF", borderRadius: 8, paddingRight: 8, marginBottom: 8, backgroundColor: "#0E223A" }, mineQuotedMessage: { borderRightColor: "#17496C", backgroundColor: "#A6D8FF" }, quotedName: { color: "#90CEFF", fontSize: 10, fontWeight: "900", textAlign: "right" }, quotedText: { color: "#AABBD2", fontSize: 10, marginTop: 2, textAlign: "right" }, mineQuotedText: { color: "#164662" }, messageText: { color: "#EAF4FF", fontSize: 14, lineHeight: 22, textAlign: "right" }, mineText: { color: "#061323" }, messageMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 7 }, timeText: { color: "#8EA5C5", fontSize: 10, textAlign: "right" }, mineTime: { color: "#234A70" }, readState: { fontSize: 10, fontWeight: "700" }, readStateSeen: { color: "#0B5844" }, messageActions: { flexDirection: "row", gap: 6, marginTop: 6 }, mineActions: { justifyContent: "flex-end" }, otherActions: { justifyContent: "flex-start" }, messageActionButton: { minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: "#2B5279", backgroundColor: "#102A45" }, messageActionText: { color: "#CFE9FF", fontSize: 10, fontWeight: "800" }, deleteActionButton: { borderColor: "#713D49", backgroundColor: "#321D2A" }, deleteActionText: { color: "#FFD7DD", fontSize: 10, fontWeight: "800" },
  assistantBold: { color: "#FFFFFF", fontWeight: "900" }, systemBubble: { alignSelf: "center", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, backgroundColor: "#0B1C31", maxWidth: "92%" }, systemText: { color: "#AABBD2", fontSize: 11, lineHeight: 18, textAlign: "center" },
  typingIndicator: { alignSelf: "flex-end", marginHorizontal: 16, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "#10233B" }, typingDots: { flexDirection: "row", gap: 3 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#65B4FF" }, typingText: { color: "#B6D9FC", fontSize: 11, fontWeight: "700" },
  replyPreview: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 12, paddingHorizontal: 11, paddingVertical: 8, borderTopLeftRadius: 13, borderTopRightRadius: 13, borderWidth: 1, borderBottomWidth: 0, borderColor: "#294B6D", backgroundColor: "#10233B" }, replyCopy: { flex: 1, borderRightWidth: 3, borderRightColor: "#65B4FF", paddingRight: 8 }, replyToName: { color: "#90CEFF", fontSize: 10, fontWeight: "900", textAlign: "right" }, replyToText: { color: "#AABBD2", fontSize: 11, marginTop: 2, textAlign: "right" }, cancelReplyButton: { paddingHorizontal: 6, paddingVertical: 5 }, cancelReplyText: { color: "#A8C8E8", fontSize: 10, fontWeight: "800" }, composer: { flexDirection: "row", alignItems: "flex-end", gap: 9, padding: 12, paddingBottom: 18, borderTopWidth: 1, borderTopColor: "#193550", backgroundColor: "#0B1C31" }, input: { flex: 1, maxHeight: 108, minHeight: 46, borderRadius: 16, borderWidth: 1, borderColor: "#294B6D", backgroundColor: "#071526", color: "#EAF4FF", paddingHorizontal: 13, paddingVertical: 11, fontSize: 14 }, sendButton: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#65B4FF" }, pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] }, disabled: { opacity: 0.45 },
  forwardOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.62)" }, forwardSheet: { maxHeight: "72%", padding: 16, paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: "#0B1C31" }, forwardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: "#1D3854" }, forwardTitle: { color: "#F3F8FF", fontSize: 16, fontWeight: "900", textAlign: "right" }, forwardPreview: { maxWidth: 240, color: "#91A9C5", fontSize: 11, marginTop: 4, textAlign: "right" }, closeForwardButton: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, backgroundColor: "#173B60" }, closeForwardText: { color: "#CFE9FF", fontSize: 10, fontWeight: "800" }, forwardContact: { flexDirection: "row", gap: 11, alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#142B46" }, forwardAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#2A6EA8" }, forwardAvatarText: { color: "#F4FAFF", fontSize: 18, fontWeight: "900" }, forwardContactCopy: { flex: 1 }, forwardContactName: { color: "#EAF4FF", fontSize: 14, fontWeight: "800", textAlign: "right" }, forwardContactHandle: { color: "#8EA5C5", fontSize: 11, marginTop: 2, textAlign: "right" }, forwardEmpty: { color: "#91A9C5", fontSize: 12, lineHeight: 20, paddingVertical: 25, textAlign: "center" },
});
