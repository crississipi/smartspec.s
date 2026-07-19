'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { FaBars, FaTimes, FaPlus, FaMoon, FaSun, FaSignOutAlt, FaEllipsisV, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Notification from './Notification';
import LoadingAnimation from './LoadingAnimation';
import { generateChatTitle, updateThreadTitle } from '@/lib/title-generator';

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
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [hoveredThreadId, setHoveredThreadId] = useState<number | null>(null);
  const [isAIResponding, setIsAIResponding] = useState(false);

  // Theme colors
  const theme = {
    light: {
      bg: '#ffffff',
      bgSecondary: '#f7f7f8',
      text: '#0d0d0d',
      textSecondary: '#565869',
      border: '#e5e7eb',
      sidebar: '#ffffff',
      hover: '#f7f7f8',
    },
    dark: {
      bg: '#0d0d0d',
      bgSecondary: '#1a1a1a',
      text: '#ececf1',
      textSecondary: '#b4b4bc',
      border: '#404052',
      sidebar: '#111111',
      hover: '#1a1a1a',
    },
  };

  const current = nightMode ? theme.dark : theme.light;

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (currentThreadId) {
      loadThreadMessages(currentThreadId);
    }
  }, [currentThreadId]);

  const loadThreads = async () => {
    setThreadsLoading(true);
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
    } finally {
      setThreadsLoading(false);
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

    // Generate title from first message if this is a new thread with default title
    const currentThread = threads.find(t => t.id === threadId);
    if (currentThread && (currentThread.title === 'New Chat' || currentThread.title.length > 47)) {
      const generatedTitle = generateChatTitle(content);
      await updateThreadTitle(threadId, generatedTitle);
      // Update local thread list
      setThreads(threads.map(t => 
        t.id === threadId ? { ...t, title: generatedTitle } : t
      ));
    }

    setLoading(true);
    setIsAIResponding(true);
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
      setIsAIResponding(false);
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
    <div 
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: current.bg,
        color: current.text,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Sidebar */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: current.sidebar,
          borderRight: `1px solid ${current.border}`,
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Header */}
        <div 
          style={{
            borderBottom: `1px solid ${current.border}`,
            padding: '1rem',
          }}
        >
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
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: nightMode ? '#2a2a2a' : '#f7f7f8',
              color: current.text,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = nightMode ? '#333333' : '#ececf1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = nightMode ? '#2a2a2a' : '#f7f7f8';
            }}
          >
            <FaPlus size={16} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>New chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem',
          }}
        >
          {threadsLoading ? (
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
              <LoadingAnimation type="dots" size="small" nightMode={nightMode} text="Loading chats..." />
            </div>
          ) : threads.length === 0 ? (
            <div 
              style={{
                padding: '1rem',
                textAlign: 'center',
                color: current.textSecondary,
                fontSize: '0.875rem',
              }}
            >
              No conversations yet
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                onMouseEnter={() => setHoveredThreadId(thread.id)}
                onMouseLeave={() => setHoveredThreadId(null)}
                style={{
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'space-between',
                    backgroundColor: 
                      currentThreadId === thread.id 
                        ? (nightMode ? '#2a2a2a' : '#ececf1')
                        : 'transparent',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <button
                    onClick={() => setCurrentThreadId(thread.id)}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: current.text,
                      fontSize: '0.875rem',
                      padding: 0,
                    }}
                  >
                    <span 
                      style={{
                        fontSize: '0.875rem',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {thread.title}
                    </span>
                  </button>
                  {hoveredThreadId === thread.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteThread(thread.id);
                      }}
                      style={{
                        padding: '0.25rem',
                        background: 'none',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        color: '#ef4444',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = nightMode ? '#2a2a2a' : '#f0f0f0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div 
          style={{
            padding: '1rem',
            borderTop: `1px solid ${current.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
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
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              borderRadius: '0.5rem',
              backgroundColor: 'transparent',
              color: current.text,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = current.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {nightMode ? <FaSun size={16} /> : <FaMoon size={16} />}
            <span>{nightMode ? 'Light mode' : 'Dark mode'}</span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                borderRadius: '0.5rem',
                backgroundColor: 'transparent',
                color: current.text,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = current.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div 
                style={{
                  width: '1.5rem',
                  height: '1.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span 
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {user?.email}
              </span>
            </button>

            {profileMenuOpen && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  width: '100%',
                  marginBottom: '0.5rem',
                  backgroundColor: current.sidebar,
                  border: `1px solid ${current.border}`,
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <button
                  onClick={onLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    color: '#dc2626',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = current.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '4rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            borderBottom: `1px solid ${current.border}`,
            backgroundColor: current.bg,
            color: current.text,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              color: current.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = current.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <h1 style={{ fontSize: '1.125rem', fontWeight: '600' }}>SmartSpecs</h1>
          <div style={{ width: '2rem' }} />
        </div>

        {/* Messages Area */}
        <div 
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: current.bg,
            color: current.text,
          }}
        >
          {currentThreadId && messages.length === 0 && !loading ? (
            <div 
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '1rem',
              }}
            >
              <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                SmartSpecs AI
              </h2>
              <p 
                style={{
                  color: current.textSecondary,
                  marginBottom: '2rem',
                  maxWidth: '28rem',
                }}
              >
                Get personalized PC component recommendations. Start a conversation with your budget and requirements.
              </p>
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  width: '100%',
                  maxWidth: '56rem',
                }}
              >
                {[
                  'Gaming PC under PHP 30,000',
                  'Workstation for video editing',
                  'Budget office setup',
                  'Upgrade my RAM',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: `1px solid ${current.border}`,
                      backgroundColor: 'transparent',
                      color: current.text,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = current.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : loading && messages.length === 0 ? (
            <div 
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LoadingAnimation type="spinner" size="medium" nightMode={nightMode} text="Starting new conversation..." />
            </div>
          ) : (
            <MessageList messages={messages} isLoading={isAIResponding || loading} nightMode={nightMode} />
          )}
        </div>

        {/* Input Area */}
        <div 
          style={{
            borderTop: `1px solid ${current.border}`,
            backgroundColor: current.bg,
            padding: '1rem',
          }}
        >
          <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
            <MessageInput 
              onSend={handleSendMessage} 
              disabled={loading} 
              loading={loading}
              nightMode={nightMode}
            />
          </div>
        </div>
      </div>

      <Notification />
    </div>
  );
}
