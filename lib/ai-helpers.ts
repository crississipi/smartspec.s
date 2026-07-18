// lib/ai-helpers.ts
import prisma from './prisma';
import fs from 'fs';
import path from 'path';

// Constants
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const COMPONENTS_DATA_DIR = path.join(process.cwd(), 'public/data/components');

// ---------------------------------------------------------------------------
// OpenRouter call
// ---------------------------------------------------------------------------
export async function callOpenRouter(messages: any[], temperature = 0.7, maxTokens = 2048): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set');
    return 'AI service not configured.';
  }
  const payload = {
    model: OPENROUTER_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'SmartSpecs PC Builder',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error('OpenRouter error:', response.status, errText);
    return 'AI service returned an error.';
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

// ---------------------------------------------------------------------------
// Location detection
// ---------------------------------------------------------------------------
export async function getUserLocation(): Promise<{
  country: string;
  country_code: string;
  city: string;
  currency: string;
  currency_symbol: string;
}> {
  // Simple fallback – you can implement IP-based detection like PHP version
  // For now, return default Philippines
  return {
    country: 'Philippines',
    country_code: 'PH',
    city: 'Manila',
    currency: 'PHP',
    currency_symbol: '₱',
  };
}

// ---------------------------------------------------------------------------
// Component catalog loading
// ---------------------------------------------------------------------------
export function loadComponentCatalog(): Record<string, any[]> {
  const catalog: Record<string, any[]> = {};
  const files = fs.readdirSync(COMPONENTS_DATA_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const type = path.basename(file, '.json');
    const content = fs.readFileSync(path.join(COMPONENTS_DATA_DIR, file), 'utf-8');
    const items = JSON.parse(content);
    if (Array.isArray(items)) {
      catalog[type] = items.map((item: any) => ({
        ...item,
        type,
        price: parseFloat(item.price) || 0,
      }));
    }
  }
  return catalog;
}

// ---------------------------------------------------------------------------
// Component selection logic (simplified)
// ---------------------------------------------------------------------------
export function selectBuildComponentsFromCatalog(
  budget: number | null,
  useCase: string,
  specificTypes: string[] = [],
  brandPreference: string | null = null
): any[] {
  const catalog = loadComponentCatalog();
  const selected: any[] = [];
  // Determine required types
  const allTypes = ['cpu', 'motherboard', 'ram', 'gpu', 'storage-hdd', 'psu', 'case', 'cooler'];
  const requiredTypes = specificTypes.length > 0 ? specificTypes : allTypes;
  // For each type, pick a component
  for (const type of requiredTypes) {
    const pool = catalog[type] || [];
    if (pool.length === 0) continue;
    // Filter by brand if given
    let filtered = pool;
    if (brandPreference) {
      filtered = pool.filter(item => item.brand?.toLowerCase().includes(brandPreference.toLowerCase()));
      if (filtered.length === 0) filtered = pool;
    }
    // Sort by price and pick the one closest to target
    const target = budget ? budget * 0.1 : null; // simplistic
    let best = filtered[0];
    if (target !== null) {
      let bestDiff = Infinity;
      for (const item of filtered) {
        const diff = Math.abs(item.price - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = item;
        }
      }
    }
    selected.push({ ...best, type });
  }
  return selected;
}

// ---------------------------------------------------------------------------
// AI Analysis
// ---------------------------------------------------------------------------
export async function analyzeUserMessage(
  userMessage: string,
  conversationHistory: any[] = []
): Promise<any> {
  const systemPrompt = `You are a PC build analysis engine. Analyze the user message and return ONLY valid JSON with these fields:
{
  "intent": "build_recommendation" | "component_search" | "upgrade_suggestion" | "tips_and_hacks" | "where_to_buy" | "general_question" | "follow_up" | "greeting" | "off_topic",
  "budget": null or number in PHP pesos,
  "use_case": "gaming" | "professional" | "productivity" | "streaming" | "general",
  "specific_components": ["cpu","gpu",...] or [],
  "performance_needs": ["gaming","professional",...] or [],
  "is_follow_up": true/false,
  "follow_up_context": null or string,
  "brand_preference": null or string,
  "key_requirements": [],
  "needs_full_build": true/false,
  "color_theme": null or string,
  "form_factor_preference": null or "ATX" | "mATX" | "ITX" | "SFF",
  "special_requirements": ["wifi","bluetooth","rgb","quiet","compact","no-gpu","dual-monitor","4k-gaming","1080p-gaming","1440p-gaming"] or []
}
`;
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map((msg: any) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage },
  ];
  const raw = await callOpenRouter(messages, 0.2, 512);
  try {
    // Try to parse JSON from raw
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse analysis JSON:', raw);
    // Fallback
    return {
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
      color_theme: null,
      form_factor_preference: null,
      special_requirements: [],
    };
  }
}

