import { NextRequest, NextResponse } from 'next/server';
import { MarketingAgent } from '@/lib/marketingAgent';
import { MarketingRequest } from '@/lib/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: MarketingRequest = await request.json();

    if (!body.product_name || !body.niche || !body.landing_url) {
      return NextResponse.json(
        { error: 'Missing required fields: product_name, niche, landing_url' },
        { status: 400 }
      );
    }

    const agent = new MarketingAgent();
    const result = await agent.generateMarketing(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate marketing assets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Organic Marketing Agent API',
    version: '1.0.0',
    endpoints: {
      'POST /api/generate': 'Generate marketing assets from product details',
    },
  });
}
