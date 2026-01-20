import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface TeamMember {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

// GET /api/enterprise/team - Get team members for the current enterprise user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user role from session (assuming enterprise users have appropriate role)
    const userRole = (session.user as any).role;
    const subscriptionTier = (session.user as any).subscription_tier;

    const isEnterprise =
      userRole === "enterprise" ||
      subscriptionTier?.toLowerCase() === "enterprise" ||
      (session.user as any).monthly_call_limit === -1 ||
      ((session.user as any).monthly_call_limit && (session.user as any).monthly_call_limit >= 100000);

    if (!isEnterprise) {
      return NextResponse.json({ error: "Enterprise access required" }, { status: 403 });
    }

    // For now, return empty array until team management is fully implemented
    // In a real implementation, you'd have a team_members table
    const teamMembers: TeamMember[] = [];

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/enterprise/team - Invite a new team member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check if user is enterprise
    const userRole = (session.user as any).role;
    const subscriptionTier = (session.user as any).subscription_tier;

    const isEnterprise =
      userRole === "enterprise" ||
      subscriptionTier?.toLowerCase() === "enterprise" ||
      (session.user as any).monthly_call_limit === -1 ||
      ((session.user as any).monthly_call_limit && (session.user as any).monthly_call_limit >= 100000);

    if (!isEnterprise) {
      return NextResponse.json({ error: "Enterprise access required" }, { status: 403 });
    }

    // TODO: Implement team invitation logic
    // For now, just return success message
    // In a real implementation, you'd:
    // 1. Create a team invitation record
    // 2. Send an email invitation
    // 3. Handle invitation acceptance

    return NextResponse.json({
      message: "Team member invited successfully",
      email: email
    });
  } catch (error) {
    console.error("Error inviting team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}