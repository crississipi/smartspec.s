'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  message: string;
  type: NotificationType;
  visible: boolean;
}

// Global notification emitter
let notifyFn: (message: string, type: NotificationType) => void;

export function notify(message: string, type: NotificationType = 'info') {
  if (notifyFn) notifyFn(message, type);
}

export default function Notification() {
  const [state, setState] = useState<NotificationState>({ message: '', type: 'info', visible: false });

  useEffect(() => {
    notifyFn = (message, type) => {
      setState({ message, type, visible: true });
      setTimeout(() => setState((prev) => ({ ...prev, visible: false })), 4000);
    };
  }, []);

  const iconMap = {
    success: <FaCheckCircle className="flex-shrink-0" />,
    error: <FaExclamationTriangle className="flex-shrink-0" />,
    info: <FaInfoCircle className="flex-shrink-0" />,
  };

  const bgClasses = {
    success: 'bg-emerald-600 dark:bg-emerald-700',
    error: 'bg-red-600 dark:bg-red-700',
    info: 'bg-blue-600 dark:bg-blue-700',
  };

  return (
    <AnimatePresence>
      {state.visible && (
        <motion.div
          className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${bgClasses[state.type]}`}
          initial={{ opacity: 0, y: 20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          {iconMap[state.type]}
          <span className="text-sm font-medium max-w-xs">{state.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}