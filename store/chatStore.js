import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { MAX_CHATS_TOTAL, MAX_PINNED_CHATS, MAX_CHAT_TITLE_LENGTH, MIN_CHAT_TITLE_LENGTH } from "../constants/appConstants";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { getStorageItem, setStorageItem } from "../utils/storage";
import { logError } from "../utils/errorHandler";
import { generateId } from "../utils/idGenerator";
import { formatMessageTimestamp, getCurrentTimestamp } from "../utils/dateFormatters";
import { getInitialChats, FORCE_DUMMY_DATA } from "../__mocks__/chatData";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [chats, setChats] = useState(() => getInitialChats());
  const [currentChatId, setCurrentChatId] = useState(null);
  const [pinnedIds, setPinnedIds] = useState([]);

  // Load chats from storage on mount (skip if forcing dummy data)
  useEffect(() => {
    if (FORCE_DUMMY_DATA) return; // Skip storage load for design testing
    const loadData = async () => {
      const stored = await getStorageItem(STORAGE_KEYS.AI_COACH_CHATS);
      if (stored) {
        setChats(stored.chats || []);
        setPinnedIds(stored.pinnedIds || []);
      }
    };
    loadData();
  }, []);

  // Load chats from storage (public method)
  const loadChats = useCallback(async () => {
    if (FORCE_DUMMY_DATA) return; // Skip for design testing
    const stored = await getStorageItem(STORAGE_KEYS.AI_COACH_CHATS);
    if (stored) {
      setChats(stored.chats || []);
      setPinnedIds(stored.pinnedIds || []);
    }
  }, []);

  // Save chats to storage
  const saveChats = useCallback(async (newChats, newPinned) => {
    const pinnedToSave = newPinned !== undefined ? newPinned : pinnedIds;
    const success = await setStorageItem(STORAGE_KEYS.AI_COACH_CHATS, {
      chats: newChats,
      pinnedIds: pinnedToSave,
    });

    if (success) {
      setChats(newChats);
      setPinnedIds(pinnedToSave);
    } else {
      logError("ChatStore", new Error("Failed to save chats"));
      throw new Error("Failed to save chats");
    }
  }, [pinnedIds]);

  // Create new chat (max 5 total chats - 4 pinned + 1 other)
  const createNewChat = useCallback(() => {
    const timestamp = getCurrentTimestamp();
    const newChat = {
      id: generateId(),
      title: "New Chat",
      messages: [],  // Start empty - welcome UI shows in the screen
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Keep max 5 chats total (4 pinned + 1 other)
    // Remove oldest unpinned chat if we have 5 chats
    let updatedChats = [newChat, ...chats];
    if (updatedChats.length > MAX_CHATS_TOTAL) {
      // Find unpinned chats (excluding the new one)
      const unpinnedChats = updatedChats
        .filter(c => c.id !== newChat.id && !pinnedIds.includes(c.id))
        .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
      
      // Remove oldest unpinned chat
      if (unpinnedChats.length > 0) {
        updatedChats = updatedChats.filter(c => c.id !== unpinnedChats[0].id);
      } else {
        // If all are pinned, remove oldest pinned (shouldn't happen but safety)
        const sortedPinned = updatedChats
          .filter(c => c.id !== newChat.id && pinnedIds.includes(c.id))
          .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
        if (sortedPinned.length > 0) {
          updatedChats = updatedChats.filter(c => c.id !== sortedPinned[0].id);
        }
      }
    }

    saveChats(updatedChats, pinnedIds);
    setCurrentChatId(newChat.id);
    return newChat.id;
  }, [chats, saveChats, pinnedIds]);

  // Get current chat
  const getCurrentChat = useCallback(() => {
    if (!currentChatId) return null;
    return chats.find((c) => c.id === currentChatId);
  }, [currentChatId, chats]);

  // Add message to current chat
  const addMessage = useCallback(
    (message) => {
      if (!currentChatId) {
        return;
      }

      const updatedChats = chats.map((chat) => {
        if (chat.id === currentChatId) {
          const newMessages = [...chat.messages, message];

          // Auto-generate title from first user message
          let newTitle = chat.title;
          if (chat.title === "New Chat" && !message.isAI) {
            // Smart truncation: try to break at word boundary
            if (message.text.length <= MAX_CHAT_TITLE_LENGTH) {
              newTitle = message.text;
            } else {
              const truncated = message.text.slice(0, MAX_CHAT_TITLE_LENGTH);
              const lastSpace = truncated.lastIndexOf(" ");
              newTitle = lastSpace > MIN_CHAT_TITLE_LENGTH
                ? truncated.slice(0, lastSpace) + "..."
                : truncated + "...";
            }
          }

          return {
            ...chat,
            messages: newMessages,
            title: newTitle,
            updatedAt: getCurrentTimestamp(),
          };
        }
        return chat;
      });

      saveChats(updatedChats, pinnedIds);
    },
    [currentChatId, chats, saveChats, pinnedIds]
  );

  // Delete chat
  const deleteChat = useCallback(
    async (chatId) => {
      const updatedChats = chats.filter((c) => c.id !== chatId);
      const updatedPinned = pinnedIds.filter((id) => id !== chatId);

      try {
        await saveChats(updatedChats, updatedPinned);

        if (currentChatId === chatId) {
          setCurrentChatId(null);
        }
      } catch (error) {
        logError("ChatStore", error, { context: "deleteChat", chatId });
      }
    },
    [chats, currentChatId, saveChats, pinnedIds]
  );

  // Select chat
  const selectChat = useCallback((chatId) => {
    setCurrentChatId(chatId);
  }, []);

  // Pin/unpin chat (max 4 pinned)
  // If pinning when at max, automatically unpins the oldest pinned chat
  const togglePinChat = useCallback(
    async (chatId) => {
      let nextPinned;
      if (pinnedIds.includes(chatId)) {
        // Unpin: remove from pinned list
        nextPinned = pinnedIds.filter((id) => id !== chatId);
      } else {
        // Pin: add to beginning, remove oldest if at max
        nextPinned = [chatId, ...pinnedIds];
        if (nextPinned.length > MAX_PINNED_CHATS) {
          // Keep only the MAX_PINNED_CHATS most recently pinned (first MAX_PINNED_CHATS)
          nextPinned = nextPinned.slice(0, MAX_PINNED_CHATS);
        }
      }
      await saveChats(chats, nextPinned);
    },
    [pinnedIds, chats, saveChats]
  );

  const pinnedChats = useMemo(() => {
    return pinnedIds
      .map((id) => chats.find((c) => c.id === id))
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [pinnedIds, chats]);

  const value = useMemo(
    () => ({
      chats,
      currentChatId,
      pinnedIds,
      pinnedChats,
      createNewChat,
      getCurrentChat,
      addMessage,
      deleteChat,
      selectChat,
      loadChats,
      togglePinChat,
    }),
    [
      chats,
      currentChatId,
      pinnedIds,
      pinnedChats,
      createNewChat,
      getCurrentChat,
      addMessage,
      deleteChat,
      selectChat,
      loadChats,
      togglePinChat,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatStore() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatStore must be used within ChatProvider");
  }
  return ctx;
}
