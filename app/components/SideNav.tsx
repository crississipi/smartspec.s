'use client';

import { FaPlus, FaInfo } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Thread {
  id: number;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SideNavProps {
  threads: Thread[];
  currentThreadId: number | null;
  onSelectThread: (id: number) => void;
  onCreateThread: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SideNav({
  threads,
  currentThreadId,
  onSelectThread,
  onCreateThread,
  isOpen,
  onClose,
}: SideNavProps) {
  return (
    <motion.div
      className={`hidden md:flex md:w-1/5 md:flex-col md:overflow-hidden md:border-l md:border-gray-200 md:bg-white md:text-gray-900 md:dark:bg-gray-900 md:dark:text-gray-100 md:dark:border-gray-800 md:relative md:transition-all md:duration-300 md:shadow-sm md:py-6 md:px-2.5 ${isOpen ? 'absolute right-0 z-50 w-64 max-h-96' : ''}`}
      initial={isOpen ? { x: -300 } : { x: 0 }}
      animate={isOpen ? { x: 0 } : { x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* New Conversation Button */}
      <button 
        className="flex items-center gap-2.5 rounded-lg border border-gray-300 bg-gray-100 px-6 py-2 mb-6 text-center font-medium text-gray-900 transition-all hover:scale-105 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
        onClick={onCreateThread} 
        title="Create new conversation"
      >
        <FaPlus /> New Conversation
      </button>

      {/* Threads Label */}
      <span className="my-6 ml-0 mb-1 text-xs font-medium uppercase tracking-widest text-gray-600 dark:text-gray-400">Threads</span>

      {/* Conversations Holder */}
      <div className="flex h-full flex-col gap-2.5 overflow-hidden pb-5 text-inherit bg-inherit">
        {threads.length === 0 ? (
          <button 
            className="flex items-center gap-2.5 rounded-md border-2 border-transparent h-8 px-3 bg-inherit text-inherit font-normal whitespace-nowrap overflow-hidden text-ellipsis disabled:opacity-50"
            disabled
          >
            No conversations yet
          </button>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              className={`flex items-center gap-2.5 rounded-md border-2 border-transparent h-8 px-3 bg-inherit text-inherit font-normal whitespace-nowrap overflow-hidden text-ellipsis transition-all ${
                thread.id === currentThreadId 
                  ? 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100' 
                  : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              }`}
              onClick={() => {
                onSelectThread(thread.id);
                onClose();
              }}
              title={thread.title}
            >
              {thread.title}
            </button>
          ))
        )}
      </div>

      {/* Info Button */}
      <button 
        className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-transparent z-50 hover:scale-110 focus:scale-110 focus:border-gray-400 text-gray-700 dark:text-gray-300"
        title="About SmartSpecs"
      >
        <FaInfo />
      </button>
    </motion.div>
  );
}
