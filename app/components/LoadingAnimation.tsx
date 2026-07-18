'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  messageType?: 'greeting' | 'build' | 'search' | 'tips' | 'upgrade' | 'price_update' | 'general';
  requestId?: string | null;
  nightMode?: boolean;
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

export default function LoadingAnimation({ messageType = 'general', requestId, nightMode = false }: LoadingAnimationProps) {
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
      style={{ margin: '1rem 0' }}
    >
      <div 
        style={{
          backgroundColor: nightMode ? '#1a1a1a' : '#f3f4f6',
          borderRadius: '1.125rem',
          padding: '1.5rem',
          maxWidth: '32rem',
        }}
      >
        {/* Spinner */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              style={{
                width: '0.5rem',
                height: '0.5rem',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
              }}
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
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span 
              style={{
                fontSize: '0.875rem',
                color: nightMode ? '#b4b4bc' : '#374151',
              }}
            >
              {displayedText}
            </span>
            <motion.span
              style={{
                display: 'inline-block',
                width: '0.125rem',
                height: '1rem',
                backgroundColor: '#3b82f6',
                marginLeft: '0.25rem',
              }}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Skeleton Strip - Component Cards Preview */}
        <div style={{ display: 'flex', gap: '0.75rem', overflow: 'hidden' }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              style={{
                flexShrink: 0,
                width: '8rem',
                height: '6rem',
                backgroundColor: nightMode ? '#2a2a2a' : '#d1d5db',
                borderRadius: '0.5rem',
              }}
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
