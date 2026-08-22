import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { buildBrowserAuthorizationUrl } from "@/lib/browser-auth-url";
import { loadAnterApiUrl } from "@/lib/anter-connection";
import { exchangeBrowserAuthorization } from "@/lib/anter-mobile-api";

const BROWSER_AUTH_STATE_KEY = "anter-messenger.browser-auth-state";
const AUTH_CALLBACK_PATH = "auth/callback";

function callbackUrl(): string {
  return Linking.createURL(AUTH_CALLBACK_PATH, { scheme: "anter-messenger" });
}

export async function startAnterBrowserLogin() {
  const [baseUrl, state] = await Promise.all([loadAnterApiUrl(), Promise.resolve(Crypto.randomUUID())]);
  const redirectUri = callbackUrl();
  await AsyncStorage.setItem(BROWSER_AUTH_STATE_KEY, state);
  const result = await WebBrowser.openAuthSessionAsync(
    buildBrowserAuthorizationUrl(baseUrl, redirectUri, state),
    redirectUri,
    { showTitle: true, toolbarColor: "#26104F" },
  );
  return result;
}

export async function completeAnterBrowserLogin(code: string, state: string) {
  const expectedState = await AsyncStorage.getItem(BROWSER_AUTH_STATE_KEY);
  if (!expectedState || expectedState !== state) {
    throw new Error("تعذر التحقق من عودة تسجيل الدخول. أعد المحاولة من تطبيق Messenger.");
  }

  const user = await exchangeBrowserAuthorization(code, state, callbackUrl());
  await AsyncStorage.removeItem(BROWSER_AUTH_STATE_KEY);
  return user;
}
