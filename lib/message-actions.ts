export type MessageActionKey = "reply" | "forward" | "delete";

export function getVisibleMessageActions(options: { isLive: boolean; hasServerMessage: boolean }): MessageActionKey[] {
  if (!options.isLive || !options.hasServerMessage) return ["reply"];
  return ["reply", "forward", "delete"];
}

export function canDeleteForEveryone(from: "me" | "other" | "system"): boolean {
  return from === "me";
}
