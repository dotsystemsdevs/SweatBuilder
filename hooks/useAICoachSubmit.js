import { useCallback, useRef, useState } from "react";
import { haptic } from "../utils/haptics";
import { formatMessageTimestamp } from "../utils/dateFormatters";
import { generateId } from "../utils/idGenerator";
import { MAX_CHAT_LENGTH } from "../constants/appConstants";
import { getDummyResponse } from "../__mocks__/aiResponses";

export function useAICoachSubmit({ addMessage, createNewChat, selectChat, currentChatId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const timeoutRef = useRef(null);

  const abort = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (text, { retry = false } = {}) => {
      const trimmed = text?.trim();
      if (!trimmed || loading) return;

      if (!currentChatId) {
        const newId = createNewChat();
        if (newId) selectChat(newId);
        else return;
      }

      if (trimmed.length > MAX_CHAT_LENGTH) {
        haptic("notificationError");
        return;
      }

      haptic("impactLight");
      const userMsg = {
        id: generateId(),
        text: trimmed,
        role: "user",
        isAI: false,
        timestamp: formatMessageTimestamp(),
        streaming: false,
      };

      if (!retry) {
        addMessage(userMsg);
        setLastPrompt(trimmed);
      }

      setLoading(true);
      setError(false);
      setErrorMessage(null);

      // Simulate API delay with dummy response
      const delay = 800 + Math.random() * 700;
      timeoutRef.current = setTimeout(() => {
        const reply = getDummyResponse(trimmed);

        const aiMsg = {
          id: generateId(),
          text: reply,
          role: "assistant",
          isAI: true,
          timestamp: formatMessageTimestamp(),
          streaming: false,
        };

        addMessage(aiMsg);
        setLoading(false);
        haptic("impactLight");
      }, delay);
    },
    [addMessage, createNewChat, selectChat, currentChatId, loading]
  );

  return {
    sendMessage,
    loading,
    error,
    errorMessage,
    setError,
    lastPrompt,
    abort,
  };
}

export default useAICoachSubmit;
