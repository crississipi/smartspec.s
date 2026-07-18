/**
 * AI Recommendations API
 * Generates PC build recommendations based on user requirements
 * Uses component database and compatibility checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getComponentLoader } from '@/lib/component-loader';
import { 
  generateRecommendations, 
  analyzeUserRequest,
  formatComponentSpecs,
  calculateTotalPower,
  checkBuildCompatibility
} from '@/lib/ai-recommendations';

interface RecommendationRequest {
  message: string;
  useCase?: string;
  budget?: number;
}

interface RecommendationResponse {
  success: boolean;
  message?: string;
  builds?: any[];
  analysis?: any;
}

export async function POST(req: NextRequest): Promise<NextResponse<RecommendationResponse>> {
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
    const { message, useCase, budget } = data as RecommendationRequest;

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    // Analyze user request to extract budget and use case
    const analysis = analyzeUserRequest(message);
    
    const finalBudget = budget || analysis.budget || 25000;
    const finalUseCase = (useCase || analysis.useCase || 'gaming') as 
      | 'gaming' 
      | 'professional' 
      | 'productivity' 
      | 'streaming' 
      | 'general';

    if (finalBudget < 10000) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Budget must be at least ₱10,000 for a complete PC build' 
        },
        { status: 400 }
      );
    }

    // Generate recommendations
    const recommendations = await generateRecommendations({
      budget: finalBudget,
      useCase: finalUseCase,
    });

    // Check compatibility and format response
    const formattedBuilds = recommendations.builds.map((build) => {
      const compatibility = checkBuildCompatibility(build.components);
      const totalPower = calculateTotalPower(build.components);

      return {
        name: build.name,
        tier: build.tier,
        totalPrice: build.totalPrice,
        budget: build.budget,
        components: build.components.map((comp) => ({
          id: comp.id,
          name: comp.name,
          type: comp.type,
          brand: comp.brand,
          model: comp.model,
          price: comp.price,
          currency: comp.currency,
          image_url: comp.image_url,
          link: comp.link,
          specs: formatComponentSpecs(comp),
        })),
        compatibility: {
          compatible: compatibility.compatible,
          issues: compatibility.issues,
          recommendations: compatibility.recommendations,
        },
        estimatedPower: totalPower,
      };
    });

    return NextResponse.json({
      success: true,
      builds: formattedBuilds,
      analysis: {
        feasible: recommendations.analysis.feasible,
        minBudgetRequired: recommendations.analysis.minBudgetRequired,
        recommendations: recommendations.analysis.recommendations,
        warnings: recommendations.analysis.warnings,
        userBudget: finalBudget,
        useCase: finalUseCase,
      },
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to generate recommendations' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check available use cases and budget ranges
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
      data: {
        useCases: ['gaming', 'professional', 'productivity', 'streaming', 'general'],
        budgetRanges: {
          gaming: { min: 25000, recommended: 50000, max: 200000 },
          professional: { min: 35000, recommended: 75000, max: 300000 },
          productivity: { min: 20000, recommended: 40000, max: 150000 },
          streaming: { min: 30000, recommended: 60000, max: 250000 },
          general: { min: 18000, recommended: 35000, max: 100000 },
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
