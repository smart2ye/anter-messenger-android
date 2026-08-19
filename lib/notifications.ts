import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { incomingCallNotificationContent } from "@/lib/notification-content";

const CALL_CHANNEL_ID = "anter-incoming-calls";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestMessengerNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CALL_CHANNEL_ID, {
      name: "مكالمات ANTER الواردة",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 140, 250],
      lightColor: "#52A7FF",
      sound: "default",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const finalStatus = current.status === "granted"
    ? current.status
    : (await Notifications.requestPermissionsAsync()).status;
  return finalStatus === "granted";
}

export async function scheduleIncomingCallPreview(name: string): Promise<boolean> {
  const granted = await requestMessengerNotificationPermission();
  if (!granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: { ...incomingCallNotificationContent(name), sound: "default" },
    trigger: Platform.OS === "android" ? { channelId: CALL_CHANNEL_ID } : null,
  });
  return true;
}
