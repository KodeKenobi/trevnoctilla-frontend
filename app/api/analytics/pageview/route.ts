import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";
import { getApiUrl, getAuthHeaders } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const pageViewData = await request.json();

    // Get session for user_id (optional - allows anonymous tracking)
    const headersList = await headers();
    const session = await getServerSession({
      ...authOptions,
      req: {
        headers: headersList,
      } as any,
    });

    // Forward to backend API
    const backendUrl = getApiUrl("/api/analytics/pageview");
    const token = (session as any)?.accessToken || null;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? getAuthHeaders(token) : {}),
      },
      body: JSON.stringify(pageViewData),
    });

    if (response.ok) {
      const result = await response.json();
      return NextResponse.json(result);
    } else {
      const error = await response.text();
      console.error("Backend analytics error:", error);
      return NextResponse.json(
        { error: "Failed to store analytics data" },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Analytics pageview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
