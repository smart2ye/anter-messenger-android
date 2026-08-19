import AsyncStorage from "@react-native-async-storage/async-storage";

const ANTER_API_URL_KEY = "anter-messenger.api-url";

export function normalizeAnterApiUrl(value: string): string | null {
  const candidate = value.trim().replace(/\/+$/, "");
  if (!candidate.startsWith("https://")) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

export async function loadAnterApiUrl(): Promise<string> {
  return (await AsyncStorage.getItem(ANTER_API_URL_KEY)) ?? "";
}

export async function saveAnterApiUrl(value: string): Promise<string> {
  const normalized = normalizeAnterApiUrl(value);
  if (!normalized) throw new Error("يجب استخدام رابط HTTPS صالح لخادم ANTER.");
  await AsyncStorage.setItem(ANTER_API_URL_KEY, normalized);
  return normalized;
}

