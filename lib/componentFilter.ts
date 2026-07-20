/**
 * Component Filter Service
 * Filters components from JSON files based on budget and requirements
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'components');

export interface ComponentData {
  name: string;
  brand: string;
  model: string;
  price: number;
  price_range?: string;
  [key: string]: any; // Allow additional component-specific fields
}

export interface FilteredComponents {
  cpus: ComponentData[];
  motherboards: ComponentData[];
  rams: ComponentData[];
  gpus: ComponentData[];
  storage: ComponentData[];
  psus: ComponentData[];
  coolers: ComponentData[];
  cases: ComponentData[];
}

/**
 * Load all components from JSON files
 */
async function loadAllComponents(): Promise<FilteredComponents> {
  try {
    const [cpus, motherboards, rams, gpus, storage, psus, coolers, cases] = await Promise.all([
      fs.promises.readFile(path.join(COMPONENTS_DATA_DIR, 'cpu.json'), 'utf-8').then(d => JSON.parse(d)),
      fs.promises.readFile(path.join(COMPONENTS_DATA_DIR, 'motherboard.json'), 'utf-8').then(d => JSON.parse(d)),
      fs.promises.readFile(path.join(COMPONENTS_DATA_DIR, 'ram.json'), 'utf-8').then(d => JSON.parse(d)),
      fs.promises.readFile(path.join(COMPONENTS_DATA_DIR, 'gpu.json'), 'utf-8').then(d => JSON.parse(d)),
      fs.promises.readFile(path.join(COMPONENTS_DATA_DIR, 'storage.json'), 'utf-8').then(d => JSON.parse(d)),
      fs.promises.readFile(path.join(COMPONENTS_DATA_DIR, 'psu.json'), 'utf-8').then(d => JSON.parse(d)),
      fs.promises.readFile(path.join(COMPONENTS_DATA_DIR, 'cooler.json'), 'utf-8').then(d => JSON.parse(d)),
      fs.promises.readFile(path.join(COMPONENTS_DATA_DIR, 'case.json'), 'utf-8').then(d => JSON.parse(d)),
    ]);

    return { cpus, motherboards, rams, gpus, storage, psus, coolers, cases };
  } catch (error) {
    console.error('[ComponentFilter] Error loading components:', error);
    throw error;
  }
}

/**
 * Filter components by price range (percentage of budget)
 * Returns 30+ components per type within the range
 */
export async function filterComponentsByBudget(
  budget: number,
  minPercentage: number = 0.60, // 60% of budget
  maxPercentage: number = 1.40   // 140% of budget
): Promise<FilteredComponents> {
  console.log(`[ComponentFilter] Filtering components for budget: ₱${budget.toLocaleString()}`);
  console.log(`[ComponentFilter] Price range: ₱${Math.floor(budget * minPercentage).toLocaleString()} - ₱${Math.floor(budget * maxPercentage).toLocaleString()}`);

  const allComponents = await loadAllComponents();

  // Budget allocation percentages for each component type
  const allocations = {
    cpu: 0.20,        // 20%
    motherboard: 0.12, // 12%
    ram: 0.10,        // 10%
    gpu: 0.38,        // 38%
    storage: 0.08,    // 8%
    psu: 0.06,        // 6%
    cooler: 0.03,     // 3%
    case: 0.03,       // 3%
  };

  // Filter each component type
  const filtered: FilteredComponents = {
    cpus: filterByPriceRange(allComponents.cpus, budget * allocations.cpu, minPercentage, maxPercentage),
    motherboards: filterByPriceRange(allComponents.motherboards, budget * allocations.motherboard, minPercentage, maxPercentage),
    rams: filterByPriceRange(allComponents.rams, budget * allocations.ram, minPercentage, maxPercentage),
    gpus: filterByPriceRange(allComponents.gpus, budget * allocations.gpu, minPercentage, maxPercentage),
    storage: filterByPriceRange(allComponents.storage, budget * allocations.storage, minPercentage, maxPercentage),
    psus: filterByPriceRange(allComponents.psus, budget * allocations.psu, minPercentage, maxPercentage),
    coolers: filterByPriceRange(allComponents.coolers, budget * allocations.cooler, minPercentage, maxPercentage),
    cases: filterByPriceRange(allComponents.cases, budget * allocations.case, minPercentage, maxPercentage),
  };

  console.log(`[ComponentFilter] Filtered counts:`);
  console.log(`  CPUs: ${filtered.cpus.length}`);
  console.log(`  Motherboards: ${filtered.motherboards.length}`);
  console.log(`  RAM: ${filtered.rams.length}`);
  console.log(`  GPUs: ${filtered.gpus.length}`);
  console.log(`  Storage: ${filtered.storage.length}`);
  console.log(`  PSUs: ${filtered.psus.length}`);
  console.log(`  Coolers: ${filtered.coolers.length}`);
  console.log(`  Cases: ${filtered.cases.length}`);

  // Ensure minimum 30 components per type (or all available if less)
  const minCount = 30;
  const result: FilteredComponents = {
    cpus: ensureMinimumComponents(filtered.cpus, allComponents.cpus, minCount),
    motherboards: ensureMinimumComponents(filtered.motherboards, allComponents.motherboards, minCount),
    rams: ensureMinimumComponents(filtered.rams, allComponents.rams, minCount),
    gpus: ensureMinimumComponents(filtered.gpus, allComponents.gpus, minCount),
    storage: ensureMinimumComponents(filtered.storage, allComponents.storage, minCount),
    psus: ensureMinimumComponents(filtered.psus, allComponents.psus, minCount),
    coolers: ensureMinimumComponents(filtered.coolers, allComponents.coolers, minCount),
    cases: ensureMinimumComponents(filtered.cases, allComponents.cases, minCount),
  };

  console.log(`[ComponentFilter] After ensuring minimum 30 components:`);
  console.log(`  CPUs: ${result.cpus.length}`);
  console.log(`  Motherboards: ${result.motherboards.length}`);
  console.log(`  RAM: ${result.rams.length}`);
  console.log(`  GPUs: ${result.gpus.length}`);
  console.log(`  Storage: ${result.storage.length}`);
  console.log(`  PSUs: ${result.psus.length}`);
  console.log(`  Coolers: ${result.coolers.length}`);
  console.log(`  Cases: ${result.cases.length}`);

  return result;
}

