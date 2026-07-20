/**
 * SmartSpecs AI Service - New Architecture
 * AI-driven component selection with filtered JSON data
 */

import { classifyIntent, getIntentDescription, type ClassifiedIntent } from './intentClassifier';
import { filterComponentsByBudget, filterComponentsForUpgrade, type FilteredComponents } from './componentFilter';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ============================================================================
// TYPES
// ============================================================================

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProcessMessageResult {
  success: boolean;
  intent: string;
  response: string;
  data?: any;
  data_type?: 'recommendation' | 'upgrade_suggestion' | 'consultation' | 'text';
  error?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  data_type?: string;
  data?: any;
}

// ============================================================================
// MAIN PROCESS FUNCTION
// ============================================================================

/**
 * Process user message with new AI-driven architecture
 */
export async function processMessage(
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): Promise<ProcessMessageResult> {
  console.log('\n=== AI SERVICE - NEW ARCHITECTURE ===');
  console.log(`[AI] User message: "${userMessage}"`);
  console.log(`[AI] Conversation history: ${conversationHistory.length} messages`);

  try {
    // Step 1: Classify user intent
    const classified = classifyIntent(userMessage, conversationHistory);
    console.log(`[AI] Intent: ${classified.intent} (${getIntentDescription(classified.intent)})`);
    console.log(`[AI] Confidence: ${(classified.confidence * 100).toFixed(0)}%`);

    // Step 2: Route to appropriate handler based on intent
    switch (classified.intent) {
      case 'build_recommendation':
        return await handleBuildRecommendation(userMessage, classified, conversationHistory);

      case 'component_upgrade':
        return await handleComponentUpgrade(userMessage, classified, conversationHistory);

      case 'pc_consultation':
      case 'general_tips':
        return await handleConsultation(userMessage, classified, conversationHistory);

      case 'follow_up':
        return await handleFollowUp(userMessage, classified, conversationHistory);

      default:
        return await handleConsultation(userMessage, classified, conversationHistory);
    }
  } catch (error: any) {
    console.error('[AI] Error processing message:', error);
    return {
      success: false,
      intent: 'error',
      response: 'I encountered an error processing your request. Please try again.',
      error: error.message,
    };
  }
}

// ============================================================================
// INTENT HANDLERS
// ============================================================================

/**
 * Handle PC Build Recommendation
 * Workflow:
 * 1. Check budget
 * 2. Filter 30+ components per type based on budget
 * 3. Send filtered JSON + user prompt to AI
 * 4. AI selects 8 components with reasoning and compatibility validation
 */
async function handleBuildRecommendation(
  userMessage: string,
  classified: ClassifiedIntent,
  conversationHistory: ConversationMessage[]
): Promise<ProcessMessageResult> {
  console.log('[BuildRecommendation] Starting...');

  // Validate budget
  const budget = classified.budget;
  if (!budget || budget < 10000) {
    return {
      success: false,
      intent: 'build_recommendation',
      response: 'I need to know your budget to recommend a PC build. Please specify your budget in PHP (e.g., "₱30,000" or "30k").',
      data_type: 'text',
    };
  }

  console.log(`[BuildRecommendation] Budget: ₱${budget.toLocaleString()}`);
  console.log(`[BuildRecommendation] Use case: ${classified.useCase}`);

  // Filter components based on budget (60% to 140% range)
  console.log('[BuildRecommendation] Filtering components...');
  const filteredComponents = await filterComponentsByBudget(budget, 0.60, 1.40);

  // Create AI prompt with filtered components
  const systemPrompt = createBuildRecommendationSystemPrompt(budget, classified.useCase || 'general');
  const userPrompt = createBuildRecommendationUserPrompt(userMessage, budget, filteredComponents);

  console.log('[BuildRecommendation] Sending to AI...');
  console.log(`[BuildRecommendation] System prompt length: ${systemPrompt.length} chars`);
  console.log(`[BuildRecommendation] User prompt length: ${userPrompt.length} chars`);

  // Call OpenRouter AI
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const aiResponse = await callOpenRouterAPI(messages);

  if (!aiResponse.success) {
    return {
      success: false,
      intent: 'build_recommendation',
      response: 'Failed to generate PC build recommendation. Please try again.',
      error: aiResponse.error,
    };
  }

  // Parse AI response to extract structured data
  const parsedData = parseAIBuildResponse(aiResponse.content);

  return {
    success: true,
    intent: 'build_recommendation',
    response: aiResponse.content,
    data: parsedData,
    data_type: 'recommendation',
  };
}

