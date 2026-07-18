/**
 * AI Recommendations Engine
 * Generates compatible PC builds based on budget, use case, and preferences
 */

import { getComponentLoader, type Component, type BuildTier, budgetAllocations } from './component-loader';

interface RecommendationRequest {
  budget: number;
  useCase: 'gaming' | 'professional' | 'productivity' | 'streaming' | 'general';
  preferences?: {
    brand?: string[];
    excludeComponents?: string[];
    performance?: 'budget' | 'balanced' | 'premium';
  };
}

interface RecommendationResponse {
  request: RecommendationRequest;
  builds: BuildTier[];
  analysis: {
    feasible: boolean;
    minBudgetRequired: number;
    recommendations: string[];
    warnings: string[];
  };
}

/**
 * Analyze user message to extract budget and use case
 */
export function analyzeUserRequest(message: string): Partial<RecommendationRequest> {
  const result: Partial<RecommendationRequest> = {};

  // USD to PHP conversion rate
  const USD_TO_PHP = 57;

  // Extract budget - try USD patterns first, then PHP
  const usdPatterns = [
    /under\s+\$\s*([\d,]+)/i,
    /\$\s*([\d,]+)/,
    /([\d,]+)\s+dollars?/i,
    /under\s+([\d,]+)\s+dollars?/i,
    /budget\s+(?:of\s+)?\$?\s*([\d,]+)\s+(?:usd|dollars?)/i,
  ];

  const phpPatterns = [
    /under\s+(?:₱|php)\s*([\d,]+)/i,
    /budget\s+(?:of\s+)?(?:₱|php)\s*([\d,]+)/i,
    /max(?:imum)?\s+(?:₱|php)\s*([\d,]+)/i,
    /(?:₱|php)\s*([\d,]+)/i,
    /([\d,]+)\s+(?:pesos?|php)/i,
    /([\d]+)\s*k\s*(?:budget|pesos?|build)?/i,
    /\b(\d{4,6})\b.*(?:budget|build|setup|pc)/i,
  ];

  // Try USD patterns first
  for (const pattern of usdPatterns) {
    const match = message.match(pattern);
    if (match) {
      let budget = parseInt(match[1].replace(/,/g, ''));
      if (budget > 0 && budget < 10000) { // Reasonable USD range
        result.budget = Math.round(budget * USD_TO_PHP); // Convert to PHP
        break;
      }
    }
  }

  // If no USD match, try PHP patterns
  if (!result.budget) {
    for (const pattern of phpPatterns) {
      const match = message.match(pattern);
      if (match) {
        let budget = parseInt(match[1].replace(/,/g, ''));
        // If ends with 'k', multiply by 1000
        if (match[0].toLowerCase().includes('k')) {
          budget = budget * 1000;
        }
        if (budget > 0) {
          result.budget = budget;
          break;
        }
      }
    }
  }

  // Extract use case
  const useCaseKeywords = {
    gaming: [
      'gaming',
      'game',
      'fps',
      '1080p',
      '1440p',
      '4k',
      'esports',
      'competitive',
      'high-performance',
    ],
    professional: [
      'rendering',
      'video editing',
      '3d modeling',
      'cad',
      'autocad',
      'photoshop',
      'premiere',
      'blender',
      'professional',
      'workstation',
    ],
    productivity: [
      'office',
      'work',
      'school',
      'multitasking',
      'productivity',
      'programming',
      'coding',
      'development',
    ],
    streaming: [
      'streaming',
      'twitch',
      'youtube',
      'content creation',
      'obs',
      'broadcast',
    ],
    general: ['general', 'everyday', 'casual', 'web browsing', 'basic'],
  };

  const lowerMessage = message.toLowerCase();
  for (const [useCase, keywords] of Object.entries(useCaseKeywords)) {
    if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
      result.useCase = useCase as any;
      break;
    }
  }

  // Default to gaming if no use case detected but budget found
  if (!result.useCase && result.budget) {
    result.useCase = 'gaming';
  }

  return result;
}

/**
 * Generate AI-powered recommendations
 */
export async function generateRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const loader = await getComponentLoader();

  // Validate request
  const analysis = {
    feasible: false,
    minBudgetRequired: 0,
    recommendations: [] as string[],
    warnings: [] as string[],
  };

  // Check if budget is sufficient
  const minBudgets = {
    gaming: 25000,
    professional: 35000,
    productivity: 20000,
    streaming: 30000,
    general: 18000,
  };

  const minBudget = minBudgets[request.useCase];
  analysis.minBudgetRequired = minBudget;

  if (request.budget < minBudget) {
    analysis.warnings.push(
      `Budget of ₱${request.budget.toLocaleString()} is below recommended minimum of ₱${minBudget.toLocaleString()} for ${request.useCase} use.`
    );
    analysis.feasible = false;
  } else {
    analysis.feasible = true;
  }

  // Generate builds
  const builds = loader.generateTieredBuilds(request.budget, request.useCase);

  // Add recommendations
  if (builds.length === 0) {
    analysis.warnings.push('Could not generate builds with available components.');
  } else {
    const topBuild = builds[builds.length - 1]; // Most expensive tier
    analysis.recommendations.push(
      `Recommended build: ${topBuild.name} at ₱${topBuild.totalPrice.toLocaleString()}`
    );

    // Component-specific recommendations
    const gpuComponent = topBuild.components.find((c) => c.type === 'gpu');
    if (gpuComponent) {
      const performance = gpuComponent.specs.performance || 'mid-range';
      analysis.recommendations.push(
        `GPU: ${gpuComponent.brand} ${gpuComponent.model} - Suitable for ${request.useCase}`
      );
    }

    const cpuComponent = topBuild.components.find((c) => c.type === 'cpu');
    if (cpuComponent) {
      const cores = cpuComponent.specs.core_count || 'unknown';
      analysis.recommendations.push(
        `CPU: ${cpuComponent.brand} ${cpuComponent.model} (${cores} cores)`
      );
    }
  }

  return {
    request,
    builds,
    analysis,
  };
}

