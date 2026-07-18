'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  messageType?: 'greeting' | 'build' | 'search' | 'tips' | 'upgrade' | 'price_update' | 'general';
  requestId?: string | null;
}

const loadingPhases = {
  greeting: ['Thinking', 'Preparing a response'],
  build: [
    'Thinking',
    'Analyzing your requirements',
    'Browsing through the internet',
    'Searching for the latest components',
    'Comparing prices across stores',
    'Checking part compatibility',
    'Optimizing for your budget',
    'Finalizing recommendations',
  ],
  search: [
    'Thinking',
    'Understanding your search',
    'Browsing through the internet',
    'Searching across multiple stores',
    'Comparing prices and availability',
    'Verifying product details',
    'Preparing your results',
  ],
  tips: [
    'Thinking',
    'Analyzing your request',
    'Researching solutions',
    'Gathering expert recommendations',
    'Generating response',
  ],
  upgrade: [
    'Thinking',
    'Analyzing your current setup',
    'Browsing through the internet',
    'Searching for compatible upgrades',
    'Comparing upgrade options',
    'Evaluating performance improvements',
    'Finalizing suggestions',
  ],
  price_update: [
    'Reading component data files',
    'Checking product pages for current prices',
    'Updating verified prices',
    'Recalculating pricing ranges',
    'Finalizing component data update',
  ],
  general: ['Thinking', 'Analyzing your request', 'Browsing through the internet', 'Generating response'],
};

export default function LoadingAnimation({ messageType = 'general', requestId }: LoadingAnimationProps) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [currentText, setCurrentText] = useState('');

  const phases = loadingPhases[messageType] || loadingPhases.general;

  useEffect(() => {
    const text = phases[currentPhaseIndex];
    setCurrentText(text);
    setDisplayedText('');
    setIsTyping(true);

    let charIndex = 0;
    const typingSpeed = 50 + Math.random() * 30 - 15;

    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.substring(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);

        // Move to next phase after pause
        setTimeout(() => {
          setCurrentPhaseIndex((prev) => (prev + 1) % phases.length);
        }, 1500);
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, [currentPhaseIndex, phases]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="ai-input my-4"
    >
      <div className="loading-bubble bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 max-w-2xl">
        {/* Spinner */}
        <div className="loading-spinner flex gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Typing Animation */}
        <div className="typing-container mb-4">
          <div className="typing-animation-wrapper flex items-center">
            <span className="typing-text text-sm text-gray-700 dark:text-gray-300">{displayedText}</span>
            <motion.span
              className="typing-cursor inline-block w-0.5 h-4 bg-blue-500 ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Skeleton Strip - Component Cards Preview */}
        <div className="loading-skeleton-strip flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="loading-skeleton-card flex-shrink-0 w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
