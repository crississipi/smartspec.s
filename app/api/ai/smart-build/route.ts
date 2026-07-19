/**
 * Smart Build API
 * Generates complete PC builds matching user budget using intelligent component selection
 * Uses iterative algorithm to ensure builds are close to the user's stated budget
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SmartBuildEngine, BuildSelection } from '@/lib/smart-build-engine';
import { analyzeUserRequest } from '@/lib/ai-recommendations';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SmartBuildRequest {
  message: string;
  budget?: number;
  useGPU?: boolean;
}

interface SmartBuildResponse {
  success: boolean;
  message?: string;
  builds?: {
    balanced?: BuildSelection;
    budget?: BuildSelection;
    high_end?: BuildSelection;
  };
  analysis?: {
    extractedBudget: number;
    statementBudget: string;
    feasible: boolean;
    warnings: string[];
  };
  error?: string;
}

/**
 * Load component data from JSON files
 */
async function loadComponentData() {
  const dataDir = path.join(process.cwd(), 'public', 'data', 'components');

  try {
    const [cpuData, motherboardData, ramData, gpuData, storageData, psuData, coolerData, caseData] = 
      await Promise.all([
        fs.readFile(path.join(dataDir, 'cpu.json'), 'utf-8').then(d => JSON.parse(d)),
        fs.readFile(path.join(dataDir, 'motherboard.json'), 'utf-8').then(d => JSON.parse(d)),
        fs.readFile(path.join(dataDir, 'ram.json'), 'utf-8').then(d => JSON.parse(d)),
        fs.readFile(path.join(dataDir, 'gpu.json'), 'utf-8').then(d => JSON.parse(d)),
        fs.readFile(path.join(dataDir, 'storage.json'), 'utf-8').then(d => JSON.parse(d)),
        fs.readFile(path.join(dataDir, 'psu.json'), 'utf-8').then(d => JSON.parse(d)),
        fs.readFile(path.join(dataDir, 'cooler.json'), 'utf-8').then(d => JSON.parse(d)),
        fs.readFile(path.join(dataDir, 'case.json'), 'utf-8').then(d => JSON.parse(d)),
      ]);

    return {
      cpus: cpuData,
      motherboards: motherboardData,
      rams: ramData,
      gpus: gpuData,
      storage: storageData,
      psus: psuData,
      coolers: coolerData,
      cases: caseData,
    };
  } catch (error) {
    console.error('Error loading component data:', error);
    throw new Error('Failed to load component data');
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<SmartBuildResponse>> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request
    const data = await req.json();
    const { message, budget, useGPU = true } = data as SmartBuildRequest;

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    // Analyze user request to extract budget
    const analysis = analyzeUserRequest(message);
    const statementBudget = budget || analysis.budget || 25000;

    if (statementBudget < 15000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Budget must be at least ₱15,000 for a complete PC build',
        },
        { status: 400 }
      );
    }

    // Load component data
    const componentData = await loadComponentData();

    // Initialize SmartBuildEngine
    const buildEngine = new SmartBuildEngine(componentData);

    // Generate multiple tier recommendations
    const builds = await buildEngine.buildMultipleTiers(statementBudget);

    if (!builds.balanced) {
      return NextResponse.json(
        {
          success: true,
          message: 'Could not generate builds for the specified budget',
          analysis: {
            extractedBudget: statementBudget,
            statementBudget: `₱${statementBudget.toLocaleString()}`,
            feasible: false,
            warnings: [
              'No suitable components found for the specified budget',
              'Consider adjusting your budget range',
            ],
          },
          builds: {},
        },
        { status: 200 }
      );
    }

    // Format response
    return NextResponse.json({
      success: true,
      builds: {
        balanced: builds.balanced,
        budget: builds.budget,
        high_end: builds.high_end,
      },
      analysis: {
        extractedBudget: statementBudget,
        statementBudget: `₱${statementBudget.toLocaleString()}`,
        feasible: true,
        warnings:
          builds.balanced && builds.balanced.compatibilityIssues.length > 0
            ? builds.balanced.compatibilityIssues
            : [],
      },
    });
  } catch (error) {
    console.error('Smart build API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate smart build',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Smart build API is ready',
      endpoint: '/api/ai/smart-build',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
