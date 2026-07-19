/**
 * Generate meaningful chat titles from user messages
 */

export function generateChatTitle(message: string): string {
  const trimmed = message.trim().toLowerCase();

  // Extract budget if present
  const budgetMatch = trimmed.match(/(?:php|₱|pesos?|budget[:\s]+)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|000|php|pesos?)?/i);
  const budget = budgetMatch ? budgetMatch[1] : null;

  // Extract use case keywords
  const useCasePatterns: { [key: string]: string[] } = {
    'Gaming': ['game', 'gaming', 'gamer', 'esports', 'fps', 'high-end'],
    'Streaming': ['stream', 'streaming', 'twitch', 'youtube', 'obs', 'broadcast'],
    'Workstation': ['professional', 'workstation', 'video edit', 'photo edit', '3d render', 'cad', 'design'],
    'Productivity': ['office', 'work', 'productivity', 'business', 'spreadsheet', 'browsing'],
    'Server': ['server', 'nas', 'hosting', 'web server', 'database'],
    'Budget': ['cheap', 'budget', 'affordable', 'low-cost', 'minimal', 'entry-level'],
    'High-End': ['high-end', 'premium', 'enthusiast', 'top-tier', 'best', 'maximum'],
  };

  let detectedUseCase = '';
  for (const [useCase, keywords] of Object.entries(useCasePatterns)) {
    if (keywords.some(keyword => trimmed.includes(keyword))) {
      detectedUseCase = useCase;
      break;
    }
  }

  // Extract specific components if mentioned
  const componentKeywords = {
    'CPU': ['cpu', 'processor', 'ryzen', 'intel', 'cores'],
    'GPU': ['gpu', 'graphics', 'rtx', 'gtx', 'geforce', 'radeon', 'amd'],
    'RAM': ['ram', 'memory', 'gb', 'ddr4', 'ddr5'],
    'Storage': ['ssd', 'nvme', 'storage', 'drive', 'hdd'],
  };

  let mentionedComponents: string[] = [];
  for (const [component, keywords] of Object.entries(componentKeywords)) {
    if (keywords.some(keyword => trimmed.includes(keyword))) {
      mentionedComponents.push(component);
    }
  }

  // Extract upgrade scenario
  const isUpgrade =
    trimmed.includes('upgrade') ||
    trimmed.includes('replace') ||
    trimmed.includes('improve') ||
    trimmed.includes('better');
  const upgradeTarget = mentionedComponents.length > 0 ? mentionedComponents[0] : '';

  // Generate title based on detected patterns
  if (isUpgrade && upgradeTarget) {
    const budgetSuffix = budget ? ` (₱${budget}k)` : '';
    return `Upgrade ${upgradeTarget}${budgetSuffix}`;
  }

  if (detectedUseCase) {
    const budgetSuffix = budget ? ` ₱${budget}k` : '';
    return `${detectedUseCase} PC${budgetSuffix}`;
  }

  if (budget) {
    return `PC Build ₱${budget}k`;
  }

  // Extract first few meaningful words if no pattern matched
  const words = message
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 4);

  if (words.length > 0) {
    const title = words.join(' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  return 'New Conversation';
}

/**
 * Update a thread title with a new one
 */
export async function updateThreadTitle(threadId: number, title: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/threads`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: threadId, title }),
    });
    return res.ok;
  } catch (error) {
    console.error('Failed to update thread title:', error);
    return false;
  }
}
