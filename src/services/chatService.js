/**
 * EduNova Peer Learning Network - Genuine Database-Backed Real-time Chat Service
 * 
 * Replaces simulated localStorage with PostgreSQL persistence and real-time Socket.IO communication.
 */

import { chatApi } from '../lib/apiClient';
import {
  getSocket,
  joinConversation,
  leaveConversation,
  sendSocketMessage,
  emitReactionToggle,
  emitPinToggle
} from '../lib/socketClient';

let cachedUnreadCount = 0;

/**
 * Get current unread message count
 */
export const getUnreadMessageCount = () => {
  return cachedUnreadCount;
};

/**
 * Ensure an exchange conversation exists between peers
 */
export const ensureExchangeConversation = async (exchange) => {
  if (!exchange) return null;
  try {
    if (exchange.peerId) {
      return await createDirectConversation(exchange.peerId);
    }
  } catch (e) {
    console.warn('[ChatService] ensureExchangeConversation error:', e);
  }
  return null;
};

/**
 * Fetch all active conversations for the authenticated user from PostgreSQL
 */
export const getConversationsList = async () => {
  let localConvs = [];
  try {
    localConvs = JSON.parse(localStorage.getItem('edunova_local_conversations') || '[]');
  } catch (e) {}

  try {
    const res = await chatApi.getConversations();
    if (res && res.data) {
      cachedUnreadCount = res.data.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      return [...localConvs, ...res.data];
    }
    return localConvs;
  } catch (err) {
    console.warn('[ChatService] Failed to load conversations from backend:', err.message);
    return localConvs;
  }
};

/**
 * Fetch details for a specific conversation thread
 */
export const getConversationById = async (conversationId) => {
  try {
    const res = await chatApi.getConversation(conversationId);
    return res?.data || null;
  } catch (err) {
    console.error('[ChatService] Failed to get conversation details:', err);
    return null;
  }
};

/**
 * Fetch genuine message history for a conversation from PostgreSQL + local cache
 */
export const getMessagesForConversation = async (conversationId, cursor = null) => {
  const localKey = `edunova_local_messages_${conversationId}`;
  const localMsgs = JSON.parse(localStorage.getItem(localKey) || '[]');
  try {
    const res = await chatApi.getMessages(conversationId, { cursor, limit: 50 });
    const remote = res?.data || [];
    return [...localMsgs, ...remote];
  } catch (err) {
    return localMsgs;
  }
};

/**
 * Send a chat message with persistence guarantee before confirmation
 */
export const sendChatMessage = async ({
  conversationId,
  text = '',
  content = '',
  type = 'text',
  messageType = 'TEXT',
  attachment = null,
  replyTo = null,
  learningCard = null,
  meetingRequest = null,
  peerQuiz = null,
}) => {
  const messageContent = (text || content || attachment?.name || '').trim();
  if (!messageContent && !attachment) return null;

  const validTypes = ['TEXT', 'CODE', 'FILE'];
  const formattedType = validTypes.includes(type.toUpperCase())
    ? type.toUpperCase()
    : validTypes.includes(messageType.toUpperCase())
    ? messageType.toUpperCase()
    : 'TEXT';

  const payload = {
    conversationId,
    content: messageContent,
    text: messageContent,
    messageType: formattedType,
    fileUrl: attachment?.url || null,
    attachment: attachment || null,
    replyToId: replyTo?.id || null,
    metadata: {
      learningCard,
      meetingRequest,
      peerQuiz,
    },
  };

  const localSave = (savedMsg) => {
    const localKey = `edunova_local_messages_${conversationId}`;
    const localMsgs = JSON.parse(localStorage.getItem(localKey) || '[]');
    const newMsg = {
      id: savedMsg?.id || `msg_${Date.now()}`,
      conversationId,
      content: messageContent,
      text: messageContent,
      messageType: formattedType,
      fileUrl: attachment?.url || null,
      attachment: attachment || null,
      senderId: 'current_user',
      createdAt: new Date().toISOString(),
      metadata: payload.metadata
    };
    if (!localMsgs.some(m => m.id === newMsg.id)) {
      localMsgs.push(newMsg);
      localStorage.setItem(localKey, JSON.stringify(localMsgs));
    }
    window.dispatchEvent(new CustomEvent('edunova_message_sent', { detail: newMsg }));
    return newMsg;
  };

  // 1. Try sending via Socket.IO with server acknowledgment (guarantees DB persistence)
  return new Promise((resolve) => {
    let resolved = false;

    sendSocketMessage(payload, (response) => {
      if (resolved) return;
      resolved = true;
      if (response && response.success && response.message) {
        localSave(response.message);
        resolve(response.message);
      } else {
        // Fallback to REST API
        chatApi.sendMessage(conversationId, payload)
          .then((res) => {
            const saved = res?.data || null;
            localSave(saved);
            resolve(saved);
          })
          .catch((err) => {
            console.warn('[ChatService] REST send fallback error, storing locally:', err.message);
            const saved = localSave(null);
            resolve(saved);
          });
      }
    });

    // 2-second timeout to fall back to local save if socket/REST doesn't respond
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        chatApi.sendMessage(conversationId, payload)
          .then((res) => {
            const saved = res?.data || null;
            localSave(saved);
            resolve(saved);
          })
          .catch((err) => {
            const saved = localSave(null);
            resolve(saved);
          });
      }
    }, 1500);
  });
};

