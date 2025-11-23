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

    console.log(`[Admin Alerts] Session check:`, {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role,
      hasToken: !!(session as any)?.accessToken,
    });

    if (!session?.user) {
      console.error("[Admin Alerts] No session or user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    console.log(`[Admin Alerts] User role: ${userRole}`);
    if (userRole !== "admin" && userRole !== "super_admin") {
      console.error(`[Admin Alerts] Insufficient role: ${userRole}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = (session as any).accessToken || null;
    if (!token) {
      console.error("[Admin Alerts] No backend token in session");
      return NextResponse.json({ error: "No backend token" }, { status: 401 });
    }

    // Proxy to backend /api/admin/system/health for system alerts
    const backendUrl = getApiUrl("/api/admin/system/health");
    const authHeaders = getAuthHeaders(token);

    const response = await fetch(backendUrl, {
      headers: authHeaders,
    });

    if (response.ok) {
      const data = await response.json();

      // Transform health data to alerts format
      const alerts: any[] = [];

      // Check for system issues
      if (data.status !== "healthy") {
        alerts.push({
          id: 1,
          type: "warning",
          message: `System status: ${data.status}`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }

      // Check memory usage
      if (data.memory_usage && data.memory_usage > 80) {
        alerts.push({
          id: 2,
          type: "warning",
          message: `High memory usage: ${data.memory_usage}%`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }

      // Check CPU usage
      if (data.cpu_usage && data.cpu_usage > 80) {
        alerts.push({
          id: 3,
          type: "warning",
          message: `High CPU usage: ${data.cpu_usage}%`,
          timestamp: new Date().toISOString(),
          resolved: false,
        });
      }

      return NextResponse.json(alerts);
    } else {
      // Return empty alerts if health endpoint doesn't exist
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Admin alerts error:", error);
    return NextResponse.json([]);
  }
}
