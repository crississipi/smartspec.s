/**
 * Component Loader
 * Loads and manages PC components from JSON files
 * Provides compatibility checking and budget-based selection
 */

import fs from 'fs';
import path from 'path';

// Type definitions
export interface Component {
  id: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  price: number;
  currency: string;
  specs: Record<string, any>;
  image_url?: string;
  link?: string;
  socket?: string; // For CPU and Coolers
  tdp?: number; // For CPU
  formFactor?: string; // For RAM, Storage, PSU
  capacity?: string; // For RAM, Storage
  wattage?: number; // For PSU
  compatibility?: string[];
}

export interface ComponentDatabase {
  [type: string]: Component[];
}

export interface BuildTier {
  name: string;
  components: Component[];
  totalPrice: number;
  budget: number;
  tier: 'budget' | 'balanced' | 'premium';
}

// Component type mapping from filenames
const typeMapping: Record<string, string> = {
  'cpu.json': 'cpu',
  'motherboard.json': 'motherboard',
  'memory.json': 'ram',
  'video-card.json': 'gpu',
  'internal-hard-drive.json': 'storage-hdd',
  'power-supply.json': 'psu',
  'case.json': 'case',
  'cpu-cooler.json': 'cooler',
  'case-fan.json': 'case-fan',
  'keyboard.json': 'keyboard',
  'mouse.json': 'mouse',
  'monitor.json': 'monitor',
};

// Budget allocation presets (percentages)
// These are starting points - the system will upgrade components to better utilize the budget
export const budgetAllocations = {
  gaming: {
    cpu: 0.18,
    motherboard: 0.11,
    ram: 0.08,
    gpu: 0.40,
    'storage-hdd': 0.08,
    psu: 0.06,
    case: 0.03,
    cooler: 0.03,
    'case-fan': 0.02,
    keyboard: 0.00,
    mouse: 0.00,
  },
  professional: {
    cpu: 0.30,
    motherboard: 0.13,
    ram: 0.16,
    gpu: 0.22,
    'storage-hdd': 0.10,
    psu: 0.06,
    case: 0.02,
    cooler: 0.04,
    'case-fan': 0.02,
    keyboard: 0.00,
    mouse: 0.00,
  },
  productivity: {
    cpu: 0.24,
    motherboard: 0.12,
    ram: 0.13,
    gpu: 0.25,
    'storage-hdd': 0.11,
    psu: 0.06,
    case: 0.02,
    cooler: 0.03,
    'case-fan': 0.02,
    keyboard: 0.00,
    mouse: 0.00,
  },
  streaming: {
    cpu: 0.26,
    motherboard: 0.12,
    ram: 0.13,
    gpu: 0.27,
    'storage-hdd': 0.09,
    psu: 0.06,
    case: 0.02,
    cooler: 0.04,
    'case-fan': 0.02,
    keyboard: 0.00,
    mouse: 0.00,
  },
  general: {
    cpu: 0.22,
    motherboard: 0.12,
    ram: 0.10,
    gpu: 0.35,
    'storage-hdd': 0.09,
    psu: 0.06,
    case: 0.02,
    cooler: 0.03,
    'case-fan': 0.02,
    keyboard: 0.00,
    mouse: 0.00,
  },
};

// Essential component types for a complete build
export const essentialComponents = ['cpu', 'motherboard', 'ram', 'gpu', 'storage-hdd', 'psu', 'case', 'cooler'];

// Currency conversion rate (USD to PHP)
const USD_TO_PHP_RATE = 57; // Approximate exchange rate

/**
 * Convert USD price to PHP
 */
function convertUSDtoPHP(usdPrice: number): number {
  return Math.round(usdPrice * USD_TO_PHP_RATE);
}

