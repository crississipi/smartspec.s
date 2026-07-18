// lib/ai-service.ts
import prisma from './prisma';
import {
  analyzeUserMessage,
  generateAIResponseText,
  searchComponentsOnline,
  generateTieredBuildsOnline,
  generateUpgradeSuggestionsOnline,
  generateAlternativesOnline,
  generateThreadTitleAI,
  getUserLocation,
  createRecommendation,
  addRecommendationComponent,
  addRecommendationTier,
  detectUpgradeRequest,
  extractPreviousBuild,
  refreshComponentPricesFromJson,
} from './ai-helpers';

export async function processAIMessage(
  userMessage: string,
  threadId?: number,
  conversationHistory: { role: string; content: string }[] = []
): Promise<{
  success: boolean;
  data: any;
  recommendationId?: number | null;
  request_id?: string;
}> {
  const startTime = Date.now();
  conversationHistory = conversationHistory || [];

  // Step 0: Location detection
  const location = await getUserLocation();

  // Check if it's a price refresh request
  if (isPriceRefreshRequest(userMessage)) {
    const refreshSummary = await refreshComponentPricesFromJson();
    const message = `Price refresh finished. Checked ${refreshSummary.components_checked} components across ${refreshSummary.files_scanned} files. Updated ${refreshSummary.prices_updated} prices and wrote ${refreshSummary.files_updated} JSON files.`;
    return {
      success: true,
      data: {
        type: 'text',
        ai_message: message,
        query_analysis: { intent: 'price_refresh' },
        components: [],
        multiple_recommendations: {},
        budget_analysis: {},
        build_info: {},
        location,
        needs_update: false,
        components_found: 0,
      },
      recommendationId: null,
      request_id: `refresh-${Date.now()}`,
    };
  }

  // Step 1: Analyze message
  const analysis = await analyzeUserMessage(userMessage, conversationHistory);

  // Merge with regex fallback (implemented in analyzeUserMessage)
  // ... (handled inside the function)

  const intent = analysis.intent || 'general_question';
  const budget = analysis.budget || null;
  const useCase = analysis.use_case || 'general';
  const needsFullBuild = analysis.needs_full_build || false;

  let components: any[] = [];
  let allBuilds: Record<string, any> = {};
  let budgetAnalysis: any = {};
  let upgradeData: any = {};
  let responseType = 'text';
  let recommendationId: number | null = null;

  // Step 2: Handle based on intent
  switch (intent) {
    case 'build_recommendation':
      if (budget && budget > 0) {
        responseType = 'recommendation';
        const tiered = await generateTieredBuildsOnline(budget, useCase, location, analysis.performance_needs || [], userMessage);
        allBuilds = tiered.builds;
        budgetAnalysis = tiered.budget_analysis;
        // Use balanced build as primary
        components = allBuilds.balanced?.components || allBuilds.budget?.components || [];
      } else if (needsFullBuild) {
        responseType = 'recommendation';
        components = await searchComponentsOnline(userMessage, null, useCase, location);
      }
      break;

    case 'upgrade_suggestion':
      responseType = 'upgrade_suggestion';
      const upgradeDetection = detectUpgradeRequest(userMessage);
      if (threadId) {
        const prevBuild = await extractPreviousBuild(threadId);
        if (prevBuild.has_previous_build) {
          upgradeData = await generateUpgradeSuggestionsOnline(
            prevBuild.components,
            upgradeDetection.mentioned_components || ['all'],
            location,
            prevBuild.budget
          );
          // Flatten upgradeData into components array
          components = [];
          for (const type in upgradeData) {
            const data = upgradeData[type];
            for (const opt of data.upgrade_options || []) {
              opt.is_upgrade = true;
              opt.current_component = `${data.current.brand || ''} ${data.current.model || ''}`.trim();
              opt.current_price = data.current.price || 0;
              opt.price_difference = (opt.price || 0) - (data.current.price || 0);
              opt.price_difference_percent = data.current.price > 0 ? ((opt.price - data.current.price) / data.current.price) * 100 : 0;
              components.push(opt);
            }
          }
        }
      }
      break;

    case 'component_search':
      responseType = 'recommendation';
      components = await searchComponentsOnline(
        userMessage,
        budget,
        useCase,
        location,
        analysis.specific_components || [],
        analysis.brand_preference || null
      );
      break;

    case 'off_topic':
      responseType = 'text';
      return {
        success: true,
        data: {
          type: 'text',
          ai_message:
            "I appreciate your message! However, I'm **SmartSpecs** — a specialized assistant for **PC builds, computer hardware, laptops, and tech devices**.\n\nI'm not able to help with topics outside of that scope, but here's what I **can** help you with:\n\n- **PC Build Recommendations** — Tell me your budget and I'll suggest the best parts\n- **Component Upgrades** — Looking to improve your current setup?\n- **Tips & Tricks** — Overclocking, cable management, optimization, and more\n- **Where to Buy** — I know the best local and online stores\n- **Tech Questions** — DDR4 vs DDR5? Air vs liquid cooling? Just ask!\n\nFeel free to ask me anything about computers and tech! 😊",
          query_analysis: analysis,
          components: [],
          multiple_recommendations: {},
          budget_analysis: {},
          location,
          needs_update: false,
          components_found: 0,
        },
        recommendationId: null,
        request_id: `offtopic-${Date.now()}`,
      };

    case 'tips_and_hacks':
    case 'where_to_buy':
    case 'general_question':
    case 'greeting':
    case 'follow_up':
    default:
      // For follow-ups, check if there was a previous build
      if (intent === 'follow_up' && threadId) {
        const prevBuild = await extractPreviousBuild(threadId);
        if (prevBuild.has_previous_build) {
          components = Object.values(prevBuild.components);
        }
      }
      break;
  }

  // Step 3: Generate response text
  const responseText = await generateAIResponseText(
    userMessage,
    analysis,
    components,
    conversationHistory,
    budgetAnalysis,
    upgradeData,
    location
  );

  // Step 4: Store recommendation if applicable
  if (['recommendation', 'upgrade_suggestion'].includes(responseType) && components.length > 0) {
    const recId = await createRecommendation(
      responseText,
      analysis,
      components.length,
      false,
      budgetAnalysis
    );
    if (recId) {
      recommendationId = recId;
      // Store main components (balanced)
      for (const comp of components) {
        await addRecommendationComponent(recId, comp, 'balanced');
      }
      // Store tiers
      for (const tierName in allBuilds) {
        const tierData = allBuilds[tierName];
        if (tierData.components && tierData.components.length > 0) {
          await addRecommendationTier(recId, tierName, tierData.total_cost || 0, tierData.components.length);
          for (const comp of tierData.components) {
            await addRecommendationComponent(recId, comp, tierName);
          }
        }
      }
    }
  }

  // Step 5: Build final response
  const buildMeta = null; // buildMeta is extracted from allBuilds tier data if needed
  const formattedComponents = components
    .filter((_, i) => typeof i === 'number')
    .map((comp) => ({
      id: comp.id || null,
      type: comp.type || '',
      brand: comp.brand || '',
      model: comp.model || '',
      price: comp.price || 0,
      currency: comp.currency || location.currency || 'PHP',
      image_url: comp.image_url || null,
      source_url: comp.source_url || null,
      store_name: comp.store_name || null,
      reason: comp.reason || null,
      is_upgrade: comp.is_upgrade || false,
      current_component: comp.current_component || null,
      current_price: comp.current_price || null,
      price_difference: comp.price_difference || null,
      price_difference_percent: comp.price_difference_percent || null,
    }));

  const formattedBuilds: Record<string, any> = {};
  for (const tierName in allBuilds) {
    const tierData = allBuilds[tierName];
    formattedBuilds[tierName] = {
      components: (tierData.components || []).map((c: any) => ({
        id: c.id || null,
        type: c.type || '',
        brand: c.brand || '',
        model: c.model || '',
        price: c.price || 0,
        currency: c.currency || location.currency || 'PHP',
        image_url: c.image_url || null,
        source_url: c.source_url || null,
        store_name: c.store_name || null,
        reason: c.reason || null,
      })),
      build_name: tierData.build_name || null,
      total_cost: tierData.total_cost || 0,
      compatibility_notes: tierData.compatibility_notes || [],
      assumptions: tierData.assumptions || [],
    };
  }

  const buildInfo: Record<string, any> = {};

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  return {
    success: true,
    data: {
      type: responseType,
      ai_message: responseText,
      query_analysis: analysis,
      components: formattedComponents,
      multiple_recommendations: formattedBuilds,
      budget_analysis: budgetAnalysis,
      build_info: buildInfo,
      location,
      minimum_build: [],
      needs_update: false,
      components_found: formattedComponents.length,
    },
    recommendationId,
    request_id: `ai-${Date.now()}`,
  };
}

function isPriceRefreshRequest(message: string): boolean {
  return /(update|refresh|latest|current|recheck)\s+(?:all\s+)?(?:component\s+)?prices?/i.test(message) ||
         /prices?\s+(update|refresh|recheck)/i.test(message);
}