export function incomingCallNotificationContent(name: string) {
  return {
    title: "مكالمة واردة عبر ANTER",
    body: `${name} يتصل بك الآن`,
    data: { url: "/chat/anter-assistant", kind: "incoming-call" },
  };
}

