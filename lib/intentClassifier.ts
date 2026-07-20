/**
 * Intent Classifier
 * Analyzes user prompts to determine their intent and extract relevant information
 */

export type UserIntent = 
  | 'build_recommendation'
  | 'component_upgrade'
  | 'pc_consultation'
  | 'general_tips'
  | 'follow_up';

export interface ClassifiedIntent {
  intent: UserIntent;
  confidence: number;
  budget?: number;
  useCase?: string;
  componentType?: string;
  currentComponent?: string;
  isFollowUp: boolean;
  extractedInfo: {
    budget?: number;
    useCase?: string;
    components?: string[];
    question?: string;
  };
}

/**
 * Classify user intent from their message
 */
export function classifyIntent(userMessage: string, conversationHistory: any[] = []): ClassifiedIntent {
  const message = userMessage.toLowerCase().trim();
  
  console.log(`[IntentClassifier] Analyzing message: "${userMessage}"`);
  
  // Check if this is a follow-up message
  const isFollowUp = conversationHistory.length > 0 && isFollowUpMessage(message);
  
  // Extract budget if present
  const budget = extractBudget(message);
  
  // Extract use case
  const useCase = extractUseCase(message);
  
  // Extract component mentions
  const components = extractComponentMentions(message);
  
  // Classify intent
  let intent: UserIntent = 'pc_consultation';
  let confidence = 0.5;
  
  // 1. BUILD RECOMMENDATION - User wants complete PC build
  if (isBuildRecommendation(message, budget)) {
    intent = 'build_recommendation';
    confidence = 0.9;
    console.log(`[IntentClassifier] Detected: BUILD RECOMMENDATION (budget: ₱${budget?.toLocaleString()}, use case: ${useCase})`);
  }
  // 2. COMPONENT UPGRADE - User wants to upgrade specific component
  else if (isComponentUpgrade(message, components)) {
    intent = 'component_upgrade';
    confidence = 0.85;
    const componentType = components[0] || extractComponentType(message);
    console.log(`[IntentClassifier] Detected: COMPONENT UPGRADE (component: ${componentType})`);
  }
  // 3. FOLLOW-UP - Continuation of previous conversation
  else if (isFollowUp) {
    intent = 'follow_up';
    confidence = 0.95;
    console.log(`[IntentClassifier] Detected: FOLLOW-UP to previous conversation`);
  }
  // 4. GENERAL TIPS - Tips, tricks, hacks, advice
  else if (isGeneralTips(message)) {
    intent = 'general_tips';
    confidence = 0.8;
    console.log(`[IntentClassifier] Detected: GENERAL TIPS`);
  }
  // 5. PC CONSULTATION - Questions, tutorials, explanations
  else {
    intent = 'pc_consultation';
    confidence = 0.7;
    console.log(`[IntentClassifier] Detected: PC CONSULTATION`);
  }
  
  return {
    intent,
    confidence,
    budget,
    useCase,
    componentType: components[0] || extractComponentType(message),
    currentComponent: extractCurrentComponent(message),
    isFollowUp,
    extractedInfo: {
      budget,
      useCase,
      components,
      question: userMessage,
    },
  };
}

/**
 * Check if message is asking for a complete PC build
 */
function isBuildRecommendation(message: string, budget?: number): boolean {
  const buildKeywords = [
    'build', 'pc build', 'computer build', 'gaming pc', 'gaming rig', 'gaming setup',
    'workstation', 'office pc', 'build me', 'recommend a pc', 'recommend pc',
    'complete pc', 'full pc', 'entire pc', 'whole pc', 'pc for', 'computer for',
    'streaming pc', 'editing pc', 'productivity pc', 'budget pc', 'cheap pc',
    'system build', 'new pc', 'gaming computer', 'work computer',
  ];
  
  const hasBuildKeyword = buildKeywords.some(keyword => message.includes(keyword));
  const hasBudget = budget !== undefined && budget > 0;
  
  // Strong indicator: budget + build-related words
  if (hasBudget && hasBuildKeyword) return true;
  
  // Budget alone with context
  if (hasBudget && (
    message.includes('for') || 
    message.includes('php') || 
    message.includes('pesos') ||
    message.includes('thousand')
  )) return true;
  
  return false;
}

/**
 * Check if message is asking for component upgrade
 */
function isComponentUpgrade(message: string, components: string[]): boolean {
  const upgradeKeywords = [
    'upgrade', 'replace', 'change', 'swap', 'better', 'improve',
    'new cpu', 'new gpu', 'new ram', 'new motherboard',
    'upgrade my', 'replace my', 'change my', 'swap my',
    'better than', 'faster than', 'more powerful',
  ];
  
  const hasUpgradeKeyword = upgradeKeywords.some(keyword => message.includes(keyword));
  const hasComponentMention = components.length > 0;
  
  // Upgrade keyword + component mention
  if (hasUpgradeKeyword && hasComponentMention) return true;
  
  // Current component pattern: "I have [component]"
  if ((message.includes('i have') || message.includes('my current')) && hasComponentMention) {
    return true;
  }
  
  return false;
}

/**
 * Check if message is asking for general tips/advice
 */
