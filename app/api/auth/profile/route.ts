import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://web-production-737b.up.railway.app";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization header" },
        { status: 401 }
      );
    }

    console.log(
      `[Profile Proxy] Fetching profile from backend: ${BACKEND_URL}/auth/profile`
    );
    const response = await fetch(`${BACKEND_URL}/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log(`[Profile Proxy] Backend response status: ${response.status}`);
    console.log(
      `[Profile Proxy] Subscription tier in response: ${
        data.subscription_tier || "NOT FOUND"
      }`
    );
    console.log(
      `[Profile Proxy] Full profile data:`,
      JSON.stringify(data, null, 2)
    );

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Profile proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