/**
 * Get component specifications as formatted string
 */
export function formatComponentSpecs(component: Component): string {
  const specs = component.specs;
  const lines: string[] = [];

  if (component.type === 'cpu') {
    if (specs.core_count) lines.push(`${specs.core_count} cores`);
    if (specs.core_clock) lines.push(`${specs.core_clock}GHz base`);
    if (specs.tdp) lines.push(`${specs.tdp}W TDP`);
  }

  if (component.type === 'gpu') {
    if (specs.memory) lines.push(`${specs.memory}GB VRAM`);
    if (specs.memory_type) lines.push(specs.memory_type);
    if (specs.tdp) lines.push(`${specs.tdp}W power`);
  }

  if (component.type === 'ram') {
    if (specs.capacity) lines.push(specs.capacity);
    if (specs.speed) lines.push(`${specs.speed}MHz`);
    if (specs.type) lines.push(specs.type);
  }

  if (component.type === 'storage-hdd' || component.type === 'storage') {
    if (specs.capacity) lines.push(specs.capacity);
    if (specs.type) lines.push(specs.type);
    if (specs.interface) lines.push(specs.interface);
  }

  if (component.type === 'psu') {
    if (specs.wattage) lines.push(`${specs.wattage}W`);
    if (specs.efficiency) lines.push(specs.efficiency);
    if (specs.modular) lines.push('Modular');
  }

  return lines.length > 0 ? lines.join(' • ') : 'Specifications unavailable';
}

/**
 * Calculate total wattage required for build
 */
export function calculateTotalPower(components: Component[]): number {
  let totalWattage = 0;

  for (const component of components) {
    if (component.type === 'cpu') {
      totalWattage += component.tdp || 0;
    } else if (component.type === 'gpu') {
      totalWattage += component.tdp || 150; // Default GPU TDP
    } else if (component.type === 'case-fan') {
      totalWattage += component.specs.power || 5;
    }
  }

  // Add motherboard, cooler, storage overhead (~20%)
  return Math.round(totalWattage * 1.2);
}

/**
 * Check build compatibility
 */
export function checkBuildCompatibility(components: Component[]): {
  compatible: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const cpuComponent = components.find((c) => c.type === 'cpu');
  const mbComponent = components.find((c) => c.type === 'motherboard');
  const ramComponent = components.find((c) => c.type === 'ram');
  const gpuComponent = components.find((c) => c.type === 'gpu');
  const psuComponent = components.find((c) => c.type === 'psu');
  const caseComponent = components.find((c) => c.type === 'case');

  // Check CPU-Motherboard socket compatibility
  if (cpuComponent && mbComponent) {
    const cpuSocket = cpuComponent.socket || cpuComponent.specs.socket;
    const mbSocket = mbComponent.socket || mbComponent.specs.socket;

    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      issues.push(`CPU socket (${cpuSocket}) doesn't match motherboard (${mbSocket})`);
    }
  }

  // Check RAM compatibility
  if (ramComponent && mbComponent) {
    const ramType = ramComponent.specs.type || ramComponent.formFactor;
    const mbSupport = mbComponent.specs.memory_supported || [];

    if (Array.isArray(mbSupport) && mbSupport.length > 0 && !mbSupport.includes(ramType)) {
      issues.push(`RAM type (${ramType}) may not be supported by motherboard`);
    }
  }

  // Check PSU wattage
  if (psuComponent && gpuComponent) {
    const psuWatts = psuComponent.wattage || psuComponent.specs.wattage;
    const requiredWatts = calculateTotalPower(components);

    if (psuWatts && requiredWatts && psuWatts < requiredWatts) {
      issues.push(
        `PSU wattage (${psuWatts}W) may be insufficient (${requiredWatts}W required)`
      );
    } else if (psuWatts) {
      recommendations.push(
        `PSU has ${Math.round(((psuWatts - requiredWatts) / psuWatts) * 100)}% headroom`
      );
    }
  }

  // Check case fit
  if (caseComponent && gpuComponent) {
    const gpuLength = gpuComponent.specs.length || 300;
    const caseSize = caseComponent.specs.size || 'mid-tower';

    if (caseSize === 'mini-tower' && gpuLength > 250) {
      recommendations.push('GPU might be tight fit in mini-tower case - verify dimensions');
    }
  }

  return {
    compatible: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Generate comparison between builds
 */
export function generateBuildComparison(builds: BuildTier[]): string {
  if (builds.length === 0) return 'No builds to compare';

  let comparison = '**Build Comparison:**\n\n';

  for (const build of builds) {
    comparison += `**${build.name}** - ₱${build.totalPrice.toLocaleString()}\n`;
    comparison += `Budget: ${Math.round((build.totalPrice / build.budget) * 100)}% used\n`;
    comparison += 'Components:\n';

    for (const component of build.components) {
      comparison += `  • ${component.type}: ${component.brand} ${component.model}\n`;
    }

    comparison += '\n';
  }

  return comparison;
}
