import { useEffect, useState } from 'react';
import type { FlowiseChatSessionSummary } from '@/shared/lib/flowiseApi';
import {
  fetchFlowiseChatHistory,
  listFlowiseChatSessions,
  deleteFlowiseChat,
} from '@/shared/lib/flowiseApi';
import { logError, logInfo, logSuccess } from '@/shared/lib/logger';

export interface SimpleMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface UseChatSessionParams {
  flowiseUrl: string;
  agentId?: string;
  apiKey?: string;
  walletAddress?: string;
  onHistoryLoaded?: (messages: SimpleMessage[]) => void;
}

export const useChatSession = ({
  flowiseUrl,
  agentId,
  apiKey,
  walletAddress,
  onHistoryLoaded,
}: UseChatSessionParams) => {
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [chatIdInput, setChatIdInput] = useState('');
  const [sessions, setSessions] = useState<FlowiseChatSessionSummary[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionsRefreshKey, setSessionsRefreshKey] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Clear chat state on wallet changes
  useEffect(() => {
    if (!walletAddress) {
      setChatId(undefined);
      setHistoryLoaded(false);
      return;
    }
    setHistoryLoaded(false);
  }, [walletAddress]);

  // Load sessions and auto-select latest if none selected
  useEffect(() => {
    const loadSessions = async () => {
      if (!agentId) return;
      const list = await listFlowiseChatSessions(flowiseUrl, agentId, apiKey);
      const filtered = walletAddress
        ? list.filter((s) => s.chatId.startsWith(walletAddress))
        : list;
      setSessions(filtered);
      if (!chatId && filtered.length > 0) {
        setChatId(filtered[0].chatId);
        setHistoryLoaded(false);
      }
    };
    loadSessions();
  }, [
    agentId,
    apiKey,
    walletAddress,
    flowiseUrl,
    sessionsRefreshKey,
    chatId,
    showSessions,
  ]);

  // Load history on chatId change
  useEffect(() => {
    const loadHistory = async () => {
      if (!agentId || !chatId || historyLoaded) return;
      try {
        const history = await fetchFlowiseChatHistory(
          flowiseUrl,
          agentId,
          chatId,
          apiKey
        );
        const parsed: SimpleMessage[] = history.map((h, idx) => ({
          id: `${Date.now()}-${idx}`,
          text: String(h.text || h.message || h.content || ''),
          isUser: String(h.role || '').toLowerCase() === 'user',
          timestamp: new Date(h.createdAt || Date.now()),
        }));
        onHistoryLoaded?.(parsed);
      } catch (e) {
        logError('Failed to load chat history (hook)', e);
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadHistory();
  }, [agentId, apiKey, chatId, flowiseUrl, historyLoaded, onHistoryLoaded]);

  const handleNewChat = () => {
    if (!walletAddress) return;
    const newId = `${walletAddress}:${Date.now().toString(36)}`;
    setChatId(newId);
    setHistoryLoaded(true); // empty chat
    logInfo('New chat created', { chatId: newId, agentId });
  };

  const handleDeleteChat = async () => {
    if (!chatId || !agentId) return;
    const ok = await deleteFlowiseChat(flowiseUrl, agentId, chatId, apiKey);
    if (ok) {
      logSuccess('Chat deleted', { chatId });
      setHistoryLoaded(true);
      // refresh sessions
      setSessionsRefreshKey((x) => x + 1);
    } else {
      logError('Failed to delete chat', { chatId });
    }
  };

  const handleLoadChat = () => {
    if (!chatIdInput.trim()) return;
    setChatId(chatIdInput.trim());
    setHistoryLoaded(false);
    logInfo('Load chat requested', { chatId: chatIdInput.trim(), agentId });
  };

  return {
    // state
    chatId,
    setChatId,
    chatIdInput,
    setChatIdInput,
    sessions,
    showSessions,
    setShowSessions,
    historyLoaded,

    // actions
    refreshSessions: () => setSessionsRefreshKey((x) => x + 1),
    handleNewChat,
    handleDeleteChat,
    handleLoadChat,
  } as const;
};
