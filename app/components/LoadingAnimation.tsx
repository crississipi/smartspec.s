'use client';

import { motion } from 'framer-motion';

interface LoadingAnimationProps {
  type?: 'typing' | 'spinner' | 'dots' | 'pulse';
  size?: 'small' | 'medium' | 'large';
  nightMode?: boolean;
  text?: string;
}

export default function LoadingAnimation({
  type = 'typing',
  size = 'medium',
  nightMode = false,
  text = 'Loading',
}: LoadingAnimationProps) {
  const sizeMap = {
    small: { width: 4, height: 4, spacing: 3 },
    medium: { width: 6, height: 6, spacing: 5 },
    large: { width: 8, height: 8, spacing: 7 },
  };

  const colors = {
    text: nightMode ? '#ececf1' : '#0d0d0d',
    dot: nightMode ? '#404052' : '#d1d5db',
  };

  const size_config = sizeMap[size];

  if (type === 'typing') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: size_config.width,
                height: size_config.height,
                backgroundColor: colors.dot,
              }}
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
        {text && (
          <span style={{ color: colors.text }} className="text-sm">
            {text}
          </span>
        )}
      </div>
    );
  }

  if (type === 'spinner') {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          className="rounded-full border-4"
          style={{
            width: size === 'small' ? 24 : size === 'medium' ? 32 : 40,
            height: size === 'small' ? 24 : size === 'medium' ? 32 : 40,
            borderColor: colors.dot,
            borderTopColor: nightMode ? '#ececf1' : '#0d0d0d',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        {text && (
          <span style={{ color: colors.text }} className="text-sm">
            {text}
          </span>
        )}
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: size_config.width,
                height: size_config.height,
                backgroundColor: colors.dot,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        {text && (
          <span style={{ color: colors.text }} className="text-sm">
            {text}
          </span>
        )}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          className="rounded-full"
          style={{
            width: size === 'small' ? 16 : size === 'medium' ? 24 : 32,
            height: size === 'small' ? 16 : size === 'medium' ? 24 : 32,
            backgroundColor: nightMode ? '#404052' : '#d1d5db',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
        {text && (
          <span style={{ color: colors.text }} className="text-sm">
            {text}
          </span>
        )}
      </div>
    );
  }

  return null;
}
