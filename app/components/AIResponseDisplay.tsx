/**
 * AI Response Display
 * Unified component to display all types of AI responses
 */

'use client';

import { motion } from 'framer-motion';
import ComponentCard from './ComponentCard';
import { useState } from 'react';

interface AIResponseDisplayProps {
  data: any;
  dataType: string;
  nightMode?: boolean;
}

export default function AIResponseDisplay({ data, dataType, nightMode = false }: AIResponseDisplayProps) {
  console.log('[AIResponseDisplay] Data type:', dataType);
  console.log('[AIResponseDisplay] Data:', data);

  // Route to appropriate display component based on data type
  switch (dataType) {
    case 'recommendation':
      return <BuildRecommendationDisplay data={data} nightMode={nightMode} />;
    
    case 'upgrade_suggestion':
      return <UpgradeSuggestionDisplay data={data} nightMode={nightMode} />;
    
    case 'text':
    case 'consultation':
    default:
      return null; // Text responses are handled by MessageList
  }
}

/**
 * Display PC Build Recommendation from AI
 */
function BuildRecommendationDisplay({ data, nightMode }: { data: any; nightMode: boolean }) {
  console.log('[BuildRecommendation] Received data:', JSON.stringify(data, null, 2));
  
  if (!data?.build) {
    console.warn('[BuildRecommendation] Missing build data');
    console.warn('[BuildRecommendation] Data structure:', data);
    
    // Try to handle alternative data structures
    // Check if data itself is the build (direct format)
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      const possibleComponents = ['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'cooler', 'case'];
      const hasComponents = possibleComponents.some(key => data[key]);
      
      if (hasComponents) {
        console.log('[BuildRecommendation] Using direct build format');
        // Data is directly the build object
        const build = data;
        const components = Object.entries(build)
          .filter(([key]) => possibleComponents.includes(key.toLowerCase()))
          .map(([type, component]: [string, any]) => ({
            type: type.toUpperCase(),
            brand: component.brand || '',
            model: component.model || '',
            price: component.price || 0,
            currency: 'PHP',
            image_url: component.image_url || null,
            link: component.link || null,
            reason: component.reason || '',
            socket: component.socket,
            memory_type: component.memory_type,
            wattage: component.wattage,
          }));
        
        const total_price = components.reduce((sum, c) => sum + c.price, 0);
        
        return <BuildRecommendationDisplay 
          data={{ 
            build, 
            total_price, 
            budget_remaining: 0,
            compatibility_notes: data.compatibility_notes,
            summary: data.summary 
          }} 
          nightMode={nightMode} 
        />;
      }
    }
    
    return <ErrorDisplay message="Invalid build data received. Please try again." nightMode={nightMode} />;
  }

  const { build, total_price, budget_remaining, compatibility_notes, summary } = data;

  // Convert build object to component array
  const components = Object.entries(build).map(([type, component]: [string, any]) => ({
    type: type.toUpperCase(),
    brand: component.brand || '',
    model: component.model || '',
    price: component.price || 0,
    currency: 'PHP',
    image_url: component.image_url || null,
    link: component.link || null,
    reason: component.reason || '',
    socket: component.socket,
    memory_type: component.memory_type,
    wattage: component.wattage,
  }));

  const current = nightMode ? themeColors.dark : themeColors.light;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: current.bgSecondary,
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1rem',
      }}
    >
      {/* Summary Section */}
      {summary && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: current.infoBg, borderRadius: '8px', border: `1px solid ${current.infoBorder}` }}>
          <p style={{ margin: 0, color: current.text, fontSize: '0.95rem', lineHeight: '1.6' }}>
            {summary}
          </p>
        </div>
      )}

      {/* Price Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: current.bg, borderRadius: '8px' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: current.textSecondary, marginBottom: '0.25rem' }}>
            Total Build Cost
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: current.text }}>
            ₱{total_price?.toLocaleString()}
          </div>
        </div>
        {budget_remaining !== undefined && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: current.textSecondary, marginBottom: '0.25rem' }}>
              {budget_remaining >= 0 ? 'Budget Remaining' : 'Over Budget'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: budget_remaining >= 0 ? current.greenText : current.warningText }}>
              ₱{Math.abs(budget_remaining || 0).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Compatibility Notes */}
      {compatibility_notes && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: current.greenBg, borderRadius: '8px', border: `1px solid ${current.greenBorder}` }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: current.greenText, marginBottom: '0.5rem' }}>
            ✓ Compatibility Notes
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: current.greenText }}>
            {compatibility_notes}
          </p>
        </div>
      )}

      {/* Components Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {components.map((component, index) => (
          <ComponentCard key={index} component={component} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Display Component Upgrade Suggestions from AI
 */
function UpgradeSuggestionDisplay({ data, nightMode }: { data: any; nightMode: boolean }) {
  const [selectedOption, setSelectedOption] = useState(0);

  if (!data?.recommendations || data.recommendations.length === 0) {
    console.warn('[UpgradeSuggestion] Missing recommendations data');
    return <ErrorDisplay message="No upgrade recommendations found" nightMode={nightMode} />;
  }

  const { component_type, recommendations, best_choice, summary } = data;
  const current = nightMode ? themeColors.dark : themeColors.light;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: current.bgSecondary,
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1rem',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: current.text, marginBottom: '0.5rem', margin: 0 }}>
          {component_type?.toUpperCase()} Upgrade Options
        </h3>
        {summary && (
          <p style={{ fontSize: '0.875rem', color: current.textSecondary, marginTop: '0.5rem', margin: 0 }}>
            {summary}
          </p>
        )}
      </div>

      {/* Best Choice Highlight */}
      {best_choice && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: current.infoBg, borderRadius: '8px', border: `2px solid ${current.blueBorder}` }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: current.blueText, marginBottom: '0.5rem' }}>
            ⭐ Recommended Choice
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: current.text, marginBottom: '0.25rem' }}>
            {best_choice.name}
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: current.textSecondary }}>
            {best_choice.reason}
          </p>
        </div>
      )}

      {/* Options Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {recommendations.map((rec: any, index: number) => (
          <button
            key={index}
            onClick={() => setSelectedOption(index)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: selectedOption === index ? `2px solid ${current.blueBorder}` : `1px solid ${current.border}`,
              backgroundColor: selectedOption === index ? current.infoBg : current.bg,
              color: selectedOption === index ? current.blueText : current.text,
              fontSize: '0.875rem',
              fontWeight: selectedOption === index ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Option {index + 1}
          </button>
        ))}
      </div>

      {/* Selected Option Details */}
      {recommendations[selectedOption] && (
        <motion.div
          key={selectedOption}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ComponentCard
            component={{
              type: component_type || 'Component',
              brand: recommendations[selectedOption].brand || '',
              model: recommendations[selectedOption].model || '',
              price: recommendations[selectedOption].price || 0,
              currency: 'PHP',
              link: recommendations[selectedOption].link || null,
              image_url: recommendations[selectedOption].image_url || null,
              reason: recommendations[selectedOption].reason || '',
            }}
            index={selectedOption}
          />

          {/* Additional Details */}
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {recommendations[selectedOption].performance_gain && (
              <div style={{ padding: '0.75rem', backgroundColor: current.bg, borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: current.textSecondary, marginBottom: '0.25rem' }}>
                  Performance Gain
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: current.greenText }}>
                  {recommendations[selectedOption].performance_gain}
                </div>
              </div>
            )}

            {recommendations[selectedOption].value_rating && (
              <div style={{ padding: '0.75rem', backgroundColor: current.bg, borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: current.textSecondary, marginBottom: '0.25rem' }}>
                  Value Rating
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: current.text, textTransform: 'capitalize' }}>
                  {recommendations[selectedOption].value_rating}
                </div>
              </div>
            )}
          </div>

          {recommendations[selectedOption].compatibility_notes && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: current.warningBg, borderRadius: '8px', border: `1px solid ${current.warningBorder}` }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: current.warningText, marginBottom: '0.25rem' }}>
                Compatibility Notes
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: current.warningText }}>
                {recommendations[selectedOption].compatibility_notes}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Error Display
 */
