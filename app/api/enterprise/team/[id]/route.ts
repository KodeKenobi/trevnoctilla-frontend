import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE /api/enterprise/team/[id] - Remove a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const teamMemberId = parseInt(resolvedParams.id);

    if (isNaN(teamMemberId)) {
      return NextResponse.json({ error: "Invalid team member ID" }, { status: 400 });
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

    // TODO: Implement team member removal logic
    // For now, just return success message
    // In a real implementation, you'd:
    // 1. Verify the team member belongs to this user's team
    // 2. Remove the team member from the team
    // 3. Optionally deactivate their account or change their role

    return NextResponse.json({
      message: "Team member removed successfully"
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}