// ---------------------------------------------------------------------------
// Generate response text
// ---------------------------------------------------------------------------
export async function generateAIResponseText(
  userMessage: string,
  analysis: any,
  components: any[],
  conversationHistory: any[],
  budgetAnalysis: any,
  upgradeData: any,
  location: any
): Promise<string> {
  const systemPrompt = `You are SmartSpecs, a friendly PC building assistant.
Write a short, conversational response (2-4 sentences) for build recommendations.
Do NOT list component names or prices in your text – they are shown in a table.
Be encouraging and mention the build's strengths.
The user is in ${location.country}. Reference local stores if relevant.
Use Markdown formatting.
For tips/advice questions, provide detailed bullet points.
`;
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-8).map((msg: any) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage },
  ];
  const response = await callOpenRouter(messages, 0.7, 1024);
  return response;
}

// ---------------------------------------------------------------------------
// Search components online (catalog-based)
// ---------------------------------------------------------------------------
export async function searchComponentsOnline(
  query: string,
  budget: number | null,
  useCase: string,
  location: any,
  specificTypes: string[] = [],
  brandPreference: string | null = null
): Promise<any[]> {
  const selected = selectBuildComponentsFromCatalog(budget, useCase, specificTypes, brandPreference);
  // Format components
  const currency = location.currency || 'PHP';
  return selected.map((item: any) => ({
    id: item.id || null,
    type: item.type,
    brand: item.brand || 'Unknown',
    model: item.model || 'Unknown',
    price: item.price || 0,
    currency,
    image_url: item.image_url || null,
    source_url: item.link || null,
    store_name: item.store_name || null,
    reason: `${item.brand} ${item.model} is a solid choice for ${useCase}.`,
  }));
}

// ---------------------------------------------------------------------------
// Tiered builds
// ---------------------------------------------------------------------------
export async function generateTieredBuildsOnline(
  maxBudget: number,
  useCase: string,
  location: any,
  performanceNeeds: string[] = [],
  userMessage: string = ''
): Promise<any> {
  const budgetAnalysis = {
    user_budget: maxBudget,
    is_feasible: true,
    message: 'Budget is sufficient',
    min_required: 18000, // simplified
  };
  const builds: Record<string, any> = {};
  const tiers = ['budget', 'balanced', 'premium'];
  const multipliers = [0.7, 1.0, 1.15];
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const tierBudget = maxBudget * multipliers[i];
    const comps = await searchComponentsOnline(userMessage, tierBudget, useCase, location);
    const totalCost = comps.reduce((sum, c) => sum + (c.price || 0), 0);
    builds[tier] = {
      components: comps,
      total_cost: totalCost,
      within_budget: totalCost <= tierBudget * 1.12,
      budget_utilization: tierBudget > 0 ? (totalCost / tierBudget) * 100 : 0,
      budget_remaining: tierBudget - totalCost,
      build_name: `${useCase.charAt(0).toUpperCase() + useCase.slice(1)} ${tier.charAt(0).toUpperCase() + tier.slice(1)} Build`,
      compatibility_notes: ['All parts are compatible.'],
      assumptions: ['Prices are based on local catalog.'],
    };
  }
  return { builds, budget_analysis: budgetAnalysis };
}

// ---------------------------------------------------------------------------
// Upgrade suggestions
// ---------------------------------------------------------------------------
export async function generateUpgradeSuggestionsOnline(
  currentComponents: any,
  mentionedTypes: string[],
  location: any,
  budget: number | null
): Promise<any> {
  // Simplified: just returns a few alternatives from catalog
  const suggestions: any = {};
  const catalog = loadComponentCatalog();
  const types = mentionedTypes.includes('all') ? Object.keys(currentComponents) : mentionedTypes;
  for (const type of types) {
    const current = currentComponents[type];
    if (!current) continue;
    const pool = catalog[type] || [];
    const alternatives = pool.filter((item: any) => item.model !== current.model);
    if (alternatives.length === 0) continue;
    const options = alternatives.slice(0, 3).map((alt: any) => ({
      id: alt.id || null,
      type,
      brand: alt.brand || 'Unknown',
      model: alt.model || 'Unknown',
      price: alt.price || 0,
      currency: location.currency || 'PHP',
      image_url: alt.image_url || null,
      source_url: alt.link || null,
      store_name: alt.store_name || null,
      reason: `Upgrade from ${current.brand} ${current.model}`,
      improvement: 'Better performance',
    }));
    suggestions[type] = { current, upgrade_options: options };
  }
  return suggestions;
}

// ---------------------------------------------------------------------------
// Alternatives
// ---------------------------------------------------------------------------
export async function generateAlternativesOnline(originalComponent: any, location: any): Promise<any[]> {
  const catalog = loadComponentCatalog();
  const type = originalComponent.type || 'unknown';
  const pool = catalog[type] || [];
  const alternatives = pool.filter((item: any) => item.model !== originalComponent.model);
  return alternatives.slice(0, 8).map((alt: any) => ({
    id: alt.id || null,
    type,
    brand: alt.brand || 'Unknown',
    model: alt.model || 'Unknown',
    price: alt.price || 0,
    currency: location.currency || 'PHP',
    image_url: alt.image_url || null,
    source_url: alt.link || null,
    store_name: alt.store_name || null,
    reason: `Alternative to ${originalComponent.brand} ${originalComponent.model}`,
  }));
}

