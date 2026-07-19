/**
 * Test script for Title Generator
 * Verifies chat title generation works correctly
 */

import { generateChatTitle } from '../lib/title-generator';

const testMessages = [
  'Gaming PC with ₱50,000 budget',
  'Workstation for video editing PHP 75000',
  'Budget office setup under 30000 pesos',
  'Upgrade my GPU with ₱25k budget',
  'High-end streaming PC 150000',
  'CPU replacement 10000',
  'Best PC under ₱100,000',
  'Professional design workstation',
  'Gaming setup',
  'I need a new computer',
  'RAM upgrade 8000',
  'Build me the best gaming rig for 200k',
  'Entry-level productivity PC 20000',
  'Photo editing workstation 100k budget',
  'Twitch streaming PC 80000',
];

console.log('🎯 Testing Title Generator\n');
console.log('Message → Generated Title');
console.log('─'.repeat(80));

for (const message of testMessages) {
  const title = generateChatTitle(message);
  console.log(`"${message}"`);
  console.log(`  → "${title}"`);
  console.log();
}

console.log('✅ Title generation test complete!\n');
