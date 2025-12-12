/**
 * Email service using Resend
 * Handles transactional emails for the platform
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email via Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY not set, skipping email send");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  // Use EMAIL_FROM env var or default to Resend's test sender
  const fromEmail = options.from || process.env.EMAIL_FROM || "onboarding@resend.dev";

  try {
    console.log(`[EMAIL] Sending email to: ${options.to}, from: ${fromEmail}, subject: ${options.subject}`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error("[EMAIL] Failed to send:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return { success: false, error: errorData.message || "Failed to send email" };
    }

    const data = await response.json();
    console.log("[EMAIL] Sent successfully. ID:", data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error("[EMAIL] Error sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send email to business owner
 * Looks up business contact email
 */
export async function sendBusinessEmail(
  businessEmail: string | null | undefined,
  subject: string,
  html: string,
  businessName?: string
): Promise<EmailResult> {
  if (!businessEmail) {
    console.warn("[EMAIL] No business contact email configured, skipping");
    return { success: false, error: "No business contact email" };
  }

  return sendEmail({
    to: businessEmail,
    subject,
    html,
    from: businessName ? `${businessName} <noreply@vintigo.com>` : undefined,
  });
}