// Compatibility rules
const compatibilityRules = {
  socket_am5: ['Ryzen 7000', 'Ryzen 9000', 'Ryzen 5000', 'AM5'],
  socket_lga1700: ['Core i9', 'Core i7', 'Core i5', 'Core i3', 'LGA1700'],
  ddr5: ['Ryzen 7000', 'Ryzen 9000', 'Core i9-13th', 'Core i9-14th', 'DDR5'],
  ddr4: ['Ryzen 5000', 'Ryzen 7000', 'Core i7-12th', 'LGA1700', 'DDR4'],
};

class ComponentLoaderService {
  private database: ComponentDatabase = {};
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const scriptsDir = path.join(process.cwd(), 'data', 'components');

      // Read all JSON files from the directory
      const files = fs.readdirSync(scriptsDir).filter((file) => file.endsWith('.json'));

      for (const file of files) {
        const filePath = path.join(scriptsDir, file);
        const componentType = typeMapping[file] || file.replace('.json', '');

        try {
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const components = JSON.parse(rawData);

          if (Array.isArray(components)) {
            this.database[componentType] = components.map((comp: any, idx: number) => ({
              id: `${componentType}-${idx}`,
              type: componentType,
              brand: comp.brand || comp.name?.split(' ')[0] || 'Generic',
              model: comp.model || comp.name || 'Unknown',
              name: comp.name || `${componentType}-${idx}`,
              price: convertUSDtoPHP(parseFloat(comp.price) || 0), // Convert USD to PHP
              currency: 'PHP',
              specs: comp,
              image_url: comp.image_url,
              link: comp.link,
              socket: comp.socket || comp.chipset,
              tdp: comp.tdp,
              formFactor: comp.form_factor || comp.formFactor,
              capacity: comp.capacity || comp.size,
              wattage: comp.wattage || comp.power,
            }));
          }
        } catch (error) {
          console.error(`Error loading component file ${file}:`, error);
        }
      }

