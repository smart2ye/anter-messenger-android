import Constants from "expo-constants";

import { loadAnterApiUrl } from "@/lib/anter-connection";
import { isNewerRelease } from "@/lib/messenger-release-utils";

export { isNewerRelease } from "@/lib/messenger-release-utils";

export type MessengerRelease = {
  version: string;
  downloadUrl: string;
  notes: string;
};

export function currentMessengerVersion(): string {
  return Constants.expoConfig?.version ?? "1.1.0";
}

export async function fetchOfficialMessengerRelease(): Promise<MessengerRelease> {
  const baseUrl = await loadAnterApiUrl();
  const response = await fetch(new URL("/api/messenger/release", baseUrl).toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("تعذر التحقق من التحديث الآن.");
  return response.json() as Promise<MessengerRelease>;
}
