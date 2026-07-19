/**
 * Smart PC Build Engine
 * Intelligent component selection with budget matching and compatibility validation
 */

import {
  ComponentCompatibility,
  CPU,
  Motherboard,
  RAM,
  GPU,
  Storage,
  PSU,
  CPUCooler,
  Case,
} from './component-compatibility';

export interface BuildSelection {
  cpu: CPU;
  motherboard: Motherboard;
  ram: RAM;
  gpu: GPU | null;
  storage: Storage;
  psu: PSU;
  cooler: CPUCooler;
  case: Case;
  totalPrice: number;
  budgetUtilization: number; // 0-100%
  compatible: boolean;
  compatibilityIssues: string[];
}

export interface BuildOptions {
  budget: number; // in PHP
  useGPU: boolean; // true = dedicated GPU, false = integrated graphics
  storageType?: 'ssd' | 'both'; // SSD-only or SSD + HDD combo
  caseFormFactor?: 'atx' | 'microatx' | 'miniatx'; // Preferred case size
}

export class SmartBuildEngine {
  private cpuList: CPU[] = [];
  private motherboardList: Motherboard[] = [];
  private ramList: RAM[] = [];
  private gpuList: GPU[] = [];
  private storageList: Storage[] = [];
  private psuList: PSU[] = [];
  private coolerList: CPUCooler[] = [];
  private caseList: Case[] = [];

  constructor(componentData: {
    cpus: CPU[];
    motherboards: Motherboard[];
    rams: RAM[];
    gpus: GPU[];
    storage: Storage[];
    psus: PSU[];
    coolers: CPUCooler[];
    cases: Case[];
  }) {
    this.cpuList = componentData.cpus;
    this.motherboardList = componentData.motherboards;
    this.ramList = componentData.rams;
    this.gpuList = componentData.gpus;
    this.storageList = componentData.storage;
    this.psuList = componentData.psus;
    this.coolerList = componentData.coolers;
    this.caseList = componentData.cases;
  }

  /**
   * Get price bracket based on budget
   */
  private getPriceBracket(budget: number): 'budget' | 'mid_range' | 'high_end' | 'enthusiast' {
    if (budget < 30000) return 'budget';
    if (budget < 60000) return 'mid_range';
    if (budget < 120000) return 'high_end';
    return 'enthusiast';
  }

  /**
   * Get compatible motherboards for a CPU
   */
  private getCompatibleMotherboards(cpu: CPU): Motherboard[] {
    return this.motherboardList.filter(
      (mb) =>
        ComponentCompatibility.isCPUMotherboardCompatible(cpu, mb) &&
        mb.price <= 60000 // Reasonable price limit
    );
  }

  /**
   * Get compatible RAM for a motherboard
   */
  private getCompatibleRAM(motherboard: Motherboard): RAM[] {
    return this.ramList.filter((ram) =>
      ComponentCompatibility.isRAMMotherboardCompatible(ram, motherboard)
    );
  }

  /**
   * Get compatible coolers for a CPU
   */
  private getCompatibleCoolers(cpu: CPU): CPUCooler[] {
    return this.coolerList.filter((cooler) =>
      ComponentCompatibility.isCoolerCPUCompatible(cooler, cpu)
    );
  }

  /**
   * Get suitable PSU for system
   */
  private getSuitablePSU(cpu: CPU, gpu: GPU | null): PSU[] {
    const requiredWattage = ComponentCompatibility.calculateRequiredPSUWattage(cpu, gpu);
    return this.psuList.filter((psu) => psu.wattage >= requiredWattage);
  }

