'use client';

import { motion } from 'framer-motion';
import { useState, useEffect as React_useEffect } from 'react';
import { FaExternalLinkAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

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

interface ComponentCardProps {
  component: Component;
  index: number;
  onShowAlternatives?: (component: Component) => void;
}

// Theme configuration
const theme = {
  light: {
    bg: '#ffffff',
    bgHover: '#f9fafb',
    text: '#0d0d0d',
    textSecondary: '#6b7280',
    textLight: '#9ca3af',
    border: '#e5e7eb',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    badgeBg: '#3b82f6',
    badgeText: '#ffffff',
    imageBg: '#f3f4f6',
  },
  dark: {
    bg: '#1a1a1a',
    bgHover: '#262626',
    text: '#f5f5f5',
    textSecondary: '#d1d5db',
    textLight: '#9ca3af',
    border: '#404040',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    badgeBg: '#3b82f6',
    badgeText: '#ffffff',
    imageBg: '#2a2a2a',
  },
};

export default function ComponentCard({ component, index, onShowAlternatives }: ComponentCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<Component[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [nightMode, setNightMode] = useState(false);

  React_useEffect(() => {
    // Check on mount and listen for changes
    const checkDarkMode = () => {
      setNightMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Listen for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const current = nightMode ? theme.dark : theme.light;
  const currencySymbol = component.currency === 'PHP' ? '₱' : component.currency === 'USD' ? '$' : '€';

  const handleToggleAlternatives = async () => {
    if (!showAlternatives && alternatives.length === 0) {
      setLoadingAlternatives(true);
      try {
        const res = await fetch('/api/alternatives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            component_type: component.type,
            brand: component.brand,
            model: component.model,
            price: component.price,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAlternatives(data.alternatives || []);
        }
      } catch (error) {
        console.error('Failed to load alternatives:', error);
      } finally {
        setLoadingAlternatives(false);
      }
    }
    setShowAlternatives(!showAlternatives);
  };

  const cardStyle = {
    backgroundColor: current.bg,
    borderRadius: '12px',
    boxShadow: current.shadow,
    overflow: 'hidden' as const,
    border: component.is_upgrade ? `2px solid #10b981` : 'none',
  };

  const imageContainerStyle = {
    position: 'relative' as const,
    height: '192px',
    backgroundColor: current.imageBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: component.link || component.source_url ? 'pointer' : 'default',
    transition: 'background-color 0.2s',
  };

  const badgeStyle = {
    position: 'absolute' as const,
    top: '8px',
    left: '8px',
    padding: '6px 12px',
    backgroundColor: current.badgeBg,
    color: current.badgeText,
    fontSize: '11px',
    fontWeight: 'bold',
    borderRadius: '16px',
    textTransform: 'uppercase' as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={cardStyle}
    >
      {/* Component Image */}
      <div
        style={imageContainerStyle}
        onClick={() => {
          const url = component.link || component.source_url;
          if (url) window.open(url, '_blank');
        }}
        onMouseOver={(e) => {
          if (component.link || component.source_url) {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = current.bgHover;
          }
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = current.imageBg;
        }}
      >
        <span style={badgeStyle}>
          {component.type}
        </span>
        {component.image_url ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={component.image_url}
              alt={component.model}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '16px',
              }}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div style={{ color: current.textLight, fontSize: '14px' }}>No image available</div>
        )}
      </div>

      {/* Component Info */}
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', color: current.textSecondary, fontWeight: '500' }}>
            {component.brand}
          </div>
          {component.link || component.source_url ? (
            <a
              href={(component.link || component.source_url) || undefined}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#3b82f6',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none';
              }}
            >
              {component.model}
              <FaExternalLinkAlt size={12} />
            </a>
          ) : (
            <div style={{ fontSize: '18px', fontWeight: '600', color: current.text }}>
              {component.model}
            </div>
          )}
          {component.reason && (
            <p style={{ fontSize: '13px', color: current.textSecondary, marginTop: '8px', margin: 0 }}>
              {component.reason}
            </p>
          )}
        </div>

        {/* Upgrade Info */}
        {component.is_upgrade && component.current_component && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
          }}>
            <div style={{ fontSize: '12px', color: current.textSecondary, marginBottom: '4px' }}>
              <span style={{ fontWeight: '600' }}>Current:</span> {component.current_component}
            </div>
            {component.price_difference !== null && component.price_difference !== undefined && (
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: component.price_difference >= 0 ? '#dc2626' : '#10b981',
                }}
              >
                {component.price_difference >= 0 ? '+' : ''}
                {currencySymbol}
                {component.price_difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                {component.price_difference_percent !== null && component.price_difference_percent !== undefined && (
                  <span style={{ fontSize: '12px', marginLeft: '4px' }}>
                    ({component.price_difference >= 0 ? '+' : ''}
                    {component.price_difference_percent.toFixed(1)}%)
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div style={{
          borderTop: `1px solid ${current.border}`,
          paddingTop: '12px',
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '28px', fontWeight: 'bold', color: current.text }}>
            {currencySymbol}
            {component.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          {component.store_name && (
            <div style={{ fontSize: '12px', color: current.textLight, marginTop: '4px' }}>
              {component.store_name}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(component.link || component.source_url) && (
            <a
              href={(component.link || component.source_url) || undefined}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '8px',
                textAlign: 'center',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#3b82f6';
              }}
            >
              <FaExternalLinkAlt size={12} />
              View Product
            </a>
          )}
          {!component.is_upgrade && (
            <button
              onClick={handleToggleAlternatives}
              style={{
                flex: component.link || component.source_url ? 1 : 1,
                padding: '10px 16px',
                backgroundColor: current.bgHover,
                color: current.text,
                fontSize: '13px',
                fontWeight: '500',
                borderRadius: '8px',
                border: `1px solid ${current.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = current.border;
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = current.bgHover;
              }}
            >
              {showAlternatives ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              Alternatives
            </button>
          )}
        </div>

        {/* Alternatives Section */}
        {showAlternatives && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${current.border}`,
            }}
          >
            {loadingAlternatives ? (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '13px', color: current.textLight }}>
                Loading alternatives...
              </div>
            ) : alternatives.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', margin: 0 }}>
                  Alternative Options
                </h4>
                {alternatives.slice(0, 3).map((alt, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      backgroundColor: current.bgHover,
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  >
                    {alt.image_url && (
                      <div style={{ width: '48px', height: '48px', flexShrink: 0, overflow: 'hidden', borderRadius: '4px' }}>
                        <img
                          src={alt.image_url}
                          alt={alt.model}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {alt.brand} {alt.model}
                      </div>
                      <div style={{ fontSize: '12px', color: current.textLight }}>
                        {currencySymbol}
                        {alt.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    {alt.link || alt.source_url && (
                      <a
                        href={alt.link || alt.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#3b82f6',
                          cursor: 'pointer',
                        }}
                      >
                        <FaExternalLinkAlt size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '13px', color: current.textLight }}>
                No alternatives found
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
