import { useCallback, useRef, useState } from "react";
import { haptic } from "../utils/haptics";
import { formatMessageTimestamp } from "../utils/dateFormatters";
import { generateId } from "../utils/idGenerator";
import { MAX_CHAT_LENGTH } from "../constants/appConstants";
import { chat } from "../services/api";

export function useAICoachSubmit({ addMessage, createNewChat, selectChat, currentChatId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const abortRef = useRef(false);

  const abort = useCallback(() => {
    abortRef.current = true;
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
      abortRef.current = false;

      try {
        const response = await chat(trimmed);

        // Check if aborted during request
        if (abortRef.current) return;

        let reply = "Något gick fel. Försök igen.";
        if (response?.ok && response?.data?.reply) {
          reply = response.data.reply;
        } else if (!response?.ok) {
          setError(true);
          setErrorMessage(response?.error || "Kunde inte nå servern");
        }

        const aiMsg = {
          id: generateId(),
          text: reply,
          role: "assistant",
          isAI: true,
          timestamp: formatMessageTimestamp(),
          streaming: false,
        };

        addMessage(aiMsg);
        haptic("impactLight");
      } catch (err) {
        if (!abortRef.current) {
          setError(true);
          setErrorMessage("Nätverksfel");
          const errorMsg = {
            id: generateId(),
            text: "Kunde inte ansluta till servern. Försök igen.",
            role: "assistant",
            isAI: true,
            timestamp: formatMessageTimestamp(),
            streaming: false,
          };
          addMessage(errorMsg);
        }
      } finally {
        setLoading(false);
      }
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
