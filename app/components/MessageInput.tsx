'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function MessageInput({ onSend, disabled = false, loading = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-300 dark:border-gray-600 focus-within:border-blue-500 transition-colors">
      <div className="flex items-end gap-3 p-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message SmartSpecs..."
          disabled={disabled || loading}
          className="flex-1 resize-none outline-none bg-transparent text-base placeholder-gray-400 dark:placeholder-gray-500 max-h-40 disabled:opacity-50"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={disabled || loading || !message.trim()}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Send message (Enter)"
        >
          <FaPaperPlane size={16} />
        </button>
      </div>
    </div>
  );
}
