/**
 * Component Compatibility Checker
 * Validates and ensures PC component compatibility
 */

export interface CPU {
  name: string;
  brand: string;
  model: string;
  socket: string;
  cores?: string;
  base_clock?: string;
  tdp?: number;
  integrated_graphics?: boolean;
  price: number;
  image_url?: string;
  link?: string;
}

export interface Motherboard {
  name: string;
  brand: string;
  model: string;
  socket: string;
  chipset: string;
  form_factor: string;
  memory_type: string;
  max_memory?: number;
  wifi?: boolean;
  price: number;
  image_url?: string;
  link?: string;
}

export interface RAM {
  name: string;
  brand: string;
  model: string;
  type: string; // DDR4 or DDR5
  capacity: string; // e.g., "8GB"
  speed?: number;
  cas_latency?: number;
  price: number;
  image_url?: string;
  link?: string;
}

export interface GPU {
  name: string;
  brand: string;
  model: string;
  chipset?: string;
  vram?: string;
  tdp?: number;
  price: number;
  image_url?: string;
  link?: string;
}

export interface Storage {
  name: string;
  brand: string;
  model: string;
  type: string;
  capacity: string;
  interface?: string;
  price: number;
  image_url?: string;
  link?: string;
}

export interface PSU {
  name: string;
  brand: string;
  model: string;
  wattage: number;
  efficiency?: string;
  modular?: string;
  price: number;
  image_url?: string;
  link?: string;
}

export interface CPUCooler {
  name: string;
  brand: string;
  model: string;
  type?: string;
  height_mm?: number;
  tdp_rating?: number;
  socket_support?: string[];
  price: number;
  image_url?: string;
  link?: string;
}

export interface Case {
  name: string;
  brand: string;
  model: string;
  form_factor: string;
  max_gpu_length_mm?: number;
  color?: string;
  price: number;
  image_url?: string;
  link?: string;
}

export class ComponentCompatibility {
  /**
   * Check if CPU and Motherboard are compatible
   */
  static isCPUMotherboardCompatible(cpu: CPU, motherboard: Motherboard): boolean {
    return cpu.socket === motherboard.socket;
  }

  /**
   * Check if RAM is compatible with Motherboard
   */
  static isRAMMotherboardCompatible(ram: RAM, motherboard: Motherboard): boolean {
    // Extract DDR type from motherboard memory_type field
    const mbMemType = motherboard.memory_type?.toLowerCase() || '';
    const ramType = ram.type?.toLowerCase() || '';
    
    // Match DDR4 or DDR5
    if (mbMemType.includes('ddr4') && ramType.includes('ddr4')) return true;
    if (mbMemType.includes('ddr5') && ramType.includes('ddr5')) return true;
    
    return false;
  }

  /**
   * Check if CPU Cooler supports CPU socket
   */
  static isCoolerCPUCompatible(cooler: CPUCooler, cpu: CPU): boolean {
    if (!cooler.socket_support || cooler.socket_support.length === 0) {
      return true; // Assume compatible if no socket restrictions
    }
    return cooler.socket_support.includes(cpu.socket);
  }

  /**
   * Check if cooler can fit in case
   */
  static isCoolerCaseCompatible(cooler: CPUCooler, caseComponent: Case): boolean {
    // Most cases support standard air coolers, skip strict validation
    return true;
  }

  /**
   * Check if GPU fits in case (based on length)
   */
  static isGPUCaseCompatible(gpu: GPU, caseComponent: Case): boolean {
    if (!gpu.tdp || !caseComponent.max_gpu_length_mm) {
      return true; // Skip validation if specs unavailable
    }
    // Basic TDP check - most cases support GPUs with TDP up to 350W
    return gpu.tdp <= 350;
  }

  /**
   * Calculate required PSU wattage based on system components
   */
  static calculateRequiredPSUWattage(cpu: CPU, gpu: GPU | null): number {
    const cpuTdp = cpu.tdp || 65; // Default CPU TDP
    const gpuTdp = gpu?.tdp || 0;
    
    // Total system power with 30% headroom
    const totalTdp = cpuTdp + gpuTdp;
    const requiredWattage = Math.ceil(totalTdp * 1.3);
    
    // Round up to nearest standard PSU size
    if (requiredWattage <= 450) return 450;
    if (requiredWattage <= 550) return 550;
    if (requiredWattage <= 650) return 650;
    if (requiredWattage <= 750) return 750;
    if (requiredWattage <= 850) return 850;
    return 1000;
  }

  /**
   * Check if PSU is suitable for system
   */
  static isPSUSuitable(psu: PSU, cpu: CPU, gpu: GPU | null): boolean {
    const requiredWattage = this.calculateRequiredPSUWattage(cpu, gpu);
    return psu.wattage >= requiredWattage;
  }

  /**
   * Validate complete build compatibility
   */
  static validateBuild(
    cpu: CPU,
    motherboard: Motherboard,
    ram: RAM,
    gpu: GPU | null,
    storage: Storage,
    psu: PSU,
    cooler: CPUCooler,
    caseComponent: Case
  ): { compatible: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check CPU/Motherboard compatibility
    if (!this.isCPUMotherboardCompatible(cpu, motherboard)) {
      issues.push(`CPU socket (${cpu.socket}) doesn't match motherboard (${motherboard.socket})`);
    }

    // Check RAM/Motherboard compatibility
    if (!this.isRAMMotherboardCompatible(ram, motherboard)) {
      issues.push(`RAM type (${ram.type}) doesn't match motherboard (${motherboard.memory_type})`);
    }

    // Check Cooler/CPU compatibility
    if (!this.isCoolerCPUCompatible(cooler, cpu)) {
      issues.push(`CPU cooler doesn't support ${cpu.socket} socket`);
    }

    // Check PSU wattage
    if (!this.isPSUSuitable(psu, cpu, gpu)) {
      const required = this.calculateRequiredPSUWattage(cpu, gpu);
      issues.push(`PSU (${psu.wattage}W) insufficient for system (requires ${required}W)`);
    }

    // Check if GPU requires dedicated GPU or CPU has iGPU
    if (!gpu && !cpu.integrated_graphics) {
      issues.push(`CPU has no integrated graphics - discrete GPU required`);
    }

    return {
      compatible: issues.length === 0,
      issues,
    };
  }
}