/**
 * Handle Component Upgrade Suggestion
 * Workflow:
 * 1. Identify component type
 * 2. Filter higher-spec components (120%-300% of current price)
 * 3. Send filtered JSON + user prompt to AI
 * 4. AI recommends best compatible upgrade with reasoning
 */
async function handleComponentUpgrade(
  userMessage: string,
  classified: ClassifiedIntent,
  conversationHistory: ConversationMessage[]
): Promise<ProcessMessageResult> {
  console.log('[ComponentUpgrade] Starting...');

  const componentType = classified.componentType;
  if (!componentType) {
    return {
      success: false,
      intent: 'component_upgrade',
      response: 'Please specify which component you want to upgrade (e.g., "upgrade my GPU" or "better CPU than Ryzen 5 3600").',
      data_type: 'text',
    };
  }

  console.log(`[ComponentUpgrade] Component type: ${componentType}`);
  console.log(`[ComponentUpgrade] Current component: ${classified.currentComponent || 'not specified'}`);

  // Extract current price (default to reasonable baseline if not specified)
  const currentPrice = extractPriceFromMessage(userMessage) || getDefaultComponentPrice(componentType);
  console.log(`[ComponentUpgrade] Current price baseline: ₱${currentPrice.toLocaleString()}`);

  // Filter upgrade options (120% to 300% of current price)
  console.log('[ComponentUpgrade] Filtering upgrade options...');
  const upgradeOptions = await filterComponentsForUpgrade(componentType, currentPrice);

  if (upgradeOptions.length === 0) {
    return {
      success: false,
      intent: 'component_upgrade',
      response: `I couldn't find suitable upgrade options for your ${componentType}. Please provide more details about your current component.`,
      data_type: 'text',
    };
  }

  // Create AI prompt
  const systemPrompt = createUpgradeSystemPrompt(componentType);
  const userPrompt = createUpgradeUserPrompt(userMessage, componentType, upgradeOptions);

  console.log('[ComponentUpgrade] Sending to AI...');

  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const aiResponse = await callOpenRouterAPI(messages);

  if (!aiResponse.success) {
    return {
      success: false,
      intent: 'component_upgrade',
      response: 'Failed to generate upgrade suggestions. Please try again.',
      error: aiResponse.error,
    };
  }

  // Parse AI response
  const parsedData = parseAIUpgradeResponse(aiResponse.content, componentType);

  return {
    success: true,
    intent: 'component_upgrade',
    response: aiResponse.content,
    data: parsedData,
    data_type: 'upgrade_suggestion',
  };
}

/**
 * Handle PC Consultation / General Tips
 * Workflow:
 * 1. Forward raw prompt directly to AI
 * 2. AI provides comprehensive, easy-to-understand explanation
 */
async function handleConsultation(
  userMessage: string,
  classified: ClassifiedIntent,
  conversationHistory: ConversationMessage[]
): Promise<ProcessMessageResult> {
  console.log('[Consultation] Starting...');
  console.log(`[Consultation] Topic: ${classified.extractedInfo.question}`);

  // Create AI prompt for consultation
  const systemPrompt = createConsultationSystemPrompt();
  
  // Include conversation history for context
  const messages: AIMessage[] = [{ role: 'system', content: systemPrompt }];
  
  // Add recent conversation history (last 6 messages)
  const recentHistory = conversationHistory.slice(-6);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role,
      content: msg.content || JSON.stringify(msg.data),
    });
  }
  
  // Add current user message
  messages.push({ role: 'user', content: userMessage });

  console.log('[Consultation] Sending to AI with conversation history...');

  const aiResponse = await callOpenRouterAPI(messages);

  if (!aiResponse.success) {
    return {
      success: false,
      intent: 'pc_consultation',
      response: 'I encountered an error. Please try rephrasing your question.',
      error: aiResponse.error,
    };
  }

  return {
    success: true,
    intent: 'pc_consultation',
    response: aiResponse.content,
    data_type: 'text',
  };
}

/**
 * Handle Follow-Up Messages
 * Workflow:
 * 1. Pass previous conversation (user prompts + AI responses)
 * 2. AI continues conversation with context
 */
async function handleFollowUp(
  userMessage: string,
  classified: ClassifiedIntent,
  conversationHistory: ConversationMessage[]
): Promise<ProcessMessageResult> {
  console.log('[FollowUp] Starting...');
  console.log(`[FollowUp] Previous messages: ${conversationHistory.length}`);

  // Determine the context of the previous conversation
  const previousIntent = conversationHistory.length > 0 
    ? conversationHistory[conversationHistory.length - 1].data_type 
    : 'text';

  console.log(`[FollowUp] Previous intent: ${previousIntent}`);

  // Use consultation handler with full conversation history
  return await handleConsultation(userMessage, classified, conversationHistory);
}

