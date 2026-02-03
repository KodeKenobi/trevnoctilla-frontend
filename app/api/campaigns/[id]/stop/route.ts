import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl, getAuthHeaders } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const campaignId = (await params).id;
    const token = request.headers.get('Authorization')?.split(' ')[1];

    const backendUrl = getApiUrl(`/api/campaigns/${campaignId}/stop`);
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: token ? getAuthHeaders(token) : {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to stop campaign' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Stop Campaign] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