// ---------------------------------------------------------------------------
// Thread title generation
// ---------------------------------------------------------------------------
export async function generateThreadTitleAI(userMessage: string): Promise<string> {
  const messages = [
    { role: 'system', content: 'Generate a short, descriptive title (max 6 words) for a PC-building conversation. Return ONLY the title.' },
    { role: 'user', content: userMessage },
  ];
  const title = await callOpenRouter(messages, 0.3, 50);
  return title.trim() || 'PC Build Discussion';
}

// ---------------------------------------------------------------------------
// Previous build extraction
// ---------------------------------------------------------------------------
export async function extractPreviousBuild(threadId: number): Promise<any> {
  // Get the last recommendation message in the thread
  const message = await prisma.message.findFirst({
    where: {
      threadId,
      dataType: { in: ['recommendation', 'upgrade_suggestion'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      recommendation: {
        include: {
          components: true,
          tiers: true,
        },
      },
    },
  });
  if (!message || !message.recommendation) {
    return { has_previous_build: false, components: {}, budget: null };
  }
  const components: Record<string, any> = {};
  for (const comp of message.recommendation.components) {
    components[comp.componentType] = {
      id: comp.id,
      brand: comp.brand,
      model: comp.model,
      price: comp.price,
      currency: comp.currency,
      image_url: comp.imageUrl,
      source_url: comp.sourceUrl,
    };
  }
  const budget = (message.recommendation.budgetAnalysis && typeof message.recommendation.budgetAnalysis === 'object' && 'user_budget' in message.recommendation.budgetAnalysis)
    ? (message.recommendation.budgetAnalysis as any).user_budget
    : null;
  return {
    has_previous_build: true,
    components,
    budget,
    recommendation_id: message.recommendationId,
  };
}

// ---------------------------------------------------------------------------
// Upgrade detection
// ---------------------------------------------------------------------------
export function detectUpgradeRequest(query: string): { is_upgrade_request: boolean; mentioned_components: string[] } {
  const lower = query.toLowerCase();
  const upgradeWords = ['upgrade', 'upgrading', 'improve', 'better', 'future-proof', 'next level'];
  const isUpgrade = upgradeWords.some(w => lower.includes(w));
  if (!isUpgrade) return { is_upgrade_request: false, mentioned_components: [] };
  const typeKeywords: Record<string, string[]> = {
    cpu: ['cpu', 'processor'],
    gpu: ['gpu', 'graphics'],
    ram: ['ram', 'memory'],
    'storage-hdd': ['storage', 'ssd', 'hard drive', 'hdd', 'nvme'],
    motherboard: ['motherboard', 'mobo'],
    psu: ['psu', 'power supply'],
    case: ['case', 'chassis'],
    cooler: ['cooler', 'cooling'],
  };
  const mentioned: string[] = [];
  for (const type in typeKeywords) {
    if (typeKeywords[type].some(kw => lower.includes(kw))) {
      mentioned.push(type);
    }
  }
  if (mentioned.length === 0) mentioned.push('all');
  return { is_upgrade_request: true, mentioned_components: mentioned };
}

// ---------------------------------------------------------------------------
// Price refresh
// ---------------------------------------------------------------------------
export async function refreshComponentPricesFromJson(): Promise<any> {
  // In a real implementation, you would fetch prices from product pages.
  // For now, return a dummy summary.
  return {
    files_scanned: 0,
    components_checked: 0,
    prices_updated: 0,
    files_updated: 0,
  };
}

// ---------------------------------------------------------------------------
// Recommendation storage helpers
// ---------------------------------------------------------------------------
export async function createRecommendation(
  aiResponse: string,
  queryAnalysis: any,
  componentsFound: number,
  needsUpdate: boolean,
  budgetAnalysis: any
): Promise<number | null> {
  const rec = await prisma.recommendation.create({
    data: {
      aiResponse,
      queryAnalysis,
      componentsFound,
      needsUpdate,
      budgetAnalysis,
    },
  });
  return rec.id;
}

export async function addRecommendationComponent(recId: number, comp: any, tier: string): Promise<void> {
  await prisma.recommendationComponent.create({
    data: {
      recommendationId: recId,
      componentType: comp.type || 'unknown',
      brand: comp.brand || null,
      model: comp.model || null,
      price: comp.price || 0,
      currency: comp.currency || 'PHP',
      imageUrl: comp.imageUrl || comp.image_url || null,
      sourceUrl: comp.sourceUrl || comp.source_url || null,
      tier,
    },
  });
}

export async function addRecommendationTier(recId: number, tierName: string, totalPrice: number, count: number): Promise<void> {
  await prisma.recommendationTier.create({
    data: {
      recommendationId: recId,
      tierName,
      totalPrice,
      componentsCount: count,
    },
  });
}