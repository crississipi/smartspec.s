'use client';

import { motion } from 'framer-motion';
import ComponentCard from './ComponentCard';
import { useState } from 'react';

interface Component {
  id?: number | null;
  type: string;
  brand: string;
  model: string;
  price: number;
  currency?: string;
  image_url?: string | null;
  source_url?: string | null;
  store_name?: string | null;
  reason?: string | null;
  is_upgrade?: boolean;
  current_component?: string | null;
  current_price?: number | null;
  price_difference?: number | null;
  price_difference_percent?: number | null;
}

interface BuildTier {
  components: Component[];
  build_name?: string;
  total_cost: number;
  compatibility_notes?: string[];
  assumptions?: string[];
}

interface RecommendationData {
  type: string;
  ai_message: string;
  components: Component[];
  multiple_recommendations?: Record<string, BuildTier>;
  budget_analysis?: {
    user_budget: number;
    is_feasible: boolean;
    message: string;
    min_required: number;
  };
  build_info?: {
    build_name?: string;
    build_summary?: string;
    assumptions?: string[];
    compatibility_notes?: string[];
  };
}

interface RecommendationDisplayProps {
  data: RecommendationData;
}

export default function RecommendationDisplay({ data }: RecommendationDisplayProps) {
  const [selectedTier, setSelectedTier] = useState<string>('balanced');
  
  // Safety check - ensure data exists and has required properties
  if (!data || typeof data !== 'object' || !data.type) {
    return (
      <div className="text-red-500 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
        Error: Invalid recommendation data
      </div>
    );
  }

  // Ensure components array exists
  if (!data.components || !Array.isArray(data.components)) {
    return (
      <div className="text-yellow-600 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        No components found in recommendation
      </div>
    );
  }
  
  const isUpgrade = data.type === 'upgrade_suggestion';
  const hasMultipleTiers = data.multiple_recommendations && Object.keys(data.multiple_recommendations).length > 0;
  
  const currencySymbol = data.components?.[0]?.currency === 'PHP' ? '₱' : '$';

  // Get components to display (either single build or selected tier)
  const displayComponents = hasMultipleTiers
    ? data.multiple_recommendations![selectedTier]?.components || data.components
    : data.components;

  const totalCost = displayComponents.reduce((sum, comp) => sum + comp.price, 0);

  return (
    <div className="smart-recommendation my-4">
      {/* AI Message Section */}
      <div className="ai-response-section mb-6">
        <div className="ai-message prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: parseMarkdown(data.ai_message) }} />
        </div>
      </div>

      {/* Budget Warning */}
      {data.budget_analysis && !data.budget_analysis.is_feasible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="budget-warning bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6"
        >
          <div className="warning-header text-yellow-800 dark:text-yellow-200 font-semibold mb-2 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Budget Constraint
          </div>
          <div className="budget-comparison grid grid-cols-2 gap-4 text-sm">
            <div className="budget-item">
              <span className="text-gray-600 dark:text-gray-400">Your Budget:</span>
              <span className="user-budget font-bold text-yellow-800 dark:text-yellow-200 ml-2">
                {currencySymbol}
                {data.budget_analysis.user_budget.toLocaleString()}
              </span>
            </div>
            <div className="budget-item">
              <span className="text-gray-600 dark:text-gray-400">Min Required:</span>
              <span className="min-budget font-bold text-yellow-800 dark:text-yellow-200 ml-2">
                {currencySymbol}
                {data.budget_analysis.min_required.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tier Selection Tabs (for multiple builds) */}
      {hasMultipleTiers && (
        <div className="recommendation-tabs mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {Object.keys(data.multiple_recommendations!).map((tierName) => {
            const tier = data.multiple_recommendations![tierName];
            const tierTotal = tier.total_cost;
            return (
              <button
                key={tierName}
                onClick={() => setSelectedTier(tierName)}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  selectedTier === tierName
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <div className="text-sm capitalize">{tierName}</div>
                <div className="text-xs mt-1">
                  {currencySymbol}
                  {tierTotal.toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Components Section Header */}
      <div className="components-section-header mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          {isUpgrade ? (
            <>
              <span className="text-2xl">🔧</span>
              Upgrade Options
            </>
          ) : (
            <>
              <span className="text-2xl">💻</span>
              Recommended Components
            </>
          )}
          <span className="section-count text-sm text-gray-500 dark:text-gray-400 font-normal">
            {displayComponents.length} {displayComponents.length === 1 ? 'component' : 'components'}
          </span>
        </h3>
        <div className="total-price text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          <div className="text-2xl font-bold">
            {currencySymbol}
            {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Components Grid */}
      <div className="components-card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {displayComponents.map((component, index) => (
          <ComponentCard key={index} component={component} index={index} />
        ))}
      </div>

      {/* Build Info (Compatibility & Assumptions) */}
      {(data.build_info?.compatibility_notes || data.build_info?.assumptions) && (
        <div className="build-info grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {data.build_info.compatibility_notes && data.build_info.compatibility_notes.length > 0 && (
            <div className="build-compatibility-notes bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="compatibility-header text-green-800 dark:text-green-200 font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">✓</span>
                Compatibility Verified
              </div>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {data.build_info.compatibility_notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
          {data.build_info.assumptions && data.build_info.assumptions.length > 0 && (
            <div className="build-assumptions bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="assumptions-header text-blue-800 dark:text-blue-200 font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">💡</span>
                Assumptions
              </div>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {data.build_info.assumptions.map((assumption, i) => (
                  <li key={i}>{assumption}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple markdown parser (basic formatting)
function parseMarkdown(text: string): string {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Lists
  const lines = html.split('\n');
  let result: string[] = [];
  let inUl = false;

  for (let line of lines) {
    const ulMatch = line.match(/^\s*[-•*]\s+(.+)/);
    if (ulMatch) {
      if (!inUl) {
        result.push('<ul class="list-disc list-inside my-2">');
        inUl = true;
      }
      result.push('<li>' + ulMatch[1] + '</li>');
    } else {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (line.trim() === '') {
        result.push('<br>');
      } else {
        result.push('<p>' + line + '</p>');
      }
    }
  }

  if (inUl) result.push('</ul>');

  return result.join('\n');
}