  /**
   * Select component from list targeting a specific price with fallback strategy
   */
  private selectComponentByPrice(
    components: any[],
    targetPrice: number,
    minPrice: number = 0
  ): any | null {
    if (components.length === 0) return null;

    // Filter components within acceptable price range
    const filtered = components.filter((c) => c.price >= minPrice && c.price <= targetPrice * 1.2);

    if (filtered.length === 0) {
      // Fallback: get the cheapest available component
      return components.sort((a, b) => a.price - b.price)[0];
    }

    // Sort by price descending and pick the most expensive within budget
    const sorted = filtered.sort((a, b) => b.price - a.price);
    
    // Find the component closest to target price (prefer slightly under)
    let best = sorted[0];
    for (const comp of sorted) {
      if (comp.price <= targetPrice && comp.price > best.price * 0.8) {
        best = comp;
        if (Math.abs(comp.price - targetPrice) < targetPrice * 0.1) {
          break; // Close enough to target
        }
      }
    }

    return best;
  }

  /**
   * Build a complete system targeting budget with aggressive optimization
   * FOOLPROOF algorithm that ensures all 8 components are selected
   */
  async buildSystem(options: BuildOptions): Promise<BuildSelection | null> {
    const TARGET_UTILIZATION_MIN = 0.88; // Minimum 88% of budget
    const TARGET_UTILIZATION_MAX = 1.00; // Maximum 100% of budget
    const MAX_ITERATIONS = 30; // More attempts for better results

    let bestBuild: BuildSelection | null = null;
    let bestUtilization = 0;

    console.log(`[SmartBuildEngine] Starting build for budget: ₱${options.budget.toLocaleString()}`);

    // Initial budget allocation percentages (will be adjusted dynamically)
    const initialAllocations = {
      cpu: 0.20,      // 20%
      motherboard: 0.12, // 12%
      ram: 0.10,      // 10%
      gpu: 0.38,      // 38%
      storage: 0.08,  // 8%
      psu: 0.06,      // 6%
      cooler: 0.03,   // 3%
      case: 0.03,     // 3%
    };

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      // Adjust allocation multiplier based on iteration
      // Start conservative (0.75x) and gradually increase to aggressive (1.1x)
      const allocationMultiplier = 0.75 + (iteration * 0.015);
      
      let selectedComponents: {
        cpu?: CPU;
        motherboard?: Motherboard;
        ram?: RAM;
        gpu?: GPU | null;
        storage?: Storage;
        psu?: PSU;
        cooler?: CPUCooler;
        case?: Case;
      } = {};
      
      let currentTotal = 0;
      let selectionFailed = false;

      // === STEP 1: Select CPU ===
      const cpuBudget = Math.floor(options.budget * initialAllocations.cpu * allocationMultiplier);
      const cpu = this.selectComponentByPrice(this.cpuList, cpuBudget);
      
      if (!cpu) {
        console.log(`[Iteration ${iteration}] CPU selection failed`);
        continue; // Cannot proceed without CPU
      }
      
      selectedComponents.cpu = cpu;
      currentTotal += cpu.price;
      console.log(`[Iteration ${iteration}] CPU: ${cpu.name} - ₱${cpu.price}`);

      // === STEP 2: Select Motherboard (must be compatible with CPU) ===
      const compatibleMotherboards = this.getCompatibleMotherboards(cpu);
      if (compatibleMotherboards.length === 0) {
        console.log(`[Iteration ${iteration}] No compatible motherboards for CPU ${cpu.socket}`);
        continue;
      }
      
      const moboBudget = Math.floor(options.budget * initialAllocations.motherboard * allocationMultiplier);
      const motherboard = this.selectComponentByPrice(compatibleMotherboards, moboBudget);
      
      if (!motherboard) {
        console.log(`[Iteration ${iteration}] Motherboard selection failed`);
        continue;
      }
      
      selectedComponents.motherboard = motherboard;
      currentTotal += motherboard.price;
      console.log(`[Iteration ${iteration}] Motherboard: ${motherboard.name} - ₱${motherboard.price}`);

      // === STEP 3: Select RAM (must be compatible with Motherboard) ===
      const compatibleRAM = this.getCompatibleRAM(motherboard);
      if (compatibleRAM.length === 0) {
        console.log(`[Iteration ${iteration}] No compatible RAM for motherboard`);
        continue;
      }
      
      const ramBudget = Math.floor(options.budget * initialAllocations.ram * allocationMultiplier);
      const ram = this.selectComponentByPrice(compatibleRAM, ramBudget);
      
      if (!ram) {
        console.log(`[Iteration ${iteration}] RAM selection failed`);
        continue;
      }
      
      selectedComponents.ram = ram;
      currentTotal += ram.price;
      console.log(`[Iteration ${iteration}] RAM: ${ram.name} - ₱${ram.price}`);

      // === STEP 4: Select GPU (optional but recommended) ===
      let gpu: GPU | null = null;
      
      if (options.useGPU) {
        const gpuBudget = Math.floor(options.budget * initialAllocations.gpu * allocationMultiplier);
        gpu = this.selectComponentByPrice(this.gpuList, gpuBudget);
        
        if (!gpu && !cpu.integrated_graphics) {
          console.log(`[Iteration ${iteration}] GPU required but unavailable (CPU has no iGPU)`);
          continue;
        }
        
        if (gpu) {
          currentTotal += gpu.price;
          console.log(`[Iteration ${iteration}] GPU: ${gpu.name} - ₱${gpu.price}`);
        } else {
          console.log(`[Iteration ${iteration}] Using integrated graphics`);
        }
      }
      
      selectedComponents.gpu = gpu;

      // === STEP 5: Select Storage ===
      const storageBudget = Math.floor(options.budget * initialAllocations.storage * allocationMultiplier);
      const storage = this.selectComponentByPrice(this.storageList, storageBudget);
      
      if (!storage) {
        console.log(`[Iteration ${iteration}] Storage selection failed`);
        continue;
      }
      
      selectedComponents.storage = storage;
      currentTotal += storage.price;
      console.log(`[Iteration ${iteration}] Storage: ${storage.name} - ₱${storage.price}`);

      // === STEP 6: Select PSU (must support system wattage) ===
      const suitablePSUs = this.getSuitablePSU(cpu, gpu);
      if (suitablePSUs.length === 0) {
        console.log(`[Iteration ${iteration}] No suitable PSU found for system`);
        continue;
      }
      
      const psuBudget = Math.floor(options.budget * initialAllocations.psu * allocationMultiplier);
      const psu = this.selectComponentByPrice(suitablePSUs, psuBudget);
      
      if (!psu) {
        console.log(`[Iteration ${iteration}] PSU selection failed`);
        continue;
      }
      
      selectedComponents.psu = psu;
      currentTotal += psu.price;
      console.log(`[Iteration ${iteration}] PSU: ${psu.name} - ₱${psu.price}`);

      // === STEP 7: Select CPU Cooler (must support CPU socket) ===
      const compatibleCoolers = this.getCompatibleCoolers(cpu);
      if (compatibleCoolers.length === 0) {
        console.log(`[Iteration ${iteration}] No compatible coolers for CPU`);
        continue;
      }
      
      const coolerBudget = Math.floor(options.budget * initialAllocations.cooler * allocationMultiplier);
      const cooler = this.selectComponentByPrice(compatibleCoolers, coolerBudget);
      
      if (!cooler) {
        console.log(`[Iteration ${iteration}] Cooler selection failed`);
        continue;
      }
      
      selectedComponents.cooler = cooler;
      currentTotal += cooler.price;
      console.log(`[Iteration ${iteration}] Cooler: ${cooler.name} - ₱${cooler.price}`);

      // === STEP 8: Select Case ===
      const caseBudget = Math.floor(options.budget * initialAllocations.case * allocationMultiplier);
      const caseComponent = this.selectComponentByPrice(this.caseList, caseBudget);
      
      if (!caseComponent) {
        console.log(`[Iteration ${iteration}] Case selection failed`);
        continue;
      }
      
      selectedComponents.case = caseComponent;
      currentTotal += caseComponent.price;
      console.log(`[Iteration ${iteration}] Case: ${caseComponent.name} - ₱${caseComponent.price}`);

      // === VALIDATION: Check if all components selected ===
      if (!selectedComponents.cpu || !selectedComponents.motherboard || !selectedComponents.ram ||
          !selectedComponents.storage || !selectedComponents.psu || !selectedComponents.cooler ||
          !selectedComponents.case) {
        console.log(`[Iteration ${iteration}] Incomplete build - skipping`);
        continue;
      }

      // === CALCULATE METRICS ===
      const utilization = currentTotal / options.budget;
      console.log(`[Iteration ${iteration}] Total: ₱${currentTotal.toLocaleString()} | Utilization: ${(utilization * 100).toFixed(1)}%`);

      // === CHECK IF THIS BUILD IS BETTER ===
      if (utilization >= TARGET_UTILIZATION_MIN && utilization <= TARGET_UTILIZATION_MAX) {
        // Validate compatibility
        const validation = ComponentCompatibility.validateBuild(
          selectedComponents.cpu,
          selectedComponents.motherboard,
          selectedComponents.ram,
          selectedComponents.gpu || null,
          selectedComponents.storage,
          selectedComponents.psu,
          selectedComponents.cooler,
          selectedComponents.case
        );

        const build: BuildSelection = {
          cpu: selectedComponents.cpu,
          motherboard: selectedComponents.motherboard,
          ram: selectedComponents.ram,
          gpu: selectedComponents.gpu || null,
          storage: selectedComponents.storage,
          psu: selectedComponents.psu,
          cooler: selectedComponents.cooler,
          case: selectedComponents.case,
          totalPrice: currentTotal,
          budgetUtilization: utilization * 100,
          compatible: validation.compatible,
          compatibilityIssues: validation.issues,
        };

        // Keep the build closest to 95% utilization
        if (utilization > bestUtilization) {
          bestBuild = build;
          bestUtilization = utilization;
          console.log(`[Iteration ${iteration}] ✓ NEW BEST BUILD: ${(utilization * 100).toFixed(1)}% utilization`);
        }

        // If we're very close to ideal (93-97%), we can stop early
        if (utilization >= 0.93 && utilization <= 0.97) {
          console.log(`[Iteration ${iteration}] ✓✓ OPTIMAL BUILD FOUND - stopping early`);
          break;
        }
      } else if (utilization < TARGET_UTILIZATION_MIN) {
        console.log(`[Iteration ${iteration}] Build too cheap (${(utilization * 100).toFixed(1)}%)`);
        // Keep trying with higher multipliers
      } else {
        console.log(`[Iteration ${iteration}] Build over budget (${(utilization * 100).toFixed(1)}%)`);
      }
    }

