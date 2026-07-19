'use client';

import { motion } from 'framer-motion';
import ComponentCard from './ComponentCard';
import { useState, useEffect } from 'react';

interface Component {
  id?: number | null;
  type: string;
  brand: string;
  model: string;
  price: number;
  currency?: string;
  image_url?: string | null;
  link?: string | null;
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
  nightMode?: boolean;
}

// Theme configuration
const theme = {
  light: {
    bg: '#ffffff',
    bgSecondary: '#f9fafb',
    text: '#0d0d0d',
    textSecondary: '#6b7280',
    textLight: '#9ca3af',
    border: '#e5e7eb',
    warningBg: '#fef3c7',
    warningBorder: '#fcd34d',
    warningText: '#92400e',
    greenBg: '#ecfdf5',
    greenBorder: '#a7f3d0',
    greenText: '#065f46',
    blueBorder: '#2563eb',
    blueText: '#2563eb',
  },
  dark: {
    bg: '#0d0d0d',
    bgSecondary: '#1a1a1a',
    text: '#f5f5f5',
    textSecondary: '#d1d5db',
    textLight: '#9ca3af',
    border: '#404040',
    warningBg: '#78350f',
    warningBorder: '#b45309',
    warningText: '#fcd34d',
    greenBg: '#064e3b',
    greenBorder: '#6ee7b7',
    greenText: '#a7f3d0',
    blueBorder: '#60a5fa',
    blueText: '#60a5fa',
  },
};

export default function RecommendationDisplay({ data, nightMode = false }: RecommendationDisplayProps) {
  const [selectedTier, setSelectedTier] = useState<string>('balanced');
  const [isDarkMode, setIsDarkMode] = useState(nightMode);

  useEffect(() => {
    setIsDarkMode(nightMode || document.documentElement.classList.contains('dark'));
  }, [nightMode]);

  const current = isDarkMode ? theme.dark : theme.light;

  // Safety check - ensure data exists and has required properties
  if (!data || typeof data !== 'object' || !data.type) {
    return (
      <div style={{
        color: '#dc2626',
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: isDarkMode ? 'rgba(127, 29, 29, 0.2)' : '#fef2f2',
      }}>
        Error: Invalid recommendation data
      </div>
    );
  }

  // Ensure components array exists
  if (!data.components || !Array.isArray(data.components)) {
    return (
      <div style={{
        color: '#92400e',
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: isDarkMode ? 'rgba(120, 53, 15, 0.2)' : '#fef3c7',
      }}>
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
    <div style={{ margin: '16px 0' }}>
      {/* AI Message Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          color: current.text,
          lineHeight: '1.6',
        }}>
          <div dangerouslySetInnerHTML={{ __html: parseMarkdown(data.ai_message) }} />
        </div>
      </div>

      {/* Budget Warning */}
      {data.budget_analysis && !data.budget_analysis.is_feasible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: current.warningBg,
            border: `1px solid ${current.warningBorder}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
          }}
        >
          <div style={{
            color: current.warningText,
            fontWeight: '600',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
          }}>
            <span>⚠️</span>
            Budget Constraint
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            fontSize: '13px',
          }}>
            <div>
              <span style={{ color: current.textSecondary }}>Your Budget:</span>
              <span style={{
                fontWeight: 'bold',
                color: current.warningText,
                marginLeft: '8px',
              }}>
                {currencySymbol}
                {data.budget_analysis.user_budget.toLocaleString()}
              </span>
            </div>
            <div>
              <span style={{ color: current.textSecondary }}>Min Required:</span>
              <span style={{
                fontWeight: 'bold',
                color: current.warningText,
                marginLeft: '8px',
              }}>
                {currencySymbol}
                {data.budget_analysis.min_required.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tier Selection Tabs (for multiple builds) */}
      {hasMultipleTiers && (
        <div style={{
          marginBottom: '24px',
          display: 'flex',
          gap: '8px',
          borderBottom: `1px solid ${current.border}`,
        }}>
          {Object.keys(data.multiple_recommendations!).map((tierName) => {
            const tier = data.multiple_recommendations![tierName];
            const tierTotal = tier.total_cost;
            const isSelected = selectedTier === tierName;
            return (
              <button
                key={tierName}
                onClick={() => setSelectedTier(tierName)}
                style={{
                  padding: '12px 24px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  borderBottom: isSelected ? `2px solid ${current.blueText}` : '2px solid transparent',
                  color: isSelected ? current.blueText : current.textSecondary,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.color = current.text;
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.color = current.textSecondary;
                  }
                }}
              >
                <div style={{ textTransform: 'capitalize', fontSize: '14px' }}>{tierName}</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {currencySymbol}
                  {tierTotal.toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Components Section Header */}
      <div style={{
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: 0,
          color: current.text,
        }}>
          <span>{isUpgrade ? '🔧' : '💻'}</span>
          {isUpgrade ? 'Upgrade Options' : 'Recommended Components'}
          <span style={{
            fontSize: '13px',
            color: current.textLight,
            fontWeight: 'normal',
          }}>
            {displayComponents.length} {displayComponents.length === 1 ? 'component' : 'components'}
          </span>
        </h3>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: current.textSecondary }}>Total</div>
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: current.text,
          }}>
            {currencySymbol}
            {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Components Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {displayComponents.map((component, index) => (
          <ComponentCard key={index} component={component} index={index} />
        ))}
      </div>

      {/* Build Info (Compatibility & Assumptions) */}
      {(data.build_info?.compatibility_notes || data.build_info?.assumptions) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginTop: '24px',
        }}>
          {data.build_info.compatibility_notes && data.build_info.compatibility_notes.length > 0 && (
            <div style={{
              backgroundColor: current.greenBg,
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{
                color: current.greenText,
                fontWeight: '600',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}>
                <span>✓</span>
                Compatibility Verified
              </div>
              <ul style={{
                listStyle: 'disc',
                listStylePosition: 'inside',
                fontSize: '13px',
                color: current.text,
                margin: 0,
                paddingLeft: '0',
              }}>
                {data.build_info.compatibility_notes.map((note, i) => (
                  <li key={i} style={{ marginBottom: '4px', color: current.textSecondary }}>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.build_info.assumptions && data.build_info.assumptions.length > 0 && (
            <div style={{
              backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{
                color: isDarkMode ? '#93c5fd' : '#1e40af',
                fontWeight: '600',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
              }}>
                <span>💡</span>
                Assumptions
              </div>
              <ul style={{
                listStyle: 'disc',
                listStylePosition: 'inside',
                fontSize: '13px',
                color: current.text,
                margin: 0,
                paddingLeft: '0',
              }}>
                {data.build_info.assumptions.map((assumption, i) => (
                  <li key={i} style={{ marginBottom: '4px', color: current.textSecondary }}>
                    {assumption}
                  </li>
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
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>');

  // Lists
  const lines = html.split('\n');
  let result: string[] = [];
  let inUl = false;

  for (let line of lines) {
    const ulMatch = line.match(/^\s*[-•*]\s+(.+)/);
    if (ulMatch) {
      if (!inUl) {
        result.push('<ul style="list-style: disc; list-style-position: inside; margin: 8px 0; padding-left: 0;">');
        inUl = true;
      }
      result.push('<li style="margin-bottom: 4px;">' + ulMatch[1] + '</li>');
    } else {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (line.trim() === '') {
        result.push('<br>');
      } else {
        result.push('<p style="margin: 8px 0;">' + line + '</p>');
      }
    }
  }

  if (inUl) result.push('</ul>');

  return result.join('\n');
}
