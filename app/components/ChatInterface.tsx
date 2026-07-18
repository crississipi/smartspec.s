'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FaBars, FaTimes, FaPlus, FaMoon, FaSun, FaSignOutAlt, FaEllipsisV, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Notification from './Notification';

interface ChatInterfaceProps {
  user: any;
  nightMode: boolean;
  setNightMode: (val: boolean) => void;
  onLogout: () => void;
}

export default function ChatInterface({ user, nightMode, setNightMode, onLogout }: ChatInterfaceProps) {
  const [threads, setThreads] = useState<any[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredThreadId, setHoveredThreadId] = useState<number | null>(null);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (currentThreadId) {
      loadThreadMessages(currentThreadId);
    }
  }, [currentThreadId]);

  const loadThreads = async () => {
    try {
      const res = await fetch('/api/threads');
      const data = await res.json();
      if (data.success) {
        setThreads(data.threads);
        if (data.threads.length > 0 && !currentThreadId) {
          setCurrentThreadId(data.threads[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load threads:', error);
    }
  };

  const loadThreadMessages = async (threadId: number) => {
    try {
      const res = await fetch(`/api/threads?id=${threadId}`);
      const data = await res.json();
      if (data.success) {
        // Parse structured data for recommendations
        const parsedMessages = data.thread.messages.map((msg: any) => {
          if (msg.dataType === 'recommendation' || msg.dataType === 'upgrade_suggestion') {
            try {
              // Only parse if content is actually JSON (starts with { or [)
              if (msg.content && typeof msg.content === 'string' && 
                  (msg.content.trim().startsWith('{') || msg.content.trim().startsWith('['))) {
                msg.data = JSON.parse(msg.content);
              } else {
                // If content is not JSON, treat as regular text
                msg.dataType = 'text';
              }
            } catch (e) {
              console.error('Failed to parse message data:', e);
              // Keep as text message if parsing fails
              msg.dataType = 'text';
            }
          }
          return msg;
        });
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    if (!currentThreadId) {
      // Create new thread
      try {
        const res = await fetch('/api/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: content.substring(0, 50) }),
        });
        const data = await res.json();
        if (data.success) {
          setCurrentThreadId(data.thread.id);
          await loadThreads();
          // Send message to new thread
          setTimeout(() => sendMessage(data.thread.id, content), 100);
        }
      } catch (error) {
        console.error('Failed to create thread:', error);
      }
    } else {
      await sendMessage(currentThreadId, content);
    }
  };

  const sendMessage = async (threadId: number, content: string) => {
    // Add user message immediately
    const tempUserMsg = { id: Date.now(), role: 'user' as const, content };
    setMessages((prev) => [...prev, tempUserMsg]);

    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, message: content }),
      });

      const data = await res.json();
      if (data.success) {
        // Parse AI message data if structured
        const aiMessage = data.ai_message;
        if (aiMessage.data_type === 'recommendation' || aiMessage.data_type === 'upgrade_suggestion') {
          aiMessage.data = aiMessage.data; // Already parsed from API
        }
        
        setMessages((prev) => {
          // Remove temp message and add real messages
          const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
          return [
            ...withoutTemp,
            { ...data.user_message, role: 'user' as const },
            { ...aiMessage, role: 'assistant' as const, dataType: aiMessage.data_type },
          ];
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  const deleteThread = async (threadId: number) => {
    try {
      const res = await fetch(`/api/threads?id=${threadId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setThreads(threads.filter((t) => t.id !== threadId));
        if (currentThreadId === threadId) {
          setCurrentThreadId(threads.length > 1 ? threads[0].id : null);
        }
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0a0a]">
      {/* Sidebar */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-gray-800 flex flex-col"
        style={{ overflow: 'hidden' }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={async () => {
              const res = await fetch('/api/threads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'New Chat' }),
              });
              const data = await res.json();
              if (data.success) {
                await loadThreads();
                setCurrentThreadId(data.thread.id);
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <FaPlus size={16} />
            <span className="text-sm font-medium">New chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-2">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onMouseEnter={() => setHoveredThreadId(thread.id)}
              onMouseLeave={() => setHoveredThreadId(null)}
              className="mb-2 relative"
            >
              <div
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 justify-between group ${
                  currentThreadId === thread.id
                    ? 'bg-gray-200 dark:bg-gray-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-900'
                }`}
              >
                <button
                  onClick={() => setCurrentThreadId(thread.id)}
                  className="flex-1 text-left"
                >
                  <span className="text-sm truncate block">{thread.title}</span>
                </button>
                {hoveredThreadId === thread.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(thread.id);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0"
                  >
                    <FaTrash size={14} className="text-gray-500 hover:text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <button
            onClick={async () => {
              const newMode = !nightMode;
              setNightMode(newMode);
              // Save preference to database
              try {
                await fetch('/api/user', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nightMode: newMode }),
                });
              } catch (error) {
                console.error('Failed to save theme preference:', error);
              }
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          >
            {nightMode ? <FaSun size={16} /> : <FaMoon size={16} />}
            <span>{nightMode ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate flex-1">{user?.email}</span>
            </button>
            {profileMenuOpen && (
              <div className="absolute bottom-full w-full mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <FaSignOutAlt size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
          >
            {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <h1 className="text-lg font-semibold">SmartSpecs</h1>
          <div className="w-8" />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentThreadId && messages.length === 0 && !loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <h2 className="text-3xl font-bold mb-4">SmartSpecs AI</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                Get personalized PC component recommendations. Start a conversation with your budget and requirements.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  'Gaming PC under PHP 30,000',
                  'Workstation for video editing',
                  'Budget office setup',
                  'Upgrade my RAM',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
                  >
                    <span className="text-sm">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] p-4">
          <div className="max-w-4xl mx-auto">
            <MessageInput onSend={handleSendMessage} disabled={loading} loading={loading} />
          </div>
        </div>
      </div>

      <Notification />
    </div>
  );
}