/**
 * Filter components for upgrade suggestions
 * Returns components with higher specs and prices than the current component
 */
export async function filterComponentsForUpgrade(
  componentType: string,
  currentPrice: number,
  currentSpecs?: any
): Promise<ComponentData[]> {
  console.log(`[ComponentFilter] Filtering upgrades for ${componentType} (current price: ₱${currentPrice.toLocaleString()})`);

  const allComponents = await loadAllComponents();
  
  let components: ComponentData[] = [];
  switch (componentType.toLowerCase()) {
    case 'cpu':
      components = allComponents.cpus;
      break;
    case 'motherboard':
      components = allComponents.motherboards;
      break;
    case 'ram':
    case 'memory':
      components = allComponents.rams;
      break;
    case 'gpu':
    case 'graphics':
    case 'video card':
      components = allComponents.gpus;
      break;
    case 'storage':
    case 'ssd':
    case 'hdd':
      components = allComponents.storage;
      break;
    case 'psu':
    case 'power supply':
      components = allComponents.psus;
      break;
    case 'cooler':
    case 'cpu cooler':
      components = allComponents.coolers;
      break;
    case 'case':
      components = allComponents.cases;
      break;
    default:
      console.warn(`[ComponentFilter] Unknown component type: ${componentType}`);
      return [];
  }

  // Filter for upgrades: higher price (20% more) and up to 300% of current price
  const minPrice = currentPrice * 1.20;
  const maxPrice = currentPrice * 3.00;

  const filtered = components.filter(c => c.price >= minPrice && c.price <= maxPrice);

  // Sort by price ascending and take top 30-50
  const sorted = filtered.sort((a, b) => a.price - b.price);
  const result = sorted.slice(0, 50);

  console.log(`[ComponentFilter] Found ${result.length} upgrade options (₱${minPrice.toLocaleString()} - ₱${maxPrice.toLocaleString()})`);

  return result;
}

/**
 * Filter components by price range
 */
function filterByPriceRange(
  components: ComponentData[],
  targetPrice: number,
  minPercentage: number,
  maxPercentage: number
): ComponentData[] {
  const minPrice = targetPrice * minPercentage;
  const maxPrice = targetPrice * maxPercentage;

  return components.filter(c => c.price >= minPrice && c.price <= maxPrice);
}

/**
 * Ensure minimum number of components
 * If filtered set is smaller than minimum, expand with closest priced components
 */
function ensureMinimumComponents(
  filtered: ComponentData[],
  allComponents: ComponentData[],
  minCount: number
): ComponentData[] {
  if (filtered.length >= minCount) {
    return filtered.slice(0, minCount); // Return exactly minCount
  }

  // If we have fewer than minimum, add more components sorted by price
  const filteredIds = new Set(filtered.map(c => c.name));
  const remaining = allComponents
    .filter(c => !filteredIds.has(c.name))
    .sort((a, b) => a.price - b.price);

  const needed = minCount - filtered.length;
  const additional = remaining.slice(0, needed);

  return [...filtered, ...additional];
}

/**
 * Get component type display name
 */
export function getComponentTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    cpu: 'CPU',
    motherboard: 'Motherboard',
    ram: 'RAM',
    memory: 'RAM',
    gpu: 'GPU',
    graphics: 'GPU',
    'video card': 'GPU',
    storage: 'Storage',
    ssd: 'Storage',
    hdd: 'Storage',
    psu: 'PSU',
    'power supply': 'PSU',
    cooler: 'CPU Cooler',
    'cpu cooler': 'CPU Cooler',
    case: 'Case',
  };

  return typeMap[type.toLowerCase()] || type;
}
