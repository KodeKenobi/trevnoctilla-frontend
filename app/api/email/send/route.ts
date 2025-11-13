import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not set");
      return NextResponse.json(
        { success: false, error: "RESEND_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log(`📧 [NEXTJS] Sending email to ${to}`);
    console.log(`📧 [NEXTJS] Subject: ${subject}`);

    // Use verified domain email if available, otherwise fallback to Resend test domain
    const fromEmail =
      process.env.FROM_EMAIL || "Trevnoctilla <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error(`❌ [NEXTJS] Resend error:`, error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to send email" },
        { status: 500 }
      );
    }

    console.log(
      `✅ [NEXTJS] Email sent successfully to ${to} (ID: ${data?.id})`
    );
    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      email_id: data?.id,
    });
  } catch (error: any) {
    console.error(`❌ [NEXTJS] Exception sending email:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
