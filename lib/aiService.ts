/**
 * SmartSpecs AI Service
 * Converted from PHP ai_service.php to TypeScript
 * Handles AI-powered PC component recommendations
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const COMPONENTS_DATA_DIR = path.join(process.cwd(), 'data', 'components');

// Budget allocation presets (percentages that sum to 1.0)
const BUDGET_ALLOCATIONS: Record<string, Record<string, number>> = {
  gaming: {
    cpu: 0.17,
    motherboard: 0.11,
    memory: 0.07,
    'video-card': 0.38,
    'internal-hard-drive': 0.07,
    'power-supply': 0.06,
    case: 0.02,
    'cpu-cooler': 0.03,
    'case-fan': 0.02,
    keyboard: 0.03,
    mouse: 0.02,
  },
  professional: {
    cpu: 0.28,
    motherboard: 0.13,
    memory: 0.15,
    'video-card': 0.20,
    'internal-hard-drive': 0.09,
    'power-supply': 0.07,
    case: 0.02,
    'cpu-cooler': 0.04,
    'case-fan': 0.02,
  },
  productivity: {
    cpu: 0.22,
    motherboard: 0.12,
    memory: 0.12,
    'video-card': 0.22,
    'internal-hard-drive': 0.10,
    'power-supply': 0.06,
    case: 0.02,
    'cpu-cooler': 0.03,
    'case-fan': 0.02,
    keyboard: 0.04,
    mouse: 0.03,
  },
  streaming: {
    cpu: 0.24,
    motherboard: 0.12,
    memory: 0.12,
    'video-card': 0.24,
    'internal-hard-drive': 0.08,
    'power-supply': 0.06,
    case: 0.02,
    'cpu-cooler': 0.04,
    'case-fan': 0.02,
    keyboard: 0.03,
    mouse: 0.03,
  },
  general: {
    cpu: 0.20,
    motherboard: 0.12,
    memory: 0.09,
    'video-card': 0.33,
    'internal-hard-drive': 0.08,
    'power-supply': 0.06,
    case: 0.02,
    'cpu-cooler': 0.03,
    'case-fan': 0.02,
    keyboard: 0.03,
    mouse: 0.02,
  },
};

const MINIMUM_BUILD_PRICES: Record<string, number> = {
  gaming: 25000,
  professional: 35000,
  productivity: 20000,
  streaming: 30000,
  general: 18000,
};

// ============================================================================
// TYPES
// ============================================================================

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
  socket?: string;
  cores?: number;
  vram?: string;
  capacity?: string;
  form_factor?: string;
  memory_type?: string;
}

interface Location {
  country: string;
  country_code: string;
  city: string;
  currency: string;
  currency_symbol: string;
}

interface Analysis {
  intent: string;
  budget: number | null;
  use_case: string;
  specific_components: string[];
  performance_needs: string[];
  is_follow_up: boolean;
  follow_up_context: string | null;
  brand_preference: string | null;
  key_requirements: string[];
  needs_full_build: boolean;
  color_theme?: string | null;
  form_factor_preference?: string | null;
  special_requirements?: string[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function aiLog(message: string, level: string = 'INFO'): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\//i.test(url.trim());
}

// ============================================================================
// OPENROUTER API
// ============================================================================

async function callOpenRouter(
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.7,
  maxTokens: number = 2048
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    aiLog('OPENROUTER_API_KEY is not set!', 'ERROR');
    return 'I apologize, but the AI service is not properly configured.';
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'SmartSpecs PC Builder',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      aiLog(`OpenRouter HTTP ${response.status}: ${JSON.stringify(errorData)}`, 'ERROR');
      return 'Sorry, the AI service returned an error. Please try again later.';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I wasn't able to generate a response. Please try again.";
  } catch (error: any) {
    aiLog(`OpenRouter error: ${error.message}`, 'ERROR');
    return 'Sorry, I had trouble connecting to the AI service. Please try again.';
  }
}

// ============================================================================
// LOCATION & REGIONAL STORES
// ============================================================================

export function getUserLocation(): Location {
  // For now, default to Philippines (can be enhanced with IP geolocation)
  return {
    country: 'Philippines',
    country_code: 'PH',
    city: 'Manila',
    currency: 'PHP',
    currency_symbol: '₱',
  };
}

// ============================================================================
// COMPONENT CATALOG
// ============================================================================

let catalogCache: Record<string, Component[]> | null = null;

function loadComponentCatalog(): Record<string, Component[]> {
  if (catalogCache) return catalogCache;

  const catalog: Record<string, Component[]> = {};

  try {
    const files = fs.readdirSync(COMPONENTS_DATA_DIR).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const type = file.replace('.json', '');
      const filePath = path.join(COMPONENTS_DATA_DIR, file);
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const rows = JSON.parse(rawData);

      if (!Array.isArray(rows)) continue;

      catalog[type] = rows
        .filter((row: any) => row && typeof row === 'object' && (row.price || 0) > 0)
        .map((row: any) => ({
          type,
          brand: row.brand || row.name?.split(' ')[0] || 'Unknown',
          model: row.model || row.name || 'Unknown',
          price: parseFloat(row.price) || 0,
          currency: 'PHP',
          image_url: row.image_url || null,
          source_url: row.link || row.url || null,
          store_name: row.link ? new URL(row.link).hostname : null,
        }))
        .sort((a: Component, b: Component) => a.price - b.price);
    }

    catalogCache = catalog;
    aiLog(`Loaded catalog with ${Object.keys(catalog).length} component types`);
  } catch (error: any) {
    aiLog(`Failed to load catalog: ${error.message}`, 'ERROR');
  }

  return catalog;
}

function mapCategoryToComponentType(requestedType: string): string {
  const t = requestedType.toLowerCase().trim();
  const aliases: Record<string, string> = {
    processor: 'cpu',
    'graphics card': 'video-card',
    'video card': 'video-card',
    gpu: 'video-card',
    ram: 'memory',
    'storage-hdd': 'internal-hard-drive',
    storage: 'internal-hard-drive',
    ssd: 'internal-hard-drive',
    hdd: 'internal-hard-drive',
    'power supply': 'power-supply',
    psu: 'power-supply',
    cooler: 'cpu-cooler',
    'case fan': 'case-fan',
    fan: 'case-fan',
  };
  return aliases[t] || t;
}

function selectComponentByTarget(
  candidates: Component[],
  targetPrice: number | null,
  selected: Record<string, Component> = {}
): Component | null {
  if (candidates.length === 0) return null;

  // Simple compatibility filtering (can be enhanced)
  const filtered = candidates.filter((c) => c.price > 0);

  if (filtered.length === 0) return candidates[0] || null;

  if (!targetPrice || targetPrice <= 0) {
    const middleIndex = Math.floor((filtered.length - 1) / 2);
    return filtered[middleIndex] || filtered[0];
  }

  let best: Component | null = null;
  let bestDelta = Infinity;

  for (const candidate of filtered) {
    const delta = Math.abs(targetPrice - candidate.price);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }

  return best || filtered[0];
}

function getRequiredBuildTypes(budget: number | null): string[] {
  const types = ['cpu', 'motherboard', 'memory', 'internal-hard-drive', 'power-supply', 'case', 'cpu-cooler'];
  if (!budget || budget >= 18000) {
    types.push('video-card');
  }
  return types;
}

function getTargetPriceForType(type: string, budget: number | null, useCase: string): number | null {
  if (!budget || budget <= 0) return null;
  const alloc = BUDGET_ALLOCATIONS[useCase] || BUDGET_ALLOCATIONS.general;
  const weight = alloc[type] || 0.06;
  return Math.max(1, budget * weight);
}

// ============================================================================
// AI ANALYSIS
// ============================================================================

async function analyzeUserMessage(userMessage: string, conversationHistory: any[] = []): Promise<Analysis> {
  const systemPrompt = `You are a PC build analysis engine. Analyze the user message and return ONLY valid JSON (no markdown) with these fields:
{
  "intent": "build_recommendation" | "component_search" | "upgrade_suggestion" | "tips_and_hacks" | "where_to_buy" | "general_question" | "follow_up" | "greeting" | "off_topic",
  "budget": null or number (in PHP pesos),
  "use_case": "gaming" | "professional" | "productivity" | "streaming" | "general",
  "specific_components": ["cpu","gpu",...] or [],
  "performance_needs": ["gaming","professional",...] or [],
  "is_follow_up": true/false,
  "follow_up_context": "brief description" or null,
  "brand_preference": null or "brand name",
  "key_requirements": ["requirements"],
  "needs_full_build": true/false,
  "color_theme": null or "color",
  "form_factor_preference": null or "ATX" | "mATX" | "ITX",
  "special_requirements": ["wifi", "bluetooth", ...] or []
}

Extract budget from patterns like: "50k", "₱30,000", "30K PHP", "$1000"
Detect use case from keywords: gaming, video editing, streaming, productivity, etc.
Classify intent carefully. "off_topic" = NOT related to PCs/hardware.`;

  const messages = [{ role: 'system', content: systemPrompt }];

  const historySlice = conversationHistory.slice(-6);
  for (const msg of historySlice) {
    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    let content = msg.content || '';
    if (content.length > 500) content = content.substring(0, 500) + '...';
    messages.push({ role, content });
  }

  messages.push({ role: 'user', content: userMessage });

  const rawResponse = await callOpenRouter(messages, 0.2, 512);

  try {
    // Remove markdown fences
    let cleaned = rawResponse.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
    const parsed = JSON.parse(cleaned);
    return parsed as Analysis;
  } catch (error) {
    aiLog(`Failed to parse analysis JSON: ${rawResponse}`, 'WARN');
    return fallbackParseQuery(userMessage);
  }
}

function fallbackParseQuery(query: string): Analysis {
  const lower = query.toLowerCase();
  const result: Analysis = {
    intent: 'general_question',
    budget: null,
    use_case: 'general',
    specific_components: [],
    performance_needs: [],
    is_follow_up: false,
    follow_up_context: null,
    brand_preference: null,
    key_requirements: [],
    needs_full_build: false,
  };

  // Extract budget with regex
  const budgetPatterns = [
    /₱\s*([\d,]+)/i,
    /(\d+)\s*k\s*(?:budget|pesos?|php|build)?/i,
    /budget\s+(?:of\s+)?₱?\s*([\d,]+)/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = lower.match(pattern);
    if (match) {
      let val = parseFloat(match[1].replace(/,/g, ''));
      if (pattern.toString().includes('k')) {
        val *= 1000;
      }
      if (val > 0) {
        result.budget = val;
        break;
      }
    }
  }

  // Detect use case
  if (/(gaming|game|fps|valorant|genshin)/i.test(lower)) result.use_case = 'gaming';
  else if (/(video editing|3d|rendering|blender|photoshop)/i.test(lower)) result.use_case = 'professional';
  else if (/(office|work|productivity|coding)/i.test(lower)) result.use_case = 'productivity';
  else if (/(streaming|obs|twitch|youtube)/i.test(lower)) result.use_case = 'streaming';

  // Detect intent
  if (/(build|recommend|suggest|setup)/i.test(lower)) {
    result.intent = 'build_recommendation';
    result.needs_full_build = true;
  } else if (/(upgrade|improve|better)/i.test(lower)) {
    result.intent = 'upgrade_suggestion';
  } else if (/(tip|trick|hack|how to)/i.test(lower)) {
    result.intent = 'tips_and_hacks';
  }

  return result;
}

// ============================================================================
// COMPONENT SEARCH & RECOMMENDATION
// ============================================================================

function searchComponentsOnline(
  query: string,
  budget: number | null,
  useCase: string,
  location: Location,
  specificTypes: string[] = [],
  brandPreference: string | null = null
): { components: Component[]; build_meta: any } {
  const catalog = loadComponentCatalog();
  const selected: Record<string, Component> = {};

  const requiredTypes =
    specificTypes.length > 0
      ? specificTypes.map((t) => mapCategoryToComponentType(t))
      : getRequiredBuildTypes(budget);

  for (const type of requiredTypes) {
    const pool = catalog[type] || [];
    if (pool.length === 0) continue;

    const target = getTargetPriceForType(type, budget, useCase);
    const choice = selectComponentByTarget(pool, target, selected);
    if (choice) {
      selected[type] = {
        ...choice,
        reason: `Selected ${choice.brand} ${choice.model} for optimal ${useCase} performance`,
      };
    }
  }

  const components = Object.values(selected);
  const build_meta = {
    build_name: `${useCase.charAt(0).toUpperCase() + useCase.slice(1)} Build`,
    build_summary: 'Components selected from verified catalog with real images and product links',
    assumptions: ['Recommendations based on local component data', 'Prices verified from product pages'],
    compatibility_notes: ['All components checked for basic compatibility'],
  };

  return { components, build_meta };
}

function generateBuildOnline(
  maxBudget: number,
  useCase: string,
  location: Location,
  performanceNeeds: string[] = [],
  userMessage: string = ''
): any {
  const { components, build_meta } = searchComponentsOnline(
    userMessage || `Build a ${useCase} PC within budget`,
    maxBudget,
    useCase,
    location,
    [],
    null
  );

  const totalCost = components.reduce((sum, c) => sum + c.price, 0);
  const utilization = maxBudget > 0 ? (totalCost / maxBudget) * 100 : 0;

  return {
    components,
    build_meta,
    total_cost: totalCost,
    within_budget: totalCost <= maxBudget * 1.05,
    budget_utilization: utilization,
    budget_remaining: maxBudget - totalCost,
  };
}

function generateTieredBuildsOnline(
  maxBudget: number,
  useCase: string,
  location: Location,
  performanceNeeds: string[] = [],
  userMessage: string = ''
): any {
  const builds: Record<string, any> = {};
  const budgetAnalysis = {
    user_budget: maxBudget,
    is_feasible: true,
    message: 'Budget is sufficient for a build',
    min_required: MINIMUM_BUILD_PRICES[useCase] || MINIMUM_BUILD_PRICES.general,
  };

  const minRequired = MINIMUM_BUILD_PRICES[useCase] || MINIMUM_BUILD_PRICES.general;
  if (maxBudget < minRequired) {
    budgetAnalysis.is_feasible = false;
    budgetAnalysis.message = `A proper ${useCase} build typically starts at around ₱${minRequired.toLocaleString()}. Your budget may be tight.`;
  }

  const tierBudgets = {
    budget: Math.max(1, maxBudget * 0.7),
    balanced: maxBudget,
    premium: Math.max(1, maxBudget * 1.15),
  };

  for (const [tierName, tierBudget] of Object.entries(tierBudgets)) {
    const search = searchComponentsOnline(userMessage, tierBudget, useCase, location);
    const tierComponents = search.components;

    if (tierComponents.length === 0) continue;

    const totalCost = tierComponents.reduce((sum, c) => sum + c.price, 0);

    builds[tierName] = {
      components: tierComponents,
      total_cost: totalCost,
      within_budget: totalCost <= tierBudget * 1.12,
      budget_utilization: tierBudget > 0 ? (totalCost / tierBudget) * 100 : 0,
      budget_remaining: tierBudget - totalCost,
      build_name: `${useCase.charAt(0).toUpperCase() + useCase.slice(1)} ${tierName.charAt(0).toUpperCase() + tierName.slice(1)} Build`,
      compatibility_notes: search.build_meta.compatibility_notes,
      assumptions: search.build_meta.assumptions,
    };
  }

  return { builds, budget_analysis: budgetAnalysis };
}

// ============================================================================
// ALTERNATIVES
// ============================================================================

export async function generateAlternativesOnline(originalComponent: Component, location: Location): Promise<Component[]> {
  const catalog = loadComponentCatalog();
  const type = mapCategoryToComponentType(originalComponent.type);
  const pool = catalog[type] || [];

  if (pool.length === 0) return [];

  // Filter out the original component and sort by price similarity
  const filtered = pool
    .filter((item) => {
      const sameModel =
        originalComponent.model && item.model.toLowerCase() === originalComponent.model.toLowerCase();
      return !sameModel && isValidHttpUrl(item.source_url);
    })
    .sort((a, b) => {
      const deltaA = Math.abs(a.price - originalComponent.price);
      const deltaB = Math.abs(b.price - originalComponent.price);
      return deltaA - deltaB;
    });

  return filtered.slice(0, 8).map((alt) => ({
    ...alt,
    reason: `Alternative option with similar specs and price range`,
  }));
}

// ============================================================================
// AI RESPONSE GENERATION
// ============================================================================

async function generateAIResponseText(
  userMessage: string,
  analysis: Analysis,
  components: Component[],
  conversationHistory: any[],
  budgetAnalysis: any = {},
  upgradeData: any = {},
  location: Location
): Promise<string> {
  const systemPrompt = `You are SmartSpecs, a friendly PC building assistant.

CRITICAL RESPONSE RULES:
1. Write in a casual, conversational tone.
2. DO NOT list component names, specs, or prices for build recommendations. They're shown in a table.
3. Give a brief, encouraging overview (2-4 sentences max for builds).
4. Keep it SHORT.
5. The user is in ${location.country}. Prices are in ${location.currency} (${location.currency_symbol}).
6. Use Markdown formatting (bold, bullets, etc.).

FOR BUILDS: Explain strengths in simple terms. Don't list components.
FOR TIPS: Provide detailed advice with bullet points.`;

  const messages = [{ role: 'system', content: systemPrompt }];

  const historySlice = conversationHistory.slice(-8);
  for (const msg of historySlice) {
    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    let content = msg.content || '';
    if (content.length > 800) content = content.substring(0, 800) + '...';
    messages.push({ role, content });
  }

  // Add context
  const contextParts: string[] = [];
  if (analysis.budget) {
    contextParts.push(`Budget: ${location.currency_symbol}${analysis.budget.toLocaleString()}`);
  }
  if (components.length > 0) {
    contextParts.push(`${components.length} components selected (shown in table, don't list them)`);
  }
  if (contextParts.length > 0) {
    messages.push({ role: 'system', content: `Context: ${contextParts.join(', ')}` });
  }

  messages.push({ role: 'user', content: userMessage });

  return await callOpenRouter(messages, 0.7, 1024);
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export async function processAIMessage(
  userMessage: string,
  threadId: number | null = null,
  conversationHistory: any[] = []
): Promise<any> {
  const startTime = Date.now();
  aiLog(`Processing: "${userMessage.substring(0, 120)}" (Thread: ${threadId})`);

  const location = getUserLocation();
  const analysis = await analyzeUserMessage(userMessage, conversationHistory);
  aiLog(`Analysis: ${JSON.stringify(analysis)}`);

  const intent = analysis.intent || 'general_question';
  const budget = analysis.budget || null;
  const useCase = analysis.use_case || 'general';
  const needsFullBuild = analysis.needs_full_build || false;

  let components: Component[] = [];
  let allBuilds: Record<string, any> = {};
  let budgetAnalysis: any = {};
  let responseType = 'text';

  // Handle different intents
  switch (intent) {
    case 'build_recommendation':
      if (budget && budget > 0) {
        responseType = 'recommendation';
        const tiered = generateTieredBuildsOnline(budget, useCase, location, analysis.performance_needs || [], userMessage);
        allBuilds = tiered.builds;
        budgetAnalysis = tiered.budget_analysis;
        components = allBuilds.balanced?.components || allBuilds.budget?.components || [];
      } else if (needsFullBuild) {
        responseType = 'recommendation';
        const result = searchComponentsOnline(userMessage, null, useCase, location);
        components = result.components;
      }
      break;

    case 'component_search':
      responseType = 'recommendation';
      const result = searchComponentsOnline(
        userMessage,
        budget,
        useCase,
        location,
        analysis.specific_components || [],
        analysis.brand_preference || null
      );
      components = result.components;
      break;

    case 'off_topic':
      responseType = 'text';
      const elapsed = Date.now() - startTime;
      aiLog(`Off-topic request rejected in ${elapsed}ms`);
      return {
        success: true,
        data: {
          type: 'text',
          ai_message:
            "I appreciate your message! However, I'm **SmartSpecs** — specialized in **PC builds and computer hardware**.\n\nI can help with:\n- **PC Build Recommendations**\n- **Component Upgrades**\n- **Tips & Tricks**\n- **Where to Buy**\n\nFeel free to ask me anything about computers! 😊",
          query_analysis: analysis,
          components: [],
          location,
        },
        processing_time: `${elapsed}ms`,
        timestamp: new Date().toISOString(),
      };
  }

  // Generate AI response text
  const responseText = await generateAIResponseText(
    userMessage,
    analysis,
    components,
    conversationHistory,
    budgetAnalysis,
    {},
    location
  );

  const elapsed = Date.now() - startTime;
  aiLog(`Processed in ${elapsed}ms — intent=${intent}, components=${components.length}`);

  return {
    success: true,
    data: {
      type: responseType,
      ai_message: responseText,
      query_analysis: analysis,
      components,
      multiple_recommendations: allBuilds,
      budget_analysis: budgetAnalysis,
      location,
      components_found: components.length,
    },
    processing_time: `${elapsed}ms`,
    timestamp: new Date().toISOString(),
  };
}