function ErrorDisplay({ message, nightMode }: { message: string; nightMode: boolean }) {
  const current = nightMode ? themeColors.dark : themeColors.light;

  return (
    <div style={{ padding: '1rem', backgroundColor: current.warningBg, borderRadius: '8px', border: `1px solid ${current.warningBorder}` }}>
      <p style={{ margin: 0, color: current.warningText, fontSize: '0.875rem' }}>
        ⚠️ {message}
      </p>
    </div>
  );
}

// Theme colors
const themeColors = {
  light: {
    bg: '#ffffff',
    bgSecondary: '#f9fafb',
    text: '#0d0d0d',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    warningBg: '#fef3c7',
    warningBorder: '#fcd34d',
    warningText: '#92400e',
    greenBg: '#ecfdf5',
    greenBorder: '#a7f3d0',
    greenText: '#065f46',
    infoBg: '#dbeafe',
    infoBorder: '#93c5fd',
    blueBorder: '#2563eb',
    blueText: '#2563eb',
  },
  dark: {
    bg: '#1a1a1a',
    bgSecondary: '#0d0d0d',
    text: '#f5f5f5',
    textSecondary: '#d1d5db',
    border: '#404040',
    warningBg: 'rgba(120, 53, 15, 0.3)',
    warningBorder: '#b45309',
    warningText: '#fcd34d',
    greenBg: 'rgba(6, 78, 59, 0.3)',
    greenBorder: '#6ee7b7',
    greenText: '#a7f3d0',
    infoBg: 'rgba(30, 58, 138, 0.3)',
    infoBorder: '#60a5fa',
    blueBorder: '#60a5fa',
    blueText: '#60a5fa',
  },
};
