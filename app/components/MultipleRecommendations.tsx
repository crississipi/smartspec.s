'use client';

import { motion } from 'framer-motion';

export default function MultipleRecommendations({ data }: { data: Record<string, any> }) {
  if (!data || Object.keys(data).length === 0) return null;

  const getTierColor = (tierName: string) => {
    if (tierName === 'budget') return 'border-l-4 border-l-[#28a745]';
    if (tierName === 'balanced') return 'border-l-4 border-l-[#4A90E2]';
    if (tierName === 'premium') return 'border-l-4 border-l-[#d4a017]';
    return 'border-l-4 border-l-gray-400';
  };

  const getTierHeaderColor = (tierName: string) => {
    if (tierName === 'budget') return 'text-[#28a745]';
    if (tierName === 'balanced') return 'text-[#4A90E2]';
    if (tierName === 'premium') return 'text-[#d4a017]';
    return 'text-gray-500';
  };

  return (
    <div className="mt-6 border-t border-[var(--border-color)] pt-5">
      <h4 className="text-base font-bold mb-4 text-[var(--text-color)]">Build Options</h4>
      <div className="flex flex-col gap-5">
        {Object.entries(data).map(([tierName, tierData]) => (
          <motion.div
            key={tierName}
            className={`rounded-[14px] border border-[var(--border-color)] bg-[var(--secondary-bg)] p-5 transition-all hover:shadow-lg ${getTierColor(tierName)}`}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Tier Header */}
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <h5 className={`text-base font-bold m-0 ${getTierHeaderColor(tierName)}`}>
                {tierData.build_name || tierName.charAt(0).toUpperCase() + tierName.slice(1)}
              </h5>
              <span className="rounded-2 bg-[rgba(40,167,69,0.08)] px-3 py-1 text-base font-bold text-[#28a745]">
                {tierData.total_cost ? `$${tierData.total_cost.toFixed(2)}` : 'N/A'}
              </span>
            </div>

            {/* Components Grid */}
            <div className="mb-3.5 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
              {tierData.components?.map((comp: any, idx: number) => (
                <div key={idx} className="flex flex-col overflow-hidden rounded-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] transition-all hover:translate-y-[-3px] hover:shadow-md">
                  {/* Card Image */}
                  <div className="relative flex h-[110px] items-center justify-center overflow-hidden bg-[var(--secondary-bg)]">
                    <span className="absolute top-1.5 left-1.5 z-10 inline-block rounded-1 bg-[rgba(74,144,226,0.9)] px-2 py-0.75 text-2xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
                      {comp.type?.toUpperCase()}
                    </span>
                    {comp.image_url ? (
                      <img src={comp.image_url} alt={comp.model} className="h-full w-full object-contain p-2.5 transition-transform hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[var(--tertiary-text)]">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <div className="text-xs font-bold text-[var(--text-color)] leading-1.3 line-clamp-2">
                      {comp.brand} {comp.model}
                    </div>
                    {comp.reason && (
                      <div className="text-2xs text-[var(--tertiary-text)] italic leading-1.3">
                        {comp.reason}
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between gap-1.5 pt-1.5 border-t border-[var(--border-color)]">
                      <span className="text-sm font-bold text-[#28a745]">
                        {comp.price ? `$${comp.price.toFixed(2)}` : 'N/A'}
                      </span>
                      {comp.source_url && (
                        <a 
                          href={comp.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="rounded-1.5 bg-[#4A90E2] px-2.5 py-1 text-2xs font-bold text-white transition-all hover:bg-[#357ABD] whitespace-nowrap"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Compatibility Notes */}
            {tierData.compatibility_notes?.length > 0 && (
              <div className="rounded-1.5 border-l-3 border-l-[#28a745] bg-[rgba(40,167,69,0.06)] p-3.5">
                <div className="font-bold text-xs text-[#28a745] mb-1.5">✓ Compatibility Verified</div>
                <ul className="m-0 list-disc pl-4 text-2xs text-[var(--secondary-text)]">
                  {tierData.compatibility_notes.map((note: string, i: number) => (
                    <li key={i} className="mb-0.5 leading-1.4">{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}