/**
 * Test script for SmartBuildEngine
 * Verifies the build algorithm works correctly with sample data
 */

import { SmartBuildEngine } from '../lib/smart-build-engine';
import * as fs from 'fs';
import * as path from 'path';

async function testSmartBuild() {
  console.log('🔄 Loading component data...');

  const dataDir = path.join(__dirname, '../public/data/components');

  // Load component data
  const cpuData = JSON.parse(fs.readFileSync(path.join(dataDir, 'cpu.json'), 'utf-8'));
  const motherboardData = JSON.parse(fs.readFileSync(path.join(dataDir, 'motherboard.json'), 'utf-8'));
  const ramData = JSON.parse(fs.readFileSync(path.join(dataDir, 'ram.json'), 'utf-8'));
  const gpuData = JSON.parse(fs.readFileSync(path.join(dataDir, 'gpu.json'), 'utf-8'));
  const storageData = JSON.parse(fs.readFileSync(path.join(dataDir, 'storage.json'), 'utf-8'));
  const psuData = JSON.parse(fs.readFileSync(path.join(dataDir, 'psu.json'), 'utf-8'));
  const coolerData = JSON.parse(fs.readFileSync(path.join(dataDir, 'cooler.json'), 'utf-8'));
  const caseData = JSON.parse(fs.readFileSync(path.join(dataDir, 'case.json'), 'utf-8'));

  console.log('✅ Data loaded:');
  console.log(`   - CPUs: ${cpuData.length}`);
  console.log(`   - Motherboards: ${motherboardData.length}`);
  console.log(`   - RAM: ${ramData.length}`);
  console.log(`   - GPUs: ${gpuData.length}`);
  console.log(`   - Storage: ${storageData.length}`);
  console.log(`   - PSUs: ${psuData.length}`);
  console.log(`   - Coolers: ${coolerData.length}`);
  console.log(`   - Cases: ${caseData.length}`);

  // Initialize engine
  const engine = new SmartBuildEngine({
    cpus: cpuData,
    motherboards: motherboardData,
    rams: ramData,
    gpus: gpuData,
    storage: storageData,
    psus: psuData,
    coolers: coolerData,
    cases: caseData,
  });

  // Test builds for different budgets
  const testBudgets = [20000, 35000, 50000, 75000, 100000];

  console.log('\n🏗️  Testing SmartBuildEngine with different budgets:\n');

  for (const budget of testBudgets) {
    console.log(`\n📊 Budget: ₱${budget.toLocaleString()}`);
    console.log('─'.repeat(50));

    const builds = await engine.buildMultipleTiers(budget);

    if (builds.balanced) {
      console.log(`✅ Balanced Build: ₱${builds.balanced.totalPrice.toLocaleString()}`);
      console.log(`   Utilization: ${Math.round(builds.balanced.budgetUtilization)}%`);
      console.log(`   Compatible: ${builds.balanced.compatible ? '✓' : '✗'}`);
      console.log(`   CPU: ${builds.balanced.cpu.brand} ${builds.balanced.cpu.model}`);
      console.log(`   GPU: ${builds.balanced.gpu ? builds.balanced.gpu.brand + ' ' + builds.balanced.gpu.model : 'Integrated Graphics'}`);
    } else {
      console.log('❌ No balanced build found');
    }

    if (builds.budget) {
      console.log(`\n✅ Budget Build: ₱${builds.budget.totalPrice.toLocaleString()}`);
      console.log(`   Utilization: ${Math.round(builds.budget.budgetUtilization)}%`);
      console.log(`   Compatible: ${builds.budget.compatible ? '✓' : '✗'}`);
    } else {
      console.log('\n❌ No budget build found');
    }

    if (builds.high_end) {
      console.log(`\n✅ High-End Build: ₱${builds.high_end.totalPrice.toLocaleString()}`);
      console.log(`   Utilization: ${Math.round(builds.high_end.budgetUtilization)}%`);
      console.log(`   Compatible: ${builds.high_end.compatible ? '✓' : '✗'}`);
    } else {
      console.log('\n❌ No high-end build found');
    }
  }

  console.log('\n✅ Test complete!\n');
}

testSmartBuild().catch(console.error);
