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

    console.log(`[Admin Activity] Session check:`, {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role,
      hasToken: !!(session as any)?.accessToken,
    });

    if (!session?.user) {
      console.error("[Admin Activity] No session or user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    console.log(`[Admin Activity] User role: ${userRole}`);
    if (userRole !== "admin" && userRole !== "super_admin") {
      console.error(`[Admin Activity] Insufficient role: ${userRole}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = (session as any).accessToken || null;
    if (!token) {
      console.error("[Admin Activity] No backend token in session");
      return NextResponse.json({ error: "No backend token" }, { status: 401 });
    }

    // Proxy to backend /api/admin/usage/stats and extract activity data
    const backendUrl = getApiUrl("/api/admin/usage/stats");
    const authHeaders = getAuthHeaders(token);

    const response = await fetch(backendUrl, {
      headers: authHeaders,
    });

    if (response.ok) {
      const data = await response.json();

      // Transform usage data to activity format
      const activities: any[] = [];

      // Add top users as activities
      if (data.top_users) {
        data.top_users.forEach((user: any, index: number) => {
          activities.push({
            id: index + 1,
            user: user.email,
            action: "API Usage",
            details: `${user.count} API calls`,
            timestamp: new Date().toISOString(),
          });
        });
      }

      // Add daily usage as activities
      if (data.daily_usage) {
        data.daily_usage.slice(-10).forEach((day: any, index: number) => {
          activities.push({
            id: 1000 + index,
            user: "System",
            action: "Daily Usage",
            details: `${day.count} calls on ${day.date}`,
            timestamp: new Date(day.date).toISOString(),
          });
        });
      }

      return NextResponse.json(activities);
    } else {
      const errorText = await response.text();
      console.error(
        `[Admin Activity] Backend error: ${response.status} - ${errorText}`
      );
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Admin activity error:", error);
    return NextResponse.json([]);
  }
}