      this.initialized = true;
      console.log('Component database initialized:', Object.keys(this.database).length, 'types');
    } catch (error) {
      console.error('Failed to initialize component loader:', error);
      throw error;
    }
  }

  /**
   * Get components by type
   */
  getComponentsByType(type: string, limit?: number): Component[] {
    const components = this.database[type] || [];
    return limit ? components.slice(0, limit) : components;
  }

  /**
   * Get all component types available
   */
  getAvailableTypes(): string[] {
    return Object.keys(this.database);
  }

  /**
   * Filter components by price range
   */
  filterByPrice(components: Component[], minPrice: number, maxPrice: number): Component[] {
    return components.filter((comp) => comp.price >= minPrice && comp.price <= maxPrice);
  }

  /**
   * Check if two components are compatible
   */
  areCompatible(comp1: Component, comp2: Component): boolean {
    // Socket compatibility
    if (comp1.type === 'cpu' && comp2.type === 'motherboard') {
      const cpuSocket = comp1.socket || comp1.specs.socket;
      const mbSocket = comp2.socket || comp2.specs.socket || comp2.specs.chipset;
      return cpuSocket === mbSocket || !cpuSocket || !mbSocket;
    }

    // RAM form factor and speed compatibility (simplified)
    if (comp1.type === 'ram' && comp2.type === 'motherboard') {
      const ramType = comp1.formFactor || comp1.specs.type;
      const mbSupported = comp2.specs.memory_supported || comp2.specs.memorySupport || [];
      return Array.isArray(mbSupported) ? mbSupported.includes(ramType) : true;
    }

    // PSU wattage check against TDP
    if (comp1.type === 'psu' && comp2.type === 'gpu') {
      const psuWatts = comp1.wattage || comp1.specs.wattage;
      const gpuTdp = comp2.tdp || comp2.specs.tdp || 150;
      return psuWatts >= gpuTdp * 1.5; // PSU should be 1.5x GPU TDP
    }

    // Case fits components
    if (comp1.type === 'case' && comp2.type === 'motherboard') {
      const caseFormFactor = comp1.formFactor || comp1.specs.form_factor;
      const mbFormFactor = comp2.formFactor || comp2.specs.form_factor;
      // Simplified: most cases fit most motherboards
      return true;
    }

    return true; // Default: compatible
  }

  /**
   * Select best component for budget
   */
  selectBestForBudget(type: string, budget: number, exclude?: Component[]): Component | null {
    let components = this.getComponentsByType(type);

    if (exclude) {
      const excludeIds = exclude.map((c) => c.id);
      components = components.filter((c) => !excludeIds.includes(c.id));
    }

    // Get components within budget, sorted by price descending (best value)
    const withinBudget = components
      .filter((c) => c.price <= budget)
      .sort((a, b) => b.price - a.price);

    return withinBudget[0] || components[0] || null;
  }

  /**
   * Build a complete PC build within budget using target-based selection
   * AGGRESSIVELY targets the stated budget (90-100% utilization)
   */
  buildSystem(budget: number, useCase: 'gaming' | 'professional' | 'productivity' | 'streaming' | 'general' = 'gaming'): BuildTier | null {
    const TARGET_UTILIZATION = 0.95; // Aim for 95% of budget
    const MIN_UTILIZATION = 0.88; // Minimum 88% of budget
    const MAX_ITERATIONS = 15; // More iterations for better results

    // Get priority weights for this use case
    const priorityWeights = this.getPriorityWeights(useCase);
    const selectionOrder = ['gpu', 'cpu', 'motherboard', 'ram', 'storage-hdd', 'psu', 'case', 'cooler'];
    
    let bestBuild: { components: Component[], totalPrice: number } | null = null;
    let bestUtilization = 0;

    // Try multiple iterations to find optimal build
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const selectedComponents: Component[] = [];
      let totalPrice = 0;
      
      // Adjust target based on iteration - focus on higher budgets
      const iterationMultiplier = 0.80 + (iteration * 0.03); // 0.80, 0.83, 0.86, 0.89, 0.92, 0.95, 0.98, 1.01, 1.04...
      const targetBudget = budget * iterationMultiplier;

      // Step 1: Select components targeting the adjusted budget
      for (const componentType of selectionOrder) {
        const weight = priorityWeights[componentType] || 0.05;
        const componentBudget = targetBudget * weight;
        
        // Get all components of this type sorted by price descending
        const allComponents = this.getComponentsByType(componentType).sort((a, b) => b.price - a.price);
        if (allComponents.length === 0) continue;

        // Find the most expensive compatible component within our budget
        let selectedComponent: Component | null = null;
        
        for (const component of allComponents) {
          const potentialTotal = totalPrice + component.price;
          
          // Allow going slightly over budget during selection
          if (potentialTotal > budget * 1.08) continue;

          // Check compatibility with already selected components
          let isCompatible = true;
          for (const selected of selectedComponents) {
            if (!this.areCompatible(component, selected)) {
              isCompatible = false;
              break;
            }
          }

          if (!isCompatible) continue;

          // Take the most expensive compatible option that fits
          if (!selectedComponent || component.price > selectedComponent.price) {
            const wouldBeTotal = totalPrice + component.price;
            // Prefer components that get us closer to budget
            if (wouldBeTotal <= budget || wouldBeTotal <= budget * 1.05) {
              selectedComponent = component;
              // If this component gets us close to target, use it
              if (wouldBeTotal >= budget * 0.85) {
                break;
              }
            }
          }
        }

        if (selectedComponent) {
          selectedComponents.push(selectedComponent);
          totalPrice += selectedComponent.price;
        }
      }

      // Check if this build is complete
      if (selectedComponents.length < essentialComponents.length) continue;

      // Calculate utilization
      const utilization = totalPrice / budget;

      // If this build is better than our best so far, save it
      if (totalPrice <= budget * 1.02 && utilization >= MIN_UTILIZATION * 0.95) {
        if (utilization > bestUtilization || bestBuild === null) {
          bestBuild = { components: [...selectedComponents], totalPrice };
          bestUtilization = utilization;
        }
        
        // If we hit our target utilization, we can stop
        if (utilization >= TARGET_UTILIZATION && utilization <= 1.02) {
          break;
        }
      }
    }

    // CRITICAL: Aggressive optimization to hit budget target
    if (bestBuild && bestBuild.totalPrice < budget * MIN_UTILIZATION) {
      console.log(`Initial build too cheap (${bestBuild.totalPrice} / ${budget}), running aggressive optimization...`);
      const optimized = this.aggressiveOptimizeBuild(bestBuild.components, budget, useCase);
      if (optimized && optimized.totalPrice > bestBuild.totalPrice) {
        bestBuild = optimized;
      }
    }

    if (!bestBuild || bestBuild.components.length < essentialComponents.length) {
      return null;
    }

    return {
      name: `${useCase.charAt(0).toUpperCase() + useCase.slice(1)} Build`,
      components: bestBuild.components,
      totalPrice: bestBuild.totalPrice,
      budget,
      tier: bestBuild.totalPrice <= budget * 0.80 ? 'budget' : bestBuild.totalPrice <= budget * 1.05 ? 'balanced' : 'premium',
    };
  }

  /**
   * AGGRESSIVE optimization - replaces components until budget target is hit
   */
  private aggressiveOptimizeBuild(
    components: Component[],
    budget: number,
    useCase: string
  ): { components: Component[], totalPrice: number } | null {
    let currentComponents = [...components];
    let currentTotal = components.reduce((sum, c) => sum + c.price, 0);
    
    const TARGET_MIN = budget * 0.88; // Must reach at least 88%
    const TARGET_MAX = budget * 1.02; // Can go up to 102%
    
    console.log(`Aggressive optimization: Current ${currentTotal}, Target ${TARGET_MIN}-${TARGET_MAX}`);

    // Upgrade priority - most impactful components first
    const upgradeOrder = useCase === 'gaming' 
      ? ['gpu', 'cpu', 'ram', 'motherboard', 'storage-hdd', 'psu', 'cooler', 'case']
      : ['cpu', 'gpu', 'ram', 'motherboard', 'storage-hdd', 'psu', 'cooler', 'case'];

    // Multiple passes to reach target
    for (let pass = 0; pass < 5; pass++) {
      if (currentTotal >= TARGET_MIN && currentTotal <= TARGET_MAX) {
        console.log(`Target reached after pass ${pass}: ${currentTotal}`);
        break;
      }

      for (const componentType of upgradeOrder) {
        const currentIndex = currentComponents.findIndex(c => c.type === componentType);
        if (currentIndex === -1) continue;

        const currentComponent = currentComponents[currentIndex];
        const remainingBudget = budget - currentTotal;
        
        // Look for upgrades that use the remaining budget
        const allComponents = this.getComponentsByType(componentType).sort((a, b) => b.price - a.price);
        
        for (const component of allComponents) {
          // Skip if same or cheaper
          if (component.id === currentComponent.id || component.price <= currentComponent.price) continue;
          
          const newTotal = currentTotal - currentComponent.price + component.price;
          
          // Only upgrade if it gets us closer to target and doesn't exceed max
          if (newTotal > TARGET_MAX) continue;
          if (newTotal <= currentTotal) continue; // Must be more expensive
          
          // Check compatibility
          let isCompatible = true;
          for (const selected of currentComponents) {
            if (selected.id !== currentComponent.id && !this.areCompatible(component, selected)) {
              isCompatible = false;
              break;
            }
          }
          if (!isCompatible) continue;

          // Apply upgrade
          currentComponents[currentIndex] = component;
          currentTotal = newTotal;
          console.log(`Upgraded ${componentType}: ${currentComponent.price} → ${component.price}, Total: ${currentTotal}`);
          
          // Check if we've reached target
          if (currentTotal >= TARGET_MIN && currentTotal <= TARGET_MAX) {
            return { components: currentComponents, totalPrice: currentTotal };
          }
          
          break; // Try next component type
        }
      }
    }

    return { components: currentComponents, totalPrice: currentTotal };
  }

  /**
   * Get priority weights for component selection based on use case
   */
  private getPriorityWeights(useCase: string): Record<string, number> {
    const weights: Record<string, Record<string, number>> = {
      gaming: {
        gpu: 0.38,
        cpu: 0.20,
        ram: 0.10,
        'storage-hdd': 0.10,
        motherboard: 0.10,
        psu: 0.06,
        case: 0.03,
        cooler: 0.03,
      },
      professional: {
        cpu: 0.28,
        gpu: 0.22,
        ram: 0.16,
        'storage-hdd': 0.12,
        motherboard: 0.10,
        psu: 0.06,
        case: 0.03,
        cooler: 0.03,
      },
      productivity: {
        cpu: 0.26,
        gpu: 0.24,
        ram: 0.14,
        'storage-hdd': 0.12,
        motherboard: 0.11,
        psu: 0.06,
        case: 0.04,
        cooler: 0.03,
      },
      streaming: {
        cpu: 0.25,
        gpu: 0.26,
        ram: 0.14,
        'storage-hdd': 0.11,
        motherboard: 0.11,
        psu: 0.06,
        case: 0.04,
        cooler: 0.03,
      },
      general: {
        cpu: 0.22,
        gpu: 0.30,
        ram: 0.12,
        'storage-hdd': 0.12,
        motherboard: 0.11,
        psu: 0.06,
        case: 0.04,
        cooler: 0.03,
      },
    };

    return weights[useCase] || weights.general;
  }

  /**
   * Optimize build to get closer to target budget utilization
   */
  private optimizeBuildToTarget(
    components: Component[],
    budget: number,
    useCase: string,
    targetUtilization: number
  ): { components: Component[], totalPrice: number } | null {
    let currentComponents = [...components];
    let currentTotal = components.reduce((sum, c) => sum + c.price, 0);
    
    const targetPrice = budget * targetUtilization;
    const remainingBudget = budget - currentTotal;

    // If we're already at target, return as-is
    if (Math.abs(currentTotal - targetPrice) / budget < 0.03) {
      return { components: currentComponents, totalPrice: currentTotal };
    }

    // If under budget, try to upgrade components
    if (currentTotal < targetPrice && remainingBudget > 0) {
      // Priority order for upgrades
      const upgradeOrder = useCase === 'gaming' 
        ? ['gpu', 'cpu', 'ram', 'storage-hdd', 'motherboard', 'psu', 'cooler']
        : ['cpu', 'gpu', 'ram', 'storage-hdd', 'motherboard', 'psu', 'cooler'];

      for (const componentType of upgradeOrder) {
        const currentIndex = currentComponents.findIndex(c => c.type === componentType);
        if (currentIndex === -1) continue;

        const currentComponent = currentComponents[currentIndex];
        const maxPrice = currentComponent.price + (budget - currentTotal);

        // Find better component that gets us closer to target
        const allComponents = this.getComponentsByType(componentType);
        let bestUpgrade: Component | null = null;
        let bestScore = Infinity;

        for (const component of allComponents) {
          if (component.id === currentComponent.id) continue;
          if (component.price <= currentComponent.price) continue;
          
          const newTotal = currentTotal - currentComponent.price + component.price;
          if (newTotal > budget) continue;

          // Check compatibility
          let isCompatible = true;
          for (const selected of currentComponents) {
            if (selected.id !== currentComponent.id && !this.areCompatible(component, selected)) {
              isCompatible = false;
              break;
            }
          }
          if (!isCompatible) continue;

          // Score based on how close we get to target
          const distanceToTarget = Math.abs(newTotal - targetPrice);
          if (distanceToTarget < bestScore) {
            bestScore = distanceToTarget;
            bestUpgrade = component;
          }
        }

        if (bestUpgrade) {
          currentComponents[currentIndex] = bestUpgrade;
          currentTotal = currentTotal - currentComponent.price + bestUpgrade.price;

          // If we're close enough to target, stop
          if (Math.abs(currentTotal - targetPrice) / budget < 0.03) {
            break;
          }
        }
      }
    }

    return { components: currentComponents, totalPrice: currentTotal };
  }

  /**
   * Generate three tier builds with aggressive budget targeting
   */
  generateTieredBuilds(budget: number, useCase: 'gaming' | 'professional' | 'productivity' | 'streaming' | 'general' = 'gaming'): BuildTier[] {
    const builds: BuildTier[] = [];

    console.log(`Generating tiered builds for budget: ₱${budget}, use case: ${useCase}`);

    // Budget tier: 75-85% of stated budget
    const budgetTierTarget = Math.round(budget * 0.80);
    const budgetBuild = this.buildSystem(budgetTierTarget, useCase);
    if (budgetBuild) {
      console.log(`Budget tier: ₱${budgetBuild.totalPrice} (${Math.round(budgetBuild.totalPrice/budgetTierTarget*100)}% of ${budgetTierTarget})`);
      builds.push({ ...budgetBuild, tier: 'budget', name: 'Budget Build', budget: budgetTierTarget });
    }

    // Balanced tier: 88-100% of stated budget (PRIMARY - must be close!)
    const balancedBuild = this.buildSystem(budget, useCase);
    if (balancedBuild) {
      console.log(`Balanced tier: ₱${balancedBuild.totalPrice} (${Math.round(balancedBuild.totalPrice/budget*100)}% of ${budget})`);
      
      // If balanced build is too far from budget, force optimization
      if (balancedBuild.totalPrice < budget * 0.85) {
        console.warn(`Balanced build only ${Math.round(balancedBuild.totalPrice/budget*100)}% of budget, re-optimizing...`);
        const reoptimized = this.aggressiveOptimizeBuild(balancedBuild.components, budget, useCase);
        if (reoptimized && reoptimized.totalPrice > balancedBuild.totalPrice) {
          balancedBuild.components = reoptimized.components;
          balancedBuild.totalPrice = reoptimized.totalPrice;
          console.log(`Re-optimized to: ₱${balancedBuild.totalPrice} (${Math.round(balancedBuild.totalPrice/budget*100)}%)`);
        }
      }
      
      builds.push({ ...balancedBuild, tier: 'balanced', name: 'Balanced Build', budget });
    }

    // Premium tier: 105-115% of stated budget
    const premiumTierTarget = Math.round(budget * 1.10);
    const premiumBuild = this.buildSystem(premiumTierTarget, useCase);
    if (premiumBuild && premiumBuild.totalPrice > (balancedBuild?.totalPrice || budget * 0.85)) {
      console.log(`Premium tier: ₱${premiumBuild.totalPrice} (${Math.round(premiumBuild.totalPrice/premiumTierTarget*100)}% of ${premiumTierTarget})`);
      builds.push({ ...premiumBuild, tier: 'premium', name: 'Premium Build', budget: premiumTierTarget });
    }

    return builds;
  }

  /**
   * Find alternative components similar to input component
   */
  findAlternatives(component: Component, maxResults: number = 5): Component[] {
    const sameType = this.getComponentsByType(component.type);
    const priceRange = component.price * 0.2; // ±20% price range

    return sameType
      .filter(
        (c) =>
          c.id !== component.id &&
          c.price >= component.price - priceRange &&
          c.price <= component.price + priceRange
      )
      .sort((a, b) => Math.abs(a.price - component.price) - Math.abs(b.price - component.price))
      .slice(0, maxResults);
  }
}

// Singleton instance
let instance: ComponentLoaderService | null = null;

export async function getComponentLoader(): Promise<ComponentLoaderService> {
  if (!instance) {
    instance = new ComponentLoaderService();
    await instance.initialize();
  }
  return instance;
}

export default ComponentLoaderService;
