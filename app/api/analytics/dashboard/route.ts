import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";
import { getApiUrl, getAuthHeaders } from "@/lib/config";

/**
 * Get time range in milliseconds
 */
function getTimeRangeMs(range: string): number {
  const now = Date.now();
  switch (range) {
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    case "90d":
      return 90 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000; // Default to 24h
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication - only admins can access analytics
    const headersList = await headers();
    const session = await getServerSession({
      ...authOptions,
      req: {
        headers: headersList,
      } as any,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or super_admin
    const userRole = (session.user as any).role;
    if (userRole !== "admin" && userRole !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "24h";

    // Calculate time range
    const now = new Date();
    const startTime = new Date(now.getTime() - getTimeRangeMs(range));

    // Get auth token from session
    const token = (session as any).accessToken || null;
    
    if (!token) {
      console.warn("[ANALYTICS] No backend token in session - trying to get from localStorage fallback");
      // This won't work server-side, but log it for debugging
    }

    // Fetch analytics data from backend API
    try {
      const backendUrl = getApiUrl("/api/analytics/dashboard");
      const authHeaders = token ? getAuthHeaders(token) : {};

      console.log(`[ANALYTICS] Fetching from backend: ${backendUrl}`);
      console.log(`[ANALYTICS] Has token: ${!!token}`);
      console.log(`[ANALYTICS] Range: ${range}, Start time: ${startTime.toISOString()}`);
      console.log(`[ANALYTICS] Auth headers:`, Object.keys(authHeaders));

      // Use fetch with proper error handling and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      let response;
      try {
        response = await fetch(
          `${backendUrl}?range=${range}&start_time=${startTime.toISOString()}`,
          {
            headers: authHeaders,
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          console.error("[ANALYTICS] Request timeout");
          throw new Error("Request timeout");
        }
        throw fetchError;
      }

      console.log(`[ANALYTICS] Backend response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[ANALYTICS] Backend returned data:`, {
          totalUsers: data.totalUsers,
          totalSessions: data.totalSessions,
          totalPageViews: data.totalPageViews,
          totalEvents: data.totalEvents,
        });
        return NextResponse.json(data);
      } else {
        // Get error details from backend
        const errorText = await response.text();
        console.error(
          `[ANALYTICS] Backend analytics endpoint error (${response.status}):`,
          errorText
        );

        // If backend doesn't have analytics endpoint yet, return empty data structure
        // This allows the frontend to work while backend is being set up
        console.warn(
          "Backend analytics endpoint not available, returning empty data"
        );
        return NextResponse.json({
          totalUsers: 0,
          totalSessions: 0,
          totalPageViews: 0,
          totalEvents: 0,
          averageSessionDuration: 0,
          topPages: [],
          topEvents: [],
          deviceBreakdown: [],
          browserBreakdown: [],
          osBreakdown: [],
          recentActivity: [],
          conversionRate: 0,
          errorRate: 0,
        });
      }
    } catch (backendError) {
      console.error(
        "[ANALYTICS] Error fetching analytics from backend:",
        backendError
      );
      // Return empty data structure if backend is unavailable
      return NextResponse.json({
        totalUsers: 0,
        totalSessions: 0,
        totalPageViews: 0,
        totalEvents: 0,
        averageSessionDuration: 0,
        topPages: [],
        topEvents: [],
        deviceBreakdown: [],
        browserBreakdown: [],
        osBreakdown: [],
        recentActivity: [],
        conversionRate: 0,
        errorRate: 0,
      });
    }
  } catch (error) {
    console.error("Analytics dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
