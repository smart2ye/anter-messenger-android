import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { AnterConnectionError, fetchWithRetry, loadAnterApiUrl } from "@/lib/anter-connection";
import { buildMobileApiUrl } from "@/lib/mobile-api-paths";

const TOKEN_KEY = "anter-messenger.access-token";
const PROFILE_KEY = "anter-messenger.profile";

export type AnterMobileUser = {
  id: number;
  username: string;
  name: string;
  avatar: string;
  isOnline: boolean;
};

export type AnterMobileMessage = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  parentId: number | null;
  parent: { id: number; senderId: number; content: string; isDeletedEveryone: boolean } | null;
};

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") return typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    sessionStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureRemove(key: string): Promise<void> {
  if (Platform.OS === "web") {
    sessionStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

async function getBaseUrl(): Promise<string> {
  const baseUrl = await loadAnterApiUrl();
  if (!baseUrl) throw new Error("أدخل رابط HTTPS لخادم ANTER من الإعدادات أولاً.");
  return baseUrl;
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new AnterConnectionError(payload.error || "انتهت جلسة ANTER أو لا تملك صلاحية هذا الطلب.");
    }
    if (response.status === 408 || response.status === 429 || response.status >= 500) {
      throw new AnterConnectionError(
        payload.error || "خادم ANTER غير متاح مؤقتاً. سيُعاد المحاولة تلقائياً للطلبات الآمنة.",
        { retryable: true },
      );
    }
    throw new AnterConnectionError(payload.error || "تعذر تنفيذ طلب ANTER.");
  }
  return payload;
}

async function authorizedRequest(path: string, init?: RequestInit) {
  const [baseUrl, token] = await Promise.all([getBaseUrl(), secureGet(TOKEN_KEY)]);
  if (!token) throw new Error("سجّل الدخول إلى ANTER من الإعدادات أولاً.");
  const execute = async () => {
    const response = await fetch(buildMobileApiUrl(baseUrl, path), {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
    return parseResponse(response);
  };

  // لا نعيد محاولة الإرسال أو الحذف تلقائياً حتى لا تتكرر رسائل أو إجراءات المستخدم.
  return (init?.method ?? "GET").toUpperCase() === "GET" ? fetchWithRetry(execute) : execute();
}

export async function loginToAnter(identifier: string, password: string) {
  const baseUrl = await getBaseUrl();
  const response = await fetch(buildMobileApiUrl(baseUrl, "/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ identifier, password, deviceName: "ANTER Messenger Android" }),
  });
  const payload = await parseResponse(response);
  await secureSet(TOKEN_KEY, payload.accessToken);
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(payload.user));
  return payload.user as AnterMobileUser;
}

export async function getSavedMobileProfile(): Promise<AnterMobileUser | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnterMobileUser;
  } catch {
    return null;
  }
}

export async function listLiveConversations() {
  const payload = await authorizedRequest("/conversations");
  return payload.conversations as Array<{ user: AnterMobileUser; latestMessage: AnterMobileMessage; unreadCount: number }>;
}

export async function listLiveContacts() {
  const payload = await authorizedRequest("/contacts");
  return payload.contacts as AnterMobileUser[];
}

export async function listLiveMessages(username: string, afterId = 0) {
  const payload = await authorizedRequest(`/conversations/${encodeURIComponent(username)}/messages?afterId=${afterId}`);
  return payload as { user: AnterMobileUser; messages: AnterMobileMessage[] };
}

export async function sendLiveMessage(username: string, content: string, parentId?: number) {
  const payload = await authorizedRequest(`/conversations/${encodeURIComponent(username)}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, ...(parentId ? { parentId } : {}) }),
  });
  return payload.message as AnterMobileMessage;
}

export async function deleteLiveMessage(messageId: number, scope: "me" | "everyone") {
  return authorizedRequest(`/messages/${messageId}`, {
    method: "DELETE",
    body: JSON.stringify({ scope }),
  }) as Promise<{ success: boolean; scope: "me" | "everyone" }>;
}

export async function forwardLiveMessage(messageId: number, targetUsername: string) {
  return authorizedRequest(`/messages/${messageId}/forward`, {
    method: "POST",
    body: JSON.stringify({ targetUsername }),
  }) as Promise<{ success: boolean; message: AnterMobileMessage }>;
}

export async function getConversationActivity(username: string) {
  return authorizedRequest(`/conversations/${encodeURIComponent(username)}/activity`) as Promise<{ isTyping: boolean }>;
}

export async function clearLiveAssistantMemory(username: string) {
  return authorizedRequest(`/conversations/${encodeURIComponent(username)}/assistant-memory/clear`, {
    method: "POST",
  }) as Promise<{ success: boolean; message: string }>;
}

export async function updateConversationTyping(username: string, isTyping: boolean) {
  return authorizedRequest(`/conversations/${encodeURIComponent(username)}/typing`, {
    method: "POST",
    body: JSON.stringify({ isTyping }),
  }) as Promise<{ isTyping: boolean }>;
}

export async function hasLiveSession(): Promise<boolean> {
  return Boolean(await secureGet(TOKEN_KEY));
}

export async function logoutFromAnter(): Promise<void> {
  try {
    await authorizedRequest("/auth/logout", { method: "POST" });
  } finally {
    await secureRemove(TOKEN_KEY);
    await AsyncStorage.removeItem(PROFILE_KEY);
  }
}
