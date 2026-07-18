import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateAlternativesOnline, getUserLocation } from '@/lib/aiService';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const componentType = data.component_type || data.type || 'unknown';
    const componentBrand = data.brand || 'Unknown';
    const componentModel = data.model || 'Unknown';
    const componentPrice = parseFloat(data.price) || 0;

    if (!componentModel || componentModel === 'Unknown') {
      return NextResponse.json(
        { success: false, message: 'Component details (brand, model, price) are required' },
        { status: 400 }
      );
    }

    const originalComponent = {
      type: componentType,
      brand: componentBrand,
      model: componentModel,
      price: componentPrice,
    };

    // Get user location for regional alternatives
    const location = getUserLocation();

    // Generate alternatives using AI service
    const alternatives = await generateAlternativesOnline(originalComponent, location);

    return NextResponse.json({
      success: true,
      original_component: originalComponent,
      alternatives: alternatives.slice(0, 8),
      compatibility_note: 'Alternatives are based on similar specs and price range. Always verify compatibility before purchasing.',
    });
  } catch (error: any) {
    console.error('Alternatives API error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