// ============================================================================
// AI PROMPT TEMPLATES
// ============================================================================

function createBuildRecommendationSystemPrompt(budget: number, useCase: string): string {
  return `You are SmartSpecs AI, an expert PC building consultant specializing in the Philippine market.

Your task is to recommend a COMPLETE PC build with ALL 8 ESSENTIAL COMPONENTS:
1. CPU (Processor)
2. Motherboard
3. RAM (Memory)
4. GPU (Graphics Card) - or note if using integrated graphics
5. Storage (SSD/HDD)
6. PSU (Power Supply)
7. CPU Cooler
8. Case

CRITICAL REQUIREMENTS:
- Budget: ₱${budget.toLocaleString()} (target 90-100% utilization)
- Use case: ${useCase}
- ALL components must be selected from the provided JSON data
- Validate compatibility (socket matching, memory type, PSU wattage)
- Provide clear reasoning for each selection

COMPATIBILITY RULES:
- CPU socket MUST match Motherboard socket
- RAM type (DDR4/DDR5) MUST match Motherboard memory_type
- PSU wattage MUST be sufficient (CPU TDP + GPU TDP + 100W minimum)
- CPU Cooler MUST support CPU socket
- Case form_factor MUST accommodate Motherboard form_factor

RESPONSE FORMAT:
Return your recommendation as a JSON object with this EXACT structure:

\`\`\`json
{
  "build": {
    "cpu": {
      "name": "component name",
      "brand": "brand",
      "model": "model",
      "price": price_number,
      "socket": "socket_type",
      "reason": "why this CPU was selected"
    },
    "motherboard": {
      "name": "component name",
      "brand": "brand",
      "model": "model",
      "price": price_number,
      "socket": "socket_type",
      "memory_type": "DDR4 or DDR5",
      "reason": "why this motherboard was selected"
    },
    "ram": {
      "name": "component name",
      "brand": "brand",
      "model": "model",
      "price": price_number,
      "type": "DDR4 or DDR5",
      "capacity": "capacity",
      "reason": "why this RAM was selected"
    },
    "gpu": {
      "name": "component name",
      "brand": "brand",
      "model": "model",
      "price": price_number,
      "reason": "why this GPU was selected (or 'Using integrated graphics' if no GPU)"
    },
    "storage": {
      "name": "component name",
      "brand": "brand",
      "model": "model",
      "price": price_number,
      "type": "SSD or HDD",
      "capacity": "capacity",
      "reason": "why this storage was selected"
    },
    "psu": {
      "name": "component name",
      "brand": "brand",
      "model": "model",
      "price": price_number,
      "wattage": wattage_number,
      "reason": "why this PSU was selected"
    },
    "cooler": {
      "name": "component name",
      "brand": "brand",
      "model": "model",
      "price": price_number,
      "reason": "why this cooler was selected"
    },
    "case": {
      "name": "component name",
      "brand": "brand",
      "model": "model",
      "price": price_number,
      "reason": "why this case was selected"
    }
  },
  "total_price": total_price_number,
  "budget_remaining": remaining_amount,
  "compatibility_notes": "any compatibility considerations",
  "summary": "brief summary of the build's strengths"
}
\`\`\`

Focus on value, compatibility, and meeting the user's use case needs.`;
}

function createBuildRecommendationUserPrompt(
  userMessage: string,
  budget: number,
  components: FilteredComponents
): string {
  // Limit components to reduce token usage (take top 30 per type sorted by value)
  const limitComponents = (arr: any[], limit: number = 30) => {
    return arr.slice(0, limit).map(c => ({
      name: c.name,
      brand: c.brand,
      model: c.model,
      price: c.price,
      socket: c.socket,
      memory_type: c.memory_type,
      type: c.type,
      capacity: c.capacity,
      wattage: c.wattage,
      form_factor: c.form_factor,
      socket_support: c.socket_support,
      tdp: c.tdp,
      integrated_graphics: c.integrated_graphics,
    }));
  };

  const componentsJSON = {
    cpus: limitComponents(components.cpus),
    motherboards: limitComponents(components.motherboards),
    rams: limitComponents(components.rams),
    gpus: limitComponents(components.gpus),
    storage: limitComponents(components.storage),
    psus: limitComponents(components.psus),
    coolers: limitComponents(components.coolers),
    cases: limitComponents(components.cases),
  };

  return `User Request: "${userMessage}"

Budget: ₱${budget.toLocaleString()}

Available Components (filtered for this budget range):

${JSON.stringify(componentsJSON, null, 2)}

Please select ONE component from each category to build a complete, compatible PC within the budget. Return your response in the JSON format specified.`;
}

