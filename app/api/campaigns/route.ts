import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns
 * Get all campaigns (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    // Get backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || 'https://web-production-737b.up.railway.app';
    
    // Get email from query params for public access
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'demo@example.com';

    // Fetch campaigns from backend
    const response = await fetch(`${backendUrl}/api/campaigns?email=${email}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch campaigns' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Campaigns GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns
 * Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, message_template, companies, email } = body;

    // Validate input
    if (!name || !message_template || !companies || companies.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, message_template, companies' },
        { status: 400 }
      );
    }

    // Create campaign in backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || 'https://web-production-737b.up.railway.app';
    const response = await fetch(`${backendUrl}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || 'demo@example.com',
        name,
        message_template,
        companies
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to create campaign' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Campaigns POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
