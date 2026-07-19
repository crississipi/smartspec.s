'use client';

import { motion } from 'framer-motion';
import { FaCheck, FaExclamationTriangle, FaLink } from 'react-icons/fa';

interface Component {
  name: string;
  brand: string;
  model: string;
  price: number;
  image_url?: string;
  link?: string;
  [key: string]: any;
}

interface BuildRecommendationProps {
  build: {
    cpu: Component;
    motherboard: Component;
    ram: Component;
    gpu: Component | null;
    storage: Component;
    psu: Component;
    cooler: Component;
    case: Component;
    totalPrice: number;
    budgetUtilization: number;
    compatible: boolean;
    compatibilityIssues: string[];
  };
  budget: number;
  tier: 'balanced' | 'budget' | 'high_end';
  nightMode: boolean;
}

export default function BuildRecommendation({
  build,
  budget,
  tier,
  nightMode,
}: BuildRecommendationProps) {
  const theme = {
    light: {
      bg: '#ffffff',
      bgSecondary: '#f7f7f8',
      text: '#0d0d0d',
      textSecondary: '#565869',
      border: '#e5e7eb',
      borderLight: '#f0f0f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    dark: {
      bg: '#0d0d0d',
      bgSecondary: '#1a1a1a',
      text: '#ececf1',
      textSecondary: '#b4b4bc',
      border: '#404052',
      borderLight: '#2a2a3a',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  };

  const current = nightMode ? theme.dark : theme.light;

  const components = [
    { label: 'CPU', component: build.cpu, icon: '🖥️' },
    { label: 'Motherboard', component: build.motherboard, icon: '⚡' },
    { label: 'RAM', component: build.ram, icon: '📦' },
    ...(build.gpu ? [{ label: 'GPU', component: build.gpu, icon: '🎮' }] : []),
    { label: 'Storage', component: build.storage, icon: '💾' },
    { label: 'PSU', component: build.psu, icon: '🔌' },
    { label: 'Cooler', component: build.cooler, icon: '❄️' },
    { label: 'Case', component: build.case, icon: '📦' },
  ];

  const difference = budget - build.totalPrice;
  const utilizationPercentage = Math.round(build.budgetUtilization);

  const tierColors = {
    balanced: '#3b82f6',
    budget: '#10b981',
    high_end: '#a855f7',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        backgroundColor: current.bgSecondary,
        border: `1px solid ${current.border}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${current.borderLight}`,
        }}
      >
        <div>
          <h3
            style={{
              color: current.text,
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 4px 0',
              textTransform: 'capitalize',
            }}
          >
            {tier} Build
          </h3>
          <p
            style={{
              color: current.textSecondary,
              fontSize: '12px',
              margin: 0,
            }}
          >
            Compatibility: {build.compatible ? '✓ All Compatible' : '⚠ Issues Found'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              color: current.text,
              fontSize: '18px',
              fontWeight: '700',
              margin: '0 0 4px 0',
            }}
          >
            ₱{build.totalPrice.toLocaleString()}
          </p>
          <p
            style={{
              color: current.textSecondary,
              fontSize: '12px',
              margin: 0,
            }}
          >
            {utilizationPercentage}% of budget
            {difference >= 0 ? ` (₱${Math.abs(difference).toLocaleString()} remaining)` : `(₱${Math.abs(difference).toLocaleString()} over)`}
          </p>
        </div>
      </div>

      {/* Components Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {components.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              backgroundColor: current.bg,
              border: `1px solid ${current.borderLight}`,
              borderRadius: '8px',
              padding: '10px',
              cursor: item.component.link ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (item.component.link) {
                window.open(item.component.link, '_blank');
              }
            }}
          >
            <p
              style={{
                color: current.textSecondary,
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                margin: '0 0 6px 0',
                letterSpacing: '0.5px',
              }}
            >
              {item.icon} {item.label}
            </p>
            <p
              style={{
                color: current.text,
                fontSize: '13px',
                fontWeight: '600',
                margin: '0 0 2px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={item.component.name}
            >
              {item.component.brand}
            </p>
            <p
              style={{
                color: current.textSecondary,
                fontSize: '12px',
                margin: '0 0 6px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={item.component.model}
            >
              {item.component.model}
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <p
                style={{
                  color: current.text,
                  fontSize: '14px',
                  fontWeight: '700',
                  margin: 0,
                }}
              >
                ₱{item.component.price.toLocaleString()}
              </p>
              {item.component.link && (
                <FaLink
                  size={12}
                  style={{
                    color: current.textSecondary,
                    opacity: 0.6,
                  }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Issues Section */}
      {!build.compatible && build.compatibilityIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            backgroundColor: `${current.warning}15`,
            border: `1px solid ${current.warning}40`,
            borderRadius: '8px',
            padding: '10px',
            marginTop: '12px',
          }}
        >
          <p
            style={{
              color: current.warning,
              fontSize: '12px',
              fontWeight: '600',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FaExclamationTriangle size={12} />
            Compatibility Notes
          </p>
          {build.compatibilityIssues.map((issue, index) => (
            <p
              key={index}
              style={{
                color: current.text,
                fontSize: '11px',
                margin: '4px 0',
                lineHeight: '1.4',
              }}
            >
              • {issue}
            </p>
          ))}
        </motion.div>
      )}

      {/* Success Indicator */}
      {build.compatible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            backgroundColor: `${current.success}15`,
            border: `1px solid ${current.success}40`,
            borderRadius: '8px',
            padding: '10px',
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaCheck size={12} style={{ color: current.success }} />
          <p
            style={{
              color: current.text,
              fontSize: '12px',
              margin: 0,
            }}
          >
            All components are compatible and ready for purchase
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