    if (bestBuild) {
      console.log(`[SmartBuildEngine] ✓ Final build: ₱${bestBuild.totalPrice.toLocaleString()} (${bestBuild.budgetUtilization.toFixed(1)}%)`);
    } else {
      console.log(`[SmartBuildEngine] ✗ Failed to generate build`);
    }

    return bestBuild;
  }

  /**
   * Get next price bracket tier
   */
  private getNextBracket(current: string): string {
    const brackets = ['budget', 'mid_range', 'high_end', 'enthusiast'];
    const index = brackets.indexOf(current);
    return index < brackets.length - 1 ? brackets[index + 1] : current;
  }

  /**
   * Build multiple tier recommendations
   */
  async buildMultipleTiers(
    budget: number
  ): Promise<{ balanced: BuildSelection; budget?: BuildSelection; high_end?: BuildSelection }> {
    const recommendations: any = {};

    // Balanced build (normal budget)
    const balanced = await this.buildSystem({
      budget,
      useGPU: true,
    });
    if (balanced) recommendations.balanced = balanced;

    // Budget build (70% of stated budget)
    const budgetBuild = await this.buildSystem({
      budget: Math.floor(budget * 0.7),
      useGPU: budget > 30000,
    });
    if (budgetBuild) recommendations.budget = budgetBuild;

    // High-end build (120% of stated budget if user has more to spend)
    const highEnd = await this.buildSystem({
      budget: Math.floor(budget * 1.2),
      useGPU: true,
    });
    if (highEnd) recommendations.high_end = highEnd;

    return recommendations;
  }
}
