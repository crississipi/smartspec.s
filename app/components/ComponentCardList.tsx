'use client';

import { Component } from '@/lib/types';
import { motion } from 'framer-motion';
import { getComponentIcon } from '@/lib/icons';

export default function ComponentCardList({ components }: { components: Component[] }) {
  if (!components || components.length === 0) return null;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {components.map((comp, idx) => {
        const IconComponent = getComponentIcon(comp.type?.toLowerCase() || 'default');
        return (
          <motion.div
            key={idx}
            className={`flex flex-col overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-color)] transition-all duration-250 hover:translate-y-[-4px] hover:shadow-lg hover:border-[#4A90E2] animate-fadeIn ${comp.is_upgrade ? 'border-l-3 border-l-[#4A90E2]' : ''}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            {/* Card Image Section */}
            <div className="relative flex h-30 w-full items-center justify-center overflow-hidden bg-[var(--secondary-bg)]">
              <span className="absolute top-2.5 left-2.5 z-10 inline-block rounded-md bg-[rgba(74,144,226,0.9)] px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
                {comp.type?.toUpperCase()}
              </span>
              {comp.image_url ? (
                <img src={comp.image_url} alt={comp.model} className="h-full w-full object-contain p-4 transition-transform hover:scale-105" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-10 border border-dashed border-[#b6c9f8] bg-gradient-to-b from-[#f7faff] to-[#eef4ff]">
                  <IconComponent size={48} className="text-[#37538f]" />
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="flex flex-1 flex-col gap-2.5 p-3.5">
              {/* Info Section */}
              <div className="flex-1">
                <div className="font-bold text-sm text-[var(--text-color)] leading-1.3">{comp.brand}</div>
                <div className="text-xs text-[var(--secondary-text)] leading-1.4 line-clamp-2 mt-0.5">{comp.model}</div>
                {comp.reason && <div className="text-2xs text-[var(--tertiary-text)] italic leading-1.3 line-clamp-2 mt-1">{comp.reason}</div>}
              </div>

              {/* Upgrade Info */}
              {comp.is_upgrade && comp.current_component && (
                <div className="flex flex-col gap-1.5 rounded-2 bg-[var(--secondary-bg)] p-2.5">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[var(--tertiary-text)] font-medium whitespace-nowrap">Current:</span>
                    <span className="text-[var(--secondary-text)] font-medium truncate">{comp.current_component}</span>
                  </div>
                  {comp.price_difference !== undefined && comp.price_difference !== null && (
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm ${comp.price_difference >= 0 ? 'text-[#28a745]' : 'text-[#dc3545]'}`}>
                        {comp.price_difference >= 0 ? '+' : ''}
                        {comp.currency} {comp.price_difference.toFixed(2)}
                      </span>
                      {comp.price_difference_percent !== undefined && comp.price_difference_percent !== null && (
                        <span className="text-2xs text-[var(--tertiary-text)]">({comp.price_difference_percent.toFixed(1)}%)</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Price Section */}
              <div className="flex items-baseline justify-between gap-2 border-t border-[var(--border-color)] pt-2">
                <span className="font-bold text-lg text-[#28a745]">{comp.currency} {comp.price?.toFixed(2)}</span>
                {comp.store_name && <span className="text-2xs text-[var(--tertiary-text)]">{comp.store_name}</span>}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {comp.source_url && (
                  <a 
                    href={comp.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2 bg-[#4A90E2] px-3 py-2 text-xs font-bold text-white transition-all hover:bg-[#357ABD] hover:translate-y-[-1px] disabled:opacity-50"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
