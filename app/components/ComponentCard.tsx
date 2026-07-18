'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaExternalLinkAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Image from 'next/image';

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

interface ComponentCardProps {
  component: Component;
  index: number;
  onShowAlternatives?: (component: Component) => void;
}

export default function ComponentCard({ component, index, onShowAlternatives }: ComponentCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<Component[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`component-card bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${
        component.is_upgrade ? 'border-2 border-green-500' : ''
      }`}
    >
      {/* Component Image */}
      <div className="component-card-image relative h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <span className="component-type-badge absolute top-2 left-2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase">
          {component.type}
        </span>
        {component.image_url ? (
          <div className="relative w-full h-full">
            <Image
              src={component.image_url}
              alt={component.model}
              fill
              className="object-contain p-4"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="text-gray-400 dark:text-gray-500 text-sm">No image available</div>
        )}
      </div>

      {/* Component Info */}
      <div className="component-card-body p-4">
        <div className="component-card-info mb-3">
          <div className="component-brand text-sm text-gray-500 dark:text-gray-400 font-medium">
            {component.brand}
          </div>
          {component.source_url ? (
            <a
              href={component.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="component-model text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
            >
              {component.model}
              <FaExternalLinkAlt size={12} />
            </a>
          ) : (
            <div className="component-model text-lg font-semibold">{component.model}</div>
          )}
          {component.reason && (
            <p className="component-reason text-sm text-gray-600 dark:text-gray-300 mt-2">{component.reason}</p>
          )}
        </div>

        {/* Upgrade Info */}
        {component.is_upgrade && component.current_component && (
          <div className="component-upgrade-info bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3">
            <div className="upgrade-from text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span className="font-semibold">Current:</span> {component.current_component}
            </div>
            {component.price_difference !== null && component.price_difference !== undefined && (
              <div
                className={`price-difference text-sm font-bold ${
                  component.price_difference >= 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {component.price_difference >= 0 ? '+' : ''}
                {currencySymbol}
                {component.price_difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                {component.price_difference_percent !== null && component.price_difference_percent !== undefined && (
                  <span className="text-xs ml-1">
                    ({component.price_difference >= 0 ? '+' : ''}
                    {component.price_difference_percent.toFixed(1)}%)
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div className="component-card-price border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
          <span className="price-amount text-2xl font-bold text-gray-900 dark:text-white">
            {currencySymbol}
            {component.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          {component.store_name && (
            <div className="store-name text-xs text-gray-500 dark:text-gray-400 mt-1">{component.store_name}</div>
          )}
        </div>

        {/* Actions */}
        <div className="component-card-actions flex gap-2">
          {component.source_url && (
            <a
              href={component.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-view flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg text-center transition-colors flex items-center justify-center gap-2"
            >
              <FaExternalLinkAlt size={12} />
              View Product
            </a>
          )}
          {!component.is_upgrade && (
            <button
              onClick={handleToggleAlternatives}
              className="btn-alternate px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            {loadingAlternatives ? (
              <div className="text-center py-4 text-sm text-gray-500">Loading alternatives...</div>
            ) : alternatives.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold mb-2">Alternative Options</h4>
                {alternatives.slice(0, 3).map((alt, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm"
                  >
                    {alt.image_url && (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image src={alt.image_url} alt={alt.model} fill className="object-contain" loading="lazy" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {alt.brand} {alt.model}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {currencySymbol}
                        {alt.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    {alt.source_url && (
                      <a
                        href={alt.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FaExternalLinkAlt size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-500">No alternatives found</div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
