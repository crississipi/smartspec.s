'use client';

import { motion } from 'framer-motion';

export type LoaderType = 'spinner' | 'dots' | 'skeleton' | 'shimmer' | 'pulse';
export type LoaderSize = 'sm' | 'md' | 'lg';

interface LoaderProps {
  type?: LoaderType;
  size?: LoaderSize;
  message?: string;
  fullScreen?: boolean;
}

interface SkeletonProps {
  width?: string;
  height?: string;
  count?: number;
  circle?: boolean;
  className?: string;
}

// Spinner loader - rotating circle
function SpinnerLoader({ size = 'md' }: { size?: LoaderSize }) {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`${sizeMap[size]} border-4 border-gray-200 dark:border-gray-700 border-t-emerald-600 dark:border-t-emerald-500 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// Dots loader - bouncing dots
function DotsLoader({ size = 'md' }: { size?: LoaderSize }) {
  const sizeMap = {
    sm: 'w-2 h-2 mx-1',
    md: 'w-3 h-3 mx-1.5',
    lg: 'w-4 h-4 mx-2',
  };

  const dotVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  return (
    <div className="flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeMap[size]} bg-emerald-600 dark:bg-emerald-500 rounded-full`}
          variants={dotVariants}
          animate="animate"
          transition={{ delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

// Shimmer/wave loader - animated gradient
function ShimmerLoader({ size = 'md' }: { size?: LoaderSize }) {
  const heightMap = {
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
  };

  return (
    <motion.div
      className={`${heightMap[size]} w-32 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700`}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        backgroundSize: '200% 100%',
      }}
    />
  );
}

// Pulse loader - pulsing circle
function PulseLoader({ size = 'md' }: { size?: LoaderSize }) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`${sizeMap[size]} border-2 border-emerald-600 dark:border-emerald-500 rounded-full`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Skeleton loader - placeholder for content
export function Skeleton({ width = 'w-full', height = 'h-4', count = 1, circle = false, className = '' }: SkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`${width} ${height} ${circle ? 'rounded-full' : 'rounded-lg'} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 mb-3`}
          animate={{
            backgroundPosition: ['200% 0', '-200% 0'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 100%',
          }}
        />
      ))}
    </div>
  );
}

// Main Loader component
export default function Loader({ type = 'spinner', size = 'md', message, fullScreen = false }: LoaderProps) {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      {type === 'spinner' && <SpinnerLoader size={size} />}
      {type === 'dots' && <DotsLoader size={size} />}
      {type === 'shimmer' && <ShimmerLoader size={size} />}
      {type === 'pulse' && <PulseLoader size={size} />}
      {type === 'skeleton' && <Skeleton count={3} />}

      {message && (
        <motion.p
          className="text-sm text-gray-600 dark:text-gray-400 text-center"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-8">{loaderContent}</div>;
}

// Loading card skeleton
export function LoadingCard() {
  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Skeleton width="w-2/3" height="h-6" />
      <Skeleton width="w-full" height="h-4" count={3} />
      <Skeleton width="w-1/2" height="h-4" />
    </motion.div>
  );
}

// Loading message bubble
export function LoadingMessage() {
  return (
    <motion.div
      className="flex gap-3 mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex-shrink-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
        />
      </div>
      <motion.div
        className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-3"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Skeleton width="w-32" height="h-4" />
      </motion.div>
    </motion.div>
  );
}

// Loading recommendations skeleton
export function LoadingRecommendations() {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Skeleton width="w-1/3" height="h-8" className="mb-4" />
      
      {/* Three tier cards */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
        >
          <Skeleton width="w-1/2" height="h-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex gap-4">
                <Skeleton width="w-16 h-16" height="h-16" circle className="flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="w-3/4" height="h-4" />
                  <Skeleton width="w-1/2" height="h-3" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton width="w-full" height="h-10" />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Page loading skeleton
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <Loader type="spinner" size="lg" message={message} />
    </div>
  );
}
