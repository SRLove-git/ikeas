export const CHAT_STORAGE_KEY = "buzud-support-chat-v1"
export const CONVERSATION_STORAGE_KEY = "buzud-support-conversation-v1"
export const CHAT_OPEN_STORAGE_KEY = "buzud-support-open-v1"
export const SUPPORT_CHAT_RESET_EVENT = "buzud:support-chat-reset"

const CHAT_IDENTITY_STORAGE_KEY = "buzud-support-identity-v1"

function clearSupportChatData() {
  window.sessionStorage.removeItem(CHAT_STORAGE_KEY)
  window.sessionStorage.removeItem(CONVERSATION_STORAGE_KEY)
  window.sessionStorage.removeItem(CHAT_OPEN_STORAGE_KEY)
}

/**
 * Isolates chat history and the remote conversation identifier between accounts in one tab.
 * Token refreshes keep the same identity and therefore preserve the current conversation.
 */
export function setSupportChatIdentity(userId: string | null) {
  if (typeof window === "undefined") return
  const nextIdentity = userId ? `user:${userId}` : "anonymous"
  let changed = true
  try {
    const currentIdentity = window.sessionStorage.getItem(CHAT_IDENTITY_STORAGE_KEY)
    changed = currentIdentity !== nextIdentity
    if (changed) {
      clearSupportChatData()
    }
    window.sessionStorage.setItem(CHAT_IDENTITY_STORAGE_KEY, nextIdentity)
  } catch {
    // Session storage can be unavailable in private browsing; no persistent chat remains then.
  }
  if (changed) {
    window.dispatchEvent(new Event(SUPPORT_CHAT_RESET_EVENT))
  }
}
