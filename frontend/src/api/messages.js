// src/api/messages.js
import api from './index';

// Fetch all conversations (last message per partner)
export const fetchConversations = () =>
  api('/messages/conversations', { method: 'GET' });

// Fetch full message history with one user
export const fetchMessages = otherId =>
  api(`/messages/${otherId}`, { method: 'GET' });

// Send a new message
export const sendMessage = (to, text) =>
  api('/messages', { method: 'POST', body: { to, text } });
