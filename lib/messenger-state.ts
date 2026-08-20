export type ConversationState = "online" | "away";

export type ConversationSummary = {
  id: string;
  name: string;
  handle: string;
  preview: string;
  updatedLabel: string;
  state: ConversationState;
  unreadCount?: number;
  sentByMe?: boolean;
};

export type ChatMessage = {
  id: string;
  body: string;
  from: "me" | "other" | "system";
  time: string;
  isRead?: boolean;
  serverId?: number;
  parent?: { id: number; body: string; from: "me" | "other"; isDeletedEveryone: boolean };
};

export const assistantConversation: ConversationSummary = {
  id: "anter-assistant",
  name: "مساعد أنتر",
  handle: "@anter_assistant",
  preview: "مرحباً، كيف يمكنني مساعدتك داخل شبكة ANTER؟",
  updatedLabel: "متصل الآن",
  state: "online",
};

export const assistantMessages: ChatMessage[] = [
  {
    id: "welcome",
    body: "مرحباً بك في ANTER Messenger. هذه مساحة مراسلتك الخاصة داخل شبكة ANTER.",
    from: "other",
    time: "الآن",
  },
  {
    id: "privacy",
    body: "لن تصبح الرسائل متصلة بحسابك إلا بعد ربط خادم ANTER من الإعدادات.",
    from: "system",
    time: "الآن",
  },
];

export function canStartConversation(mutualFollow: boolean) {
  return mutualFollow;
}
