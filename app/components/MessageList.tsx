'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import LoadingAnimation from './LoadingAnimation';
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

export default function MessageList({ messages, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Get the last user message for detecting loading animation type
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];
  const loadingMessageType = lastUserMessage ? detectMessageType(lastUserMessage.content) : 'general';

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={message.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'user' ? (
              <div className="max-w-2xl rounded-lg px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            ) : (
              <div className="max-w-full w-full">
                {(message.dataType === 'recommendation' || message.dataType === 'upgrade_suggestion') && message.data ? (
                  <RecommendationDisplay data={message.data} />
                ) : message.dataType === 'recommendation' || message.dataType === 'upgrade_suggestion' ? (
                  <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-lg px-4 py-3 text-yellow-900 dark:text-yellow-100">
                    <p className="text-sm">Unable to display recommendation (data format error)</p>
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-100">
                    <div
                      className="prose dark:prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {isLoading && <LoadingAnimation messageType={loadingMessageType as any} />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

// Simple markdown parser
function parseMarkdown(text: string): string {
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
        result.push('<ul class="list-disc list-inside my-2 space-y-1">');
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
        result.push('<p class="mb-2">' + line + '</p>');
      }
    }
  }

  if (inUl) result.push('</ul>');

  return result.join('\n');
}
