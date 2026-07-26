import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Mail, User, Info, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import api from '../services/api';

export default function Messages() {
  const { user: currentUser } = useAuth();
  const { subscribeToMessages } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeContactUsername = searchParams.get('to') || null;

  const [conversations, setConversations] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const { data } = await api.get('/api/messages/conversations');
      setConversations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchChatHistory = async (username) => {
    setLoadingChat(true);
    try {
      const { data } = await api.get(`/api/messages/user/${username}`);
      setChatHistory(data);
      // Mark read
      await api.post(`/api/messages/read/${username}`);
      // Refresh conversations list to clear badges
      fetchConversations();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeContactUsername) {
      fetchChatHistory(activeContactUsername);
    } else {
      setChatHistory([]);
    }
  }, [activeContactUsername]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Listen to WebSocket messages
  useEffect(() => {
    return subscribeToMessages((newMessage) => {
      // 1. If message belongs to the open chat, append it
      const isOpenChat =
        (newMessage.senderUsername === activeContactUsername &&
          newMessage.receiverUsername === currentUser.username) ||
        (newMessage.senderUsername === currentUser.username &&
          newMessage.receiverUsername === activeContactUsername);

      if (isOpenChat) {
        setChatHistory((prev) => [...prev, newMessage]);
        // Call read endpoint since we are viewing it
        if (newMessage.senderUsername === activeContactUsername) {
          api.post(`/api/messages/read/${activeContactUsername}`).catch(() => {});
        }
      }

      // 2. Refresh conversations inbox to get latest messages and badges
      fetchConversations();
    });
  }, [activeContactUsername, currentUser, subscribeToMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeContactUsername) return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      const { data } = await api.post('/api/messages', {
        receiverUsername: activeContactUsername,
        content
      });

      // Append locally for instant updates
      setChatHistory((prev) => [...prev, data]);
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const selectConversation = (username) => {
    setSearchParams({ to: username });
  };

  const activeContact = conversations.find((c) => c.contact.username === activeContactUsername)?.contact;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 h-[calc(100vh-100px)] flex gap-4">
      {/* Conversations List Panel */}
      <div className="w-1/3 glass-panel border border-white/5 rounded-2xl flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-white/5 shrink-0 flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-white">Direct Messages</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {loadingConversations && conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">No conversations started yet</div>
          ) : (
            conversations.map((c) => {
              const isActive = c.contact.username === activeContactUsername;
              return (
                <div
                  key={c.contact.id}
                  onClick={() => selectConversation(c.contact.username)}
                  className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-white'
                      : 'bg-transparent border-transparent hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={c.contact.profilePictureUrl}
                      alt={c.contact.username}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate mr-2">
                        {c.contact.displayName}
                      </span>
                      <span className="text-[9px] text-slate-500 whitespace-nowrap shrink-0">
                        {new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.lastMessage.content}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="bg-indigo-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 self-center">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Chat Box */}
      <div className="flex-1 glass-panel border border-white/5 rounded-2xl flex flex-col overflow-hidden h-full">
        {activeContactUsername ? (
          <>
            {/* Contact Header */}
            <div className="p-4 border-b border-white/5 shrink-0 flex items-center justify-between bg-white/2">
              <div className="flex items-center gap-3">
                <img
                  src={activeContact?.profilePictureUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + activeContactUsername}
                  alt={activeContactUsername}
                  className="w-9 h-9 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h4 className="font-semibold text-xs text-white">
                    {activeContact?.displayName || activeContactUsername}
                  </h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
            </div>

            {/* Chat History Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/20">
              {loadingChat && chatHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">Loading history...</div>
              ) : (
                chatHistory.map((msg) => {
                  const isSentByMe = msg.senderUsername === currentUser.username;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl py-2.5 px-4 text-xs ${
                          isSentByMe
                            ? 'bg-indigo-500 text-white rounded-tr-none'
                            : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <span className="text-[8px] text-slate-400 mt-1 block text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Message Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 shrink-0 flex gap-2">
              <input
                type="text"
                placeholder="Write a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-slate-950/40 border border-white/5 focus:border-indigo-500/50 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/20 text-white rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6">
            <Mail className="w-10 h-10 text-slate-600 mb-2 animate-bounce" />
            <h3 className="font-semibold text-slate-300 text-sm">Open a Conversation</h3>
            <p className="text-xs text-slate-500 text-center max-w-xs mt-1">
              Select a contact from the inbox list, or find users in the Explore tab to start messaging in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
