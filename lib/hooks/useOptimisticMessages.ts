'use client';

import { useState, useCallback, useRef } from 'react';

export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
  optimistic?: boolean;
}

/**
 * Hook for managing messages with optimistic updates
 * Shows message immediately while API call is in progress
 */
export function useOptimisticMessages(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const optimisticIdRef = useRef(0);

  // Add optimistic user message
  const addOptimisticMessage = useCallback(
    (content: string) => {
      const optimisticId = optimisticIdRef.current++;
      const optimisticMessage: Message = {
        id: undefined,
        role: 'user',
        content,
        optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      return optimisticId;
    },
    []
  );

  // Add loading indicator (AI response)
  const addLoadingMessage = useCallback(() => {
    const loadingMessage: Message = {
      id: undefined,
      role: 'assistant',
      content: '',
      loading: true,
      optimistic: true,
    };

    setMessages((prev) => [...prev, loadingMessage]);
  }, []);

  // Replace loading message with actual response
  const updateLoadingMessage = useCallback(
    (content: string, id?: number) => {
      setMessages((prev) => {
        const lastMessageIndex = prev.length - 1;
        if (
          lastMessageIndex >= 0 &&
          prev[lastMessageIndex].role === 'assistant' &&
          prev[lastMessageIndex].loading
        ) {
          return [
            ...prev.slice(0, lastMessageIndex),
            {
              ...prev[lastMessageIndex],
              id,
              content,
              loading: false,
              optimistic: false,
            },
          ];
        }
        return prev;
      });
    },
    []
  );

  // Remove optimistic message on error
  const removeOptimisticMessage = useCallback((optimisticId?: number) => {
    setMessages((prev) => prev.filter((msg) => !msg.optimistic));
  }, []);

  // Confirm optimistic message (update with real ID from server)
  const confirmOptimisticMessage = useCallback((optimisticId: number, id: number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.optimistic && msg.id === undefined ? { ...msg, id, optimistic: false } : msg
      )
    );
  }, []);

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (
      content: string,
      onSend: (content: string) => Promise<any>,
      onError?: (error: Error) => void
    ) => {
      setIsLoading(true);

      try {
        // Show optimistic user message
        addOptimisticMessage(content);

        // Show loading indicator
        addLoadingMessage();

        // Make API call
        const response = await onSend(content);

        // Update with real response
        if (response.success) {
          updateLoadingMessage(response.aiMessage?.content || '', response.aiMessage?.id);
        } else {
          throw new Error(response.message || 'Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);

        // Remove loading message
        removeOptimisticMessage();

        // Remove last optimistic user message
        setMessages((prev) => prev.slice(0, -2));

        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [addOptimisticMessage, addLoadingMessage, updateLoadingMessage, removeOptimisticMessage]
  );

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    addOptimisticMessage,
    addLoadingMessage,
    updateLoadingMessage,
    removeOptimisticMessage,
    confirmOptimisticMessage,
  };
}
