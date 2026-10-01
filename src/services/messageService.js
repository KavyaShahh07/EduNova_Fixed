// EduNova Peer Exchange Workspace Real-time Message Service
// Connected to PostgreSQL /api/exchanges/:id/messages and WebSocket real-time events

import { apiClient } from '../lib/apiClient';
import { getSocket } from '../lib/socketClient';

const MESSAGES_KEY = 'edunova_exchange_messages_v2';

const getLocalMessages = (exchangeId) => {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (raw) {
      const all = JSON.parse(raw);
      return all.filter((m) => m.exchangeId === exchangeId);
    }
  } catch (e) {
    console.error('Failed to load local messages', e);
  }
  return [];
};

const saveLocalMessage = (newMessage) => {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const all = raw ? JSON.parse(raw) : [];
    const exists = all.some((m) => m.id === newMessage.id);
    if (!exists) {
      all.push(newMessage);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
    }
  } catch (e) {}
};

/**
 * Fetch messages for a skill exchange room from PostgreSQL with local fallback
 */
export const getExchangeMessages = async (exchangeId) => {
  if (!exchangeId) return [];

  try {
    const response = await apiClient.get(`/exchanges/${exchangeId}/messages`);
    if (response && response.success && Array.isArray(response.data)) {
      // Cache messages locally
      response.data.forEach(saveLocalMessage);
      return response.data;
    }
  } catch (err) {
    console.warn(`[messageService] Remote fetch failed for exchange ${exchangeId}, using local cache:`, err.message);
  }

  return getLocalMessages(exchangeId);
};

/**
 * Send real-time message within a skill exchange to PostgreSQL and broadcast via Socket.IO
 */
export const sendExchangeMessage = async (
  exchangeId,
  text,
  senderId = 'current_user',
  senderName = 'Peer Scholar',
  avatar = ''
) => {
  if (!text || !text.trim()) return null;

  const optimisticMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    exchangeId,
    senderId,
    senderName,
    avatar,
    text: text.trim(),
    content: text.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };

  // 1. Optimistic local cache
  saveLocalMessage(optimisticMessage);

  // 2. Dispatch event for local listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('edunova_exchange_message_received', {
        detail: optimisticMessage,
      })
    );
  }

  // 3. Post to PostgreSQL backend API
  try {
    const res = await apiClient.post(`/exchanges/${exchangeId}/messages`, {
      text: text.trim(),
      content: text.trim(),
      senderName,
      avatar,
    });
    if (res && res.success && res.data) {
      saveLocalMessage(res.data);
      return res.data;
    }
  } catch (err) {
    console.warn('[messageService] Failed to send message to backend, saved optimistically:', err.message);
  }

  return optimisticMessage;
};

/**
 * Subscribe to real-time incoming messages for an exchange via WebSocket & CustomEvent
 */
export const subscribeToExchangeMessages = (exchangeId, onMessageReceived) => {
  if (typeof window === 'undefined') return () => {};

  const socket = getSocket();

  // Socket listener
  const handleSocketMessage = (msg) => {
    if (msg && (msg.exchangeId === exchangeId || !exchangeId)) {
      saveLocalMessage(msg);
      if (typeof onMessageReceived === 'function') {
        onMessageReceived(msg);
      }
    }
  };

  if (socket) {
    socket.on('exchange:message', handleSocketMessage);
    socket.on('message:received', handleSocketMessage);
    if (exchangeId) {
      socket.emit('join:conversation', { conversationId: exchangeId });
    }
  }

  // Window event listener (cross-component / optimistic updates)
  const handleWindowEvent = (event) => {
    const msg = event.detail;
    if (msg && msg.exchangeId === exchangeId) {
      if (typeof onMessageReceived === 'function') {
        onMessageReceived(msg);
      }
    }
  };

  window.addEventListener('edunova_exchange_message_received', handleWindowEvent);

  return () => {
    if (socket) {
      socket.off('exchange:message', handleSocketMessage);
      socket.off('message:received', handleSocketMessage);
    }
    window.removeEventListener('edunova_exchange_message_received', handleWindowEvent);
  };
};
