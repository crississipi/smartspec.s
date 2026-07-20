'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import LoadingAnimation from './LoadingAnimation';
import AIResponseDisplay from './AIResponseDisplay';
import RecommendationDisplay from './RecommendationDisplay';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  dataType?: string;
  data?: any;
  loading?: boolean;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  nightMode?: boolean;
}

function detectMessageType(content: string): string {
  const lower = content.toLowerCase();
  if (/(hi|hello|hey|good\s*(morning|afternoon|evening)|sup|yo|what'?s?\s*up)\b/.test(lower) && content.length < 30) {
    return 'greeting';
  }
  if (/(update|refresh|latest|current|recheck)\s+(?:all\s+)?(?:component\s+)?prices?/.test(lower)) {
    return 'price_update';
  }
  if (/(build|recommend|suggest|pc\s*build|gaming\s*setup|workstation)/i.test(lower)) {
    return 'build';
  }
  if (/(best|top|compare|find|search|gpu|cpu|ram|motherboard)/i.test(lower)) {
    return 'search';
  }
  if (/(how\s*to|tip|trick|hack|advice|fix|troubleshoot)/i.test(lower)) {
    return 'tips';
  }
  if (/(upgrade|replace|swap|better|improve)/i.test(lower)) {
    return 'upgrade';
  }
  return 'general';
}

export default function MessageList({ messages, isLoading = false, nightMode = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Get the last user message for detecting loading animation type
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];
  const loadingMessageType = lastUserMessage ? detectMessageType(lastUserMessage.content) : 'general';

  return (
    <div 
      style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: nightMode ? '#0d0d0d' : '#ffffff',
        color: nightMode ? '#ececf1' : '#0d0d0d',
      }}
    >
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((message, index) => (
          <motion.div
            key={message.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {message.role === 'user' ? (
              <div 
                style={{
                  maxWidth: '32rem',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                }}
              >
                <p 
                  style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.5rem',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.content}
                </p>
              </div>
            ) : (
              <div style={{ maxWidth: '100%', width: '100%' }}>
                {(message.dataType === 'recommendation' || message.dataType === 'upgrade_suggestion') && message.data ? (
                  <AIResponseDisplay data={message.data} dataType={message.dataType} nightMode={nightMode} />
                ) : message.dataType === 'recommendation' || message.dataType === 'upgrade_suggestion' ? (
                  <div 
                    style={{
                      backgroundColor: nightMode ? 'rgba(194, 120, 49, 0.1)' : '#fef3c7',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      color: nightMode ? '#fcd34d' : '#92400e',
                    }}
                  >
                    <p style={{ fontSize: '0.875rem' }}>Unable to display recommendation (data format error)</p>
                  </div>
                ) : (
                  <div 
                    style={{
                      backgroundColor: nightMode ? '#1a1a1a' : '#f3f4f6',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      color: nightMode ? '#ececf1' : '#111827',
                    }}
                  >
                    <div
                      style={{ fontSize: '0.875rem' }}
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content, nightMode) }}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <LoadingAnimation type="typing" size="medium" nightMode={nightMode} text="Generating recommendation..." />
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// Simple markdown parser
function parseMarkdown(text: string, nightMode: boolean = false): string {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Lists
  const lines = html.split('\n');
  let result: string[] = [];
  let inUl = false;

  for (let line of lines) {
    const ulMatch = line.match(/^\s*[-•*]\s+(.+)/);
    if (ulMatch) {
      if (!inUl) {
        result.push(`<ul style="list-style: disc; margin-left: 1.25rem; margin-top: 0.5rem; margin-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.25rem;">`);
        inUl = true;
      }
      result.push('<li>' + ulMatch[1] + '</li>');
    } else {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (line.trim() === '') {
        result.push('<br>');
      } else {
        result.push('<p style="margin-bottom: 0.5rem;">' + line + '</p>');
      }
    }
  }

  if (inUl) result.push('</ul>');

  return result.join('\n');
}
