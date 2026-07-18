'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
  nightMode?: boolean;
}

export default function MessageInput({ onSend, disabled = false, loading = false, nightMode = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const theme = {
    light: {
      bg: '#ffffff',
      border: '#d1d5db',
      text: '#0d0d0d',
      placeholder: '#9ca3af',
    },
    dark: {
      bg: '#1a1a1a',
      border: '#404052',
      text: '#ececf1',
      placeholder: '#6b7280',
    },
  };

  const current = nightMode ? theme.dark : theme.light;

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
    <div 
      style={{
        backgroundColor: current.bg,
        borderRadius: '0.5rem',
        border: `1px solid ${current.border}`,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', padding: '0.75rem' }}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message SmartSpecs..."
          disabled={disabled || loading}
          style={{
            flex: 1,
            resize: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: current.text,
            fontSize: '1rem',
            maxHeight: '200px',
            fontFamily: 'inherit',
            border: 'none',
            opacity: disabled || loading ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
          } as React.CSSProperties}
          rows={1}
        />
        <style>{`
          textarea::placeholder {
            color: ${current.placeholder};
            opacity: 1;
          }
          textarea::-webkit-input-placeholder {
            color: ${current.placeholder};
            opacity: 1;
          }
          textarea:-moz-placeholder {
            color: ${current.placeholder};
            opacity: 1;
          }
          textarea::-moz-placeholder {
            color: ${current.placeholder};
            opacity: 1;
          }
        `}</style>
        <button
          onClick={handleSend}
          disabled={disabled || loading || !message.trim()}
          style={{
            padding: '0.5rem',
            borderRadius: '0.5rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            cursor: disabled || loading || !message.trim() ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled || loading || !message.trim() ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled && !loading && message.trim()) {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
          title="Send message (Enter)"
        >
          <FaPaperPlane size={16} />
        </button>
      </div>
    </div>
  );
}