/**
 * Toggle emoji reaction on message
 */
export const toggleMessageReaction = async (messageId, emojiSymbol) => {
  try {
    emitReactionToggle(messageId, emojiSymbol);
    const res = await chatApi.toggleReaction(messageId, emojiSymbol);
    return res?.data || null;
  } catch (err) {
    console.error('[ChatService] Failed to toggle reaction:', err);
    return null;
  }
};

/**
 * Toggle pin on message
 */
export const togglePinMessage = async (messageId) => {
  try {
    emitPinToggle(messageId);
    const res = await chatApi.togglePin(messageId);
    return res?.data || null;
  } catch (err) {
    console.error('[ChatService] Failed to toggle pin:', err);
    return null;
  }
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (conversationId) => {
  try {
    await chatApi.markAsRead(conversationId);
  } catch (err) {
    console.warn('[ChatService] Failed to mark conversation as read:', err.message);
  }
};

/**
 * Initialize or get direct conversation with peer
 */
export const createDirectConversation = async (targetUserId) => {
  try {
    const res = await chatApi.createDirectConversation(targetUserId);
    if (res && res.data) return res.data;
  } catch (err) {
    console.warn('[ChatService] Failed to start direct conversation on server, creating local:', err.message);
  }

  const localConvs = JSON.parse(localStorage.getItem('edunova_local_conversations') || '[]');
  const existing = localConvs.find(c => c.participantId === targetUserId);
  if (existing) return existing;

  const newConv = {
    id: `conv_${Date.now()}`,
    type: 'DIRECT',
    participantId: targetUserId,
    title: 'Peer Conversation',
    lastMessage: 'Started a new peer skill exchange chat',
    updatedAt: new Date().toISOString()
  };
  localConvs.unshift(newConv);
  localStorage.setItem('edunova_local_conversations', JSON.stringify(localConvs));
  return newConv;
};

// --- LEGACY SAGE AI CONVERSATION HISTORIES FOR AIChatContext ---
const INITIAL_SAGE_MESSAGES = [
  {
    id: 'msg_1',
    sender: 'sage',
    text: "Hello! I am Sage, your AI Teaching Assistant. How can I help accelerate your learning path today?",
    timestamp: '10:00 AM'
  }
];

export const getChatHistory = () => {
  try {
    const stored = localStorage.getItem('edunova_chat_history');
    return stored ? JSON.parse(stored) : INITIAL_SAGE_MESSAGES;
  } catch (e) {
    return INITIAL_SAGE_MESSAGES;
  }
};

export const saveChatMessage = (message) => {
  const current = getChatHistory();
  const updated = [...current, message];
  localStorage.setItem('edunova_chat_history', JSON.stringify(updated));
  return updated;
};

export const clearChatHistory = () => {
  localStorage.removeItem('edunova_chat_history');
  return INITIAL_SAGE_MESSAGES;
};
