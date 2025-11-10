import { NextResponse } from "next/server";

export async function GET() {
  // Get last ITN attempt from global (set by notify route)
  const getLastITNAttempt = (global as any).getLastITNAttempt;
  const lastITN = getLastITNAttempt ? getLastITNAttempt() : null;

  return NextResponse.json({
    lastITN,
    timestamp: new Date().toISOString(),
  });
}
