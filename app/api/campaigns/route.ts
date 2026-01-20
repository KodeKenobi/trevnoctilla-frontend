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
    
    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const email = searchParams.get('email');

    // Check for auth token (authenticated users)
    const authHeader = request.headers.get('Authorization');
    
    // Build query params
    let queryParams = '';
    if (authHeader) {
      // Authenticated user - backend will use token to get user_id
      queryParams = '';
    } else if (sessionId) {
      // Guest with session ID
      queryParams = `?session_id=${encodeURIComponent(sessionId)}`;
    } else if (email) {
      // Legacy email parameter
      queryParams = `?email=${encodeURIComponent(email)}`;
    }

    // Fetch campaigns from backend
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(`${backendUrl}/api/campaigns${queryParams}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch campaigns' },
        { status: response.status }
      );
    }

    // Check if response has content before parsing
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.warn('[Campaigns GET] Empty response from backend');
      return NextResponse.json({ campaigns: [] });
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('[Campaigns GET] JSON parse error:', parseError);
      console.error('[Campaigns GET] Response text:', text);
      return NextResponse.json(
        { error: 'Invalid response from backend', campaigns: [] },
        { status: 500 }
      );
    }

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
    const { name, message_template, companies, email, session_id } = body;

    // Validate input
    if (!name || !message_template || !companies || companies.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, message_template, companies' },
        { status: 400 }
      );
    }

    // Get authorization header if present (for authenticated users)
    const authHeader = request.headers.get('Authorization');

    // Create campaign in backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || 'https://web-production-737b.up.railway.app';
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add auth header if present (for user-associated campaigns)
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${backendUrl}/api/campaigns`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: email || 'demo@example.com',
        name,
        message_template,
        companies,
        session_id: session_id  // Pass session_id for guest tracking
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to create campaign' },
        { status: response.status }
      );
    }

    // Check if response has content before parsing
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.error('[Campaigns POST] Empty response from backend');
      return NextResponse.json(
        { error: 'Empty response from backend' },
        { status: 500 }
      );
    }

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('[Campaigns POST] JSON parse error:', parseError);
      console.error('[Campaigns POST] Response text:', text);
      return NextResponse.json(
        { error: 'Invalid response from backend' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Campaigns POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