function createUpgradeSystemPrompt(componentType: string): string {
  return `You are SmartSpecs AI, a PC hardware upgrade specialist.

Your task is to recommend the BEST upgrade for the user's ${componentType.toUpperCase()}.

REQUIREMENTS:
- Recommend 3-5 upgrade options from the provided JSON data
- Explain performance improvements for each option
- Validate compatibility with user's current system (if mentioned)
- Rank options by value (best performance per peso)

RESPONSE FORMAT:
Return as JSON:

\`\`\`json
{
  "component_type": "${componentType}",
  "recommendations": [
    {
      "name": "component name",
      "brand": "brand",
      "model": "model",
      "price": price_number,
      "performance_gain": "estimated % improvement",
      "compatibility_notes": "socket/power/size requirements",
      "value_rating": "excellent/good/fair",
      "reason": "why this is a good upgrade"
    }
  ],
  "best_choice": {
    "name": "recommended component",
    "reason": "why this is the best overall choice"
  },
  "summary": "overall upgrade advice"
}
\`\`\``;
}

function createUpgradeUserPrompt(
  userMessage: string,
  componentType: string,
  upgradeOptions: any[]
): string {
  const limitedOptions = upgradeOptions.slice(0, 40).map(c => ({
    name: c.name,
    brand: c.brand,
    model: c.model,
    price: c.price,
    socket: c.socket,
    tdp: c.tdp,
    cores: c.cores,
    boost_clock: c.boost_clock,
    chipset: c.chipset,
    vram: c.vram,
    wattage: c.wattage,
    type: c.type,
    capacity: c.capacity,
  }));

  return `User Request: "${userMessage}"

Component Type: ${componentType}

Available Upgrade Options:

${JSON.stringify(limitedOptions, null, 2)}

Recommend the best upgrades from these options. Return your response in the JSON format specified.`;
}

function createConsultationSystemPrompt(): string {
  return `You are SmartSpecs AI, a friendly and knowledgeable PC building expert.

Your role is to:
- Answer PC-related questions clearly and accurately
- Provide helpful tips, tricks, and best practices
- Explain technical concepts in easy-to-understand language
- Give practical advice for PC building, maintenance, and optimization
- Reference Philippine market context and pricing when relevant

Guidelines:
- Be conversational and approachable
- Use analogies and examples to explain complex topics
- Provide step-by-step guidance for tutorials
- Warn about common mistakes and pitfalls
- Suggest cost-effective solutions

Keep responses concise but comprehensive. Use markdown formatting for readability.`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Call OpenRouter API
 */
async function callOpenRouterAPI(messages: AIMessage[]): Promise<{ success: boolean; content: string; error?: string }> {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
        'X-Title': 'SmartSpecs AI',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenRouter] API error:', response.status, errorText);
      return {
        success: false,
        content: '',
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log('[OpenRouter] Response received:', content.substring(0, 200) + '...');

    return {
      success: true,
      content,
    };
  } catch (error: any) {
    console.error('[OpenRouter] Error:', error);
    return {
      success: false,
      content: '',
      error: error.message,
    };
  }
}

/**
 * Parse AI build response to extract structured data
 */
function parseAIBuildResponse(aiResponse: string): any {
  try {
    // Extract JSON from markdown code blocks
    const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // Try to parse the entire response as JSON
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error('[Parser] Failed to parse AI build response:', error);
    return null;
  }
}

/**
 * Parse AI upgrade response
 */
function parseAIUpgradeResponse(aiResponse: string, componentType: string): any {
  try {
    const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error('[Parser] Failed to parse AI upgrade response:', error);
    return null;
  }
}

/**
 * Extract price from user message
 */
function extractPriceFromMessage(message: string): number | undefined {
  const match = message.match(/₱?(\d{1,3}(?:,\d{3})*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''));
  }
  return undefined;
}

/**
 * Get default component price baseline for upgrades
 */
function getDefaultComponentPrice(componentType: string): number {
  const defaults: Record<string, number> = {
    cpu: 5000,
    motherboard: 4000,
    ram: 2000,
    gpu: 8000,
    storage: 2000,
    psu: 2000,
    cooler: 1000,
    case: 1500,
  };

  return defaults[componentType.toLowerCase()] || 3000;
}
