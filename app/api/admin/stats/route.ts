import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";
import { getApiUrl, getAuthHeaders } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await getServerSession({
      ...authOptions,
      req: {
        headers: headersList,
      } as any,
    });

    console.log(`[Admin Stats] Session check:`, {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role,
      hasToken: !!(session as any)?.accessToken,
    });

    if (!session?.user) {
      console.error("[Admin Stats] No session or user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    console.log(`[Admin Stats] User role: ${userRole}`);
    if (userRole !== "admin" && userRole !== "super_admin") {
      console.error(`[Admin Stats] Insufficient role: ${userRole}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let token = (session as any).accessToken || null;
    if (!token) {
      console.warn("[Admin Stats] No backend token in session, attempting to fetch from backend");
      // Try to get token from backend using email (no password required)
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
          (process.env.NODE_ENV === "production" 
            ? "https://web-production-737b.up.railway.app"
            : "http://localhost:5000");
        
        const tokenResponse = await fetch(`${apiBaseUrl}/auth/get-token-from-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session.user.email,
            role: userRole,
          }),
        });
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          token = tokenData.access_token;
          console.log("[Admin Stats] Successfully fetched token from backend");
        } else {
          console.error("[Admin Stats] Failed to fetch token from backend");
        }
      } catch (error) {
        console.error("[Admin Stats] Error fetching token:", error);
      }
      
      if (!token) {
        console.error("[Admin Stats] No backend token available");
        return NextResponse.json({ error: "No backend token" }, { status: 401 });
      }
    }

    // Proxy to backend /api/admin/usage/stats and transform to stats format
    const backendUrl = getApiUrl("/api/admin/usage/stats");
    const authHeaders = getAuthHeaders(token);

    const response = await fetch(backendUrl, {
      headers: authHeaders,
    });

    if (response.ok) {
      const data = await response.json();
      const summary = data.summary || {};

      // Transform to stats format expected by frontend
      return NextResponse.json({
        totalUsers: summary.total_users || 0,
        activeUsers: summary.active_users || 0,
        totalApiCalls: summary.total_calls || 0,
        monthlyCalls: summary.monthly_calls || 0,
        successRate: summary.success_rate || 0,
        usersByTier: summary.users_by_tier || {},
      });
    } else {
      const errorText = await response.text();
      console.error(
        `[Admin Stats] Backend error: ${response.status} - ${errorText}`
      );
      // Return empty stats on error
      return NextResponse.json({
        totalUsers: 0,
        activeUsers: 0,
        totalApiCalls: 0,
        monthlyCalls: 0,
        successRate: 0,
        usersByTier: {},
      });
    }
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      {
        totalUsers: 0,
        activeUsers: 0,
        totalApiCalls: 0,
        monthlyCalls: 0,
        successRate: 0,
        usersByTier: {},
      },
      { status: 200 }
    );
  }
}
