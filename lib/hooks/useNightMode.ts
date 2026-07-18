'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseNightModeOptions {
  storageKey?: string;
  syncWithServer?: boolean;
}

/**
 * Hook for managing night mode preference with persistence
 */
export function useNightMode(options: UseNightModeOptions = {}) {
  const { storageKey = 'smartspecs-night-mode', syncWithServer = true } = options;
  const [nightMode, setNightModeSate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setNightModeSate(JSON.parse(stored));
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load night mode preference:', err);
      setError('Failed to load preference');
      setIsLoading(false);
    }
  }, [storageKey]);

  // Update localStorage when nightMode changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nightMode));
      document.documentElement.classList.toggle('dark', nightMode);
    } catch (err) {
      console.error('Failed to save night mode preference:', err);
      setError('Failed to save preference');
    }
  }, [nightMode, storageKey]);

  // Sync with server
  const syncWithServerFn = useCallback(async () => {
    if (!syncWithServer) return;

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nightMode }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync with server');
      }
    } catch (err) {
      console.error('Failed to sync night mode with server:', err);
      setError('Failed to sync with server');
    }
  }, [nightMode, syncWithServer]);

  // Sync when nightMode changes
  useEffect(() => {
    if (!isLoading) {
      syncWithServerFn();
    }
  }, [nightMode, isLoading, syncWithServerFn]);

  const toggle = useCallback(() => {
    setNightModeSate((prev) => !prev);
  }, []);

  return {
    nightMode,
    setNightMode: setNightModeSate,
    toggle,
    isLoading,
    error,
  };
}
