/**
 * Component Enricher
 * Enriches AI-selected components with images and links from JSON database
 */

import fs from 'fs';
import path from 'path';

const COMPONENTS_DATA_DIR = path.join(process.cwd(), 'public', 'data', 'components');

interface ComponentData {
  name: string;
  brand: string;
  model: string;
  price: number;
  image_url?: string;
  link?: string;
  [key: string]: any;
}

interface ComponentDatabase {
  cpus: ComponentData[];
  motherboards: ComponentData[];
  rams: ComponentData[];
  gpus: ComponentData[];
  storage: ComponentData[];
  psus: ComponentData[];
  coolers: ComponentData[];
  cases: ComponentData[];
}

let componentCache: ComponentDatabase | null = null;

/**
 * Load all components from JSON files (with caching)
 */
async function loadAllComponents(): Promise<ComponentDatabase> {
  if (componentCache) {
    return componentCache;
  }

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

    componentCache = { cpus, motherboards, rams, gpus, storage, psus, coolers, cases };
    console.log('[ComponentEnricher] Component database loaded and cached');
    
    return componentCache;
  } catch (error) {
    console.error('[ComponentEnricher] Error loading components:', error);
    throw error;
  }
}

/**
 * Find component in database by name (fuzzy matching)
 */
function findComponentByName(components: ComponentData[], targetName: string, targetBrand?: string, targetModel?: string): ComponentData | null {
  if (!components || components.length === 0) {
    return null;
  }

  const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
  const normalizedTarget = normalize(targetName);
  
  // Try exact name match first
  let match = components.find(c => normalize(c.name) === normalizedTarget);
  if (match) return match;

  // Try brand + model match
  if (targetBrand && targetModel) {
    const normalizedBrand = normalize(targetBrand);
    const normalizedModel = normalize(targetModel);
    
    match = components.find(c => 
      normalize(c.brand) === normalizedBrand && normalize(c.model) === normalizedModel
    );
    if (match) return match;
  }

  // Try partial match on name
  match = components.find(c => {
    const componentName = normalize(c.name);
    return componentName.includes(normalizedTarget) || normalizedTarget.includes(componentName);
  });
  if (match) return match;

  // Try matching on model alone
  if (targetModel) {
    const normalizedModel = normalize(targetModel);
    match = components.find(c => normalize(c.model).includes(normalizedModel));
    if (match) return match;
  }

  // Try matching key parts of the name
  const targetParts = normalizedTarget.split(/\s+/).filter(p => p.length > 2);
  if (targetParts.length > 0) {
    match = components.find(c => {
      const componentName = normalize(c.name);
      return targetParts.every(part => componentName.includes(part));
    });
    if (match) return match;
  }

  return null;
}

/**
 * Enrich a single component with image and link from database
 */
function enrichComponent(aiComponent: any, dbComponents: ComponentData[], componentType: string): any {
  const match = findComponentByName(
    dbComponents, 
    aiComponent.name || `${aiComponent.brand} ${aiComponent.model}`,
    aiComponent.brand,
    aiComponent.model
  );

  if (match) {
    console.log(`[ComponentEnricher] ✓ Matched ${componentType}: ${aiComponent.name} → ${match.name}`);
    return {
      ...aiComponent,
      image_url: match.image_url || aiComponent.image_url,
      link: match.link || aiComponent.link,
      // Preserve additional fields from database
      store_name: match.store_name,
      source_url: match.source_url,
    };
  } else {
    console.warn(`[ComponentEnricher] ✗ No match found for ${componentType}: ${aiComponent.name || aiComponent.brand + ' ' + aiComponent.model}`);
    return aiComponent; // Return as-is if no match found
  }
}

/**
 * Enrich AI build response with images and links
 */
export async function enrichBuildRecommendation(aiBuildData: any): Promise<any> {
  console.log('[ComponentEnricher] Enriching build recommendation...');
  
  try {
    const db = await loadAllComponents();

    // Handle different data structures
    let build = aiBuildData.build || aiBuildData;
    
    if (!build || typeof build !== 'object') {
      console.warn('[ComponentEnricher] Invalid build data structure');
      return aiBuildData;
    }

    const enriched: any = {};

    // Enrich each component type
    if (build.cpu) {
      enriched.cpu = enrichComponent(build.cpu, db.cpus, 'CPU');
    }
    
    if (build.motherboard) {
      enriched.motherboard = enrichComponent(build.motherboard, db.motherboards, 'Motherboard');
    }
    
    if (build.ram) {
      enriched.ram = enrichComponent(build.ram, db.rams, 'RAM');
    }
    
    if (build.gpu) {
      enriched.gpu = enrichComponent(build.gpu, db.gpus, 'GPU');
    }
    
    if (build.storage) {
      enriched.storage = enrichComponent(build.storage, db.storage, 'Storage');
    }
    
    if (build.psu) {
      enriched.psu = enrichComponent(build.psu, db.psus, 'PSU');
    }
    
    if (build.cooler) {
      enriched.cooler = enrichComponent(build.cooler, db.coolers, 'Cooler');
    }
    
    if (build.case) {
      enriched.case = enrichComponent(build.case, db.cases, 'Case');
    }

    console.log('[ComponentEnricher] ✓ Build enrichment complete');

    // Return enriched build with original metadata
    if (aiBuildData.build) {
      return {
        ...aiBuildData,
        build: enriched,
      };
    } else {
      return enriched;
    }
  } catch (error) {
    console.error('[ComponentEnricher] Error enriching build:', error);
    return aiBuildData; // Return original if enrichment fails
  }
}

/**
 * Enrich AI upgrade recommendations with images and links
 */
export async function enrichUpgradeRecommendations(aiUpgradeData: any): Promise<any> {
  console.log('[ComponentEnricher] Enriching upgrade recommendations...');
  
  try {
    const db = await loadAllComponents();

    if (!aiUpgradeData.recommendations || !Array.isArray(aiUpgradeData.recommendations)) {
      console.warn('[ComponentEnricher] Invalid upgrade data structure');
      return aiUpgradeData;
    }

    const componentType = aiUpgradeData.component_type?.toLowerCase();
    let dbComponents: ComponentData[] = [];

    // Map component type to database
    switch (componentType) {
      case 'cpu':
        dbComponents = db.cpus;
        break;
      case 'motherboard':
        dbComponents = db.motherboards;
        break;
      case 'ram':
      case 'memory':
        dbComponents = db.rams;
        break;
      case 'gpu':
      case 'graphics':
      case 'video card':
        dbComponents = db.gpus;
        break;
      case 'storage':
      case 'ssd':
      case 'hdd':
        dbComponents = db.storage;
        break;
      case 'psu':
      case 'power supply':
        dbComponents = db.psus;
        break;
      case 'cooler':
      case 'cpu cooler':
        dbComponents = db.coolers;
        break;
      case 'case':
        dbComponents = db.cases;
        break;
    }

    // Enrich each recommendation
    const enrichedRecommendations = aiUpgradeData.recommendations.map((rec: any) => {
      return enrichComponent(rec, dbComponents, componentType || 'Component');
    });

    console.log('[ComponentEnricher] ✓ Upgrade enrichment complete');

    return {
      ...aiUpgradeData,
      recommendations: enrichedRecommendations,
    };
  } catch (error) {
    console.error('[ComponentEnricher] Error enriching upgrades:', error);
    return aiUpgradeData; // Return original if enrichment fails
  }
}

/**
 * Clear component cache (useful for testing)
 */
export function clearComponentCache(): void {
  componentCache = null;
  console.log('[ComponentEnricher] Component cache cleared');
}