function isGeneralTips(message: string): boolean {
  const tipsKeywords = [
    'tip', 'tips', 'trick', 'tricks', 'hack', 'hacks', 'advice',
    'how to', 'what is', 'what are', 'guide', 'tutorial',
    'best practices', 'optimize', 'improve performance',
    'cooling', 'overclocking', 'maintenance', 'clean',
    'tell me about', 'explain', 'difference between',
  ];
  
  return tipsKeywords.some(keyword => message.includes(keyword));
}

/**
 * Check if message is a follow-up to previous conversation
 */
function isFollowUpMessage(message: string): boolean {
  const followUpPatterns = [
    'what about', 'how about', 'and', 'also', 'another',
    'yes', 'no', 'okay', 'thanks', 'thank you',
    'can you', 'could you', 'show me', 'tell me more',
    'what if', 'instead', 'alternative', 'different',
    'cheaper', 'more expensive', 'better', 'worse',
  ];
  
  // Short messages are likely follow-ups
  if (message.split(' ').length <= 5) {
    return followUpPatterns.some(pattern => message.includes(pattern));
  }
  
  return false;
}

/**
 * Extract budget from message
 */
function extractBudget(message: string): number | undefined {
  // Pattern 1: Numbers with PHP/₱ symbols
  const phpPattern = /(?:php|₱|php\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:php|pesos|peso)?/gi;
  const matches = message.match(phpPattern);
  
  if (matches) {
    // Get the largest number (likely the budget)
    const numbers = matches.map(match => {
      const numStr = match.replace(/[^\d.]/g, '');
      return parseFloat(numStr);
    });
    
    const maxNumber = Math.max(...numbers);
    
    // Validate reasonable budget range (1,000 - 500,000)
    if (maxNumber >= 1000 && maxNumber <= 500000) {
      return maxNumber;
    }
  }
  
  // Pattern 2: "X thousand" or "Xk"
  const thousandPattern = /(\d+)\s*(?:k|thousand)/i;
  const thousandMatch = message.match(thousandPattern);
  
  if (thousandMatch) {
    const value = parseInt(thousandMatch[1]) * 1000;
    if (value >= 1000 && value <= 500000) {
      return value;
    }
  }
  
  return undefined;
}

/**
 * Extract use case from message
 */
function extractUseCase(message: string): string {
  const useCases: Record<string, string[]> = {
    gaming: ['gaming', 'game', 'gamer', 'play games', 'esports', 'fps', 'moba'],
    streaming: ['streaming', 'stream', 'streamer', 'twitch', 'youtube'],
    'video-editing': ['editing', 'video editing', 'premiere', 'after effects', 'video production'],
    'graphic-design': ['design', 'graphic design', 'photoshop', 'illustrator', 'creative'],
    programming: ['programming', 'coding', 'developer', 'software development', 'dev'],
    office: ['office', 'work', 'productivity', 'documents', 'spreadsheet', 'business'],
    student: ['student', 'school', 'study', 'homework', 'research'],
  };
  
  for (const [useCase, keywords] of Object.entries(useCases)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return useCase;
    }
  }
  
  return 'general';
}

/**
 * Extract component type mentions
 */
function extractComponentMentions(message: string): string[] {
  const componentKeywords: Record<string, string[]> = {
    cpu: ['cpu', 'processor', 'ryzen', 'intel', 'core i', 'pentium'],
    motherboard: ['motherboard', 'mobo', 'mainboard'],
    ram: ['ram', 'memory', 'ddr4', 'ddr5'],
    gpu: ['gpu', 'graphics card', 'video card', 'rtx', 'gtx', 'radeon', 'geforce'],
    storage: ['storage', 'ssd', 'hdd', 'hard drive', 'nvme', 'm.2'],
    psu: ['psu', 'power supply', 'watt', 'watts'],
    cooler: ['cooler', 'cooling', 'cpu cooler', 'fan', 'aio', 'liquid cooling'],
    case: ['case', 'chassis', 'tower', 'cabinet'],
  };
  
  const mentioned: string[] = [];
  
  for (const [type, keywords] of Object.entries(componentKeywords)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      mentioned.push(type);
    }
  }
  
  return mentioned;
}

/**
 * Extract component type from message
 */
function extractComponentType(message: string): string | undefined {
  const mentions = extractComponentMentions(message);
  return mentions[0];
}

/**
 * Extract current component name from message
 */
function extractCurrentComponent(message: string): string | undefined {
  // Pattern: "my [component] is [name]"
  const pattern1 = /my\s+(?:current\s+)?(?:cpu|gpu|ram|motherboard|storage|psu|cooler|case)\s+is\s+([a-z0-9\s\-]+)/i;
  const match1 = message.match(pattern1);
  if (match1) return match1[1].trim();
  
  // Pattern: "I have [name]"
  const pattern2 = /i\s+have\s+(?:a\s+)?([a-z0-9\s\-]+)/i;
  const match2 = message.match(pattern2);
  if (match2) return match2[1].trim();
  
  return undefined;
}

/**
 * Get intent description for logging
 */
export function getIntentDescription(intent: UserIntent): string {
  const descriptions: Record<UserIntent, string> = {
    build_recommendation: 'Complete PC Build Recommendation',
    component_upgrade: 'Component Upgrade Suggestion',
    pc_consultation: 'PC-related Question/Consultation',
    general_tips: 'General Tips, Tricks, or Advice',
    follow_up: 'Follow-up to Previous Conversation',
  };
  
  return descriptions[intent];
}
