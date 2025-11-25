import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Lazy initialization to avoid build-time errors
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, attachments } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: "RESEND_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (attachments && attachments.length > 0) {
      // Process attachments
    }

    // Format FROM_EMAIL properly: "Name <email@domain.com>"
    let fromEmail =
      process.env.FROM_EMAIL || "Trevnoctilla <onboarding@resend.dev>";

    // Ensure proper format if FROM_EMAIL doesn't have name
    if (!fromEmail.includes("<") && !fromEmail.includes(">")) {
      // If it's just an email, add the name
      fromEmail = `Trevnoctilla <${fromEmail}>`;
    }

    const emailPayload: any = {
      from: fromEmail,
      to,
      subject,
      html,
      text,
    };

    // Add attachments if provided
    // Format: [{ filename: "invoice.pdf", content: base64String, contentType: "application/pdf" }]
    // Resend expects content as Buffer from base64 string
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      emailPayload.attachments = attachments.map((att: any) => {
        // Convert base64 string to Buffer for Resend SDK
        const contentBuffer = Buffer.from(att.content, "base64");
        return {
          filename: att.filename,
          content: contentBuffer, // Resend SDK expects Buffer, not base64 string
        };
      });
      attachments.forEach((att: any, index: number) => {
        // Process attachment
      });
    }

    // Log attachment details before sending
    if (emailPayload.attachments && emailPayload.attachments.length > 0) {
      emailPayload.attachments.forEach((att: any, index: number) => {
        const sizeKB =
          att.content instanceof Buffer
            ? Math.round(att.content.length / 1024)
            : "unknown";
      });
    }

    const resend = getResend();
    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to send email" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      email_id: data?.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
