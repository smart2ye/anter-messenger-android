import AsyncStorage from "@react-native-async-storage/async-storage";

const ANTER_API_URL_KEY = "anter-messenger.api-url";

export class AnterConnectionError extends Error {
  readonly retryable: boolean;

  constructor(message: string, { retryable = false }: { retryable?: boolean } = {}) {
    super(message);
    this.name = "AnterConnectionError";
    this.retryable = retryable;
  }
}

type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
  shouldRetry?: (error: unknown) => boolean;
};

const wait = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));

export function shouldRetryAnterRequest(error: unknown): boolean {
  if (error instanceof AnterConnectionError) return error.retryable;
  return error instanceof TypeError;
}

function displayConnectionError(error: unknown): Error {
  if (error instanceof AnterConnectionError) return error;
  if (error instanceof TypeError) {
    return new AnterConnectionError(
      "تعذر الوصول إلى خادم ANTER. تحقق من اتصال الإنترنت ورابط الخادم ثم أعد المحاولة.",
      { retryable: true },
    );
  }
  return error instanceof Error ? error : new Error("تعذر تنفيذ طلب الاتصال بخادم ANTER.");
}

/**
 * يعيد المحاولة للعمليات الآمنة عند فشل شبكة مؤقت أو استجابة خادم قابلة للإعادة.
 * لا يعيد محاولة أخطاء المصادقة أو الصلاحيات أو الطلبات التي لا يصح تكرارها.
 */
export async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  {
    maxAttempts = 3,
    baseDelayMs = 500,
    sleep = wait,
    shouldRetry = shouldRetryAnterRequest,
  }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;
  const attempts = Math.max(1, maxAttempts);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !shouldRetry(error)) throw displayConnectionError(error);
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw displayConnectionError(lastError);
}

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
