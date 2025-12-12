/**
 * Subscription Paused Email
 * Sent when a member pauses their subscription
 */

export interface SubscriptionPausedEmailProps {
  customerName: string;
  planName: string;
  businessName: string;
  portalUrl: string;
}

export function SubscriptionPausedEmail(props: SubscriptionPausedEmailProps): string {
  const { customerName, planName, businessName, portalUrl } = props;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Paused</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #8b5cf6; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Subscription Paused</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Your subscription to <strong>${planName}</strong> has been paused.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
      <h3 style="margin-top: 0; color: #8b5cf6;">What This Means</h3>
      <p style="margin: 10px 0;">Your membership benefits are temporarily on hold.</p>
      <p style="margin: 10px 0;">You won't be charged while your subscription is paused.</p>
      <p style="margin: 10px 0;">You can resume your subscription anytime from your member portal.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Resume Subscription</a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      We'll be here when you're ready to resume. If you have any questions, just reply to this email.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      Best regards,<br>
      The ${businessName} Team
    </p>
  </div>
</body>
</html>
  `;
}

export const subscriptionPausedEmail = SubscriptionPausedEmail;
