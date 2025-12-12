/**
 * Subscription Cancelled Email
 * Sent when a member cancels their subscription
 */

export interface SubscriptionCancelledEmailProps {
  customerName: string;
  planName: string;
  cancellationDate: string;
  businessName: string;
}

export function SubscriptionCancelledEmail(props: SubscriptionCancelledEmailProps): string {
  const { customerName, planName, cancellationDate, businessName } = props;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancelled</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #6b7280; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Subscription Cancelled</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Your subscription to <strong>${planName}</strong> has been cancelled.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
      <h3 style="margin-top: 0; color: #6b7280;">What This Means</h3>
      <p style="margin: 10px 0;">You'll continue to have access until <strong>${cancellationDate}</strong>.</p>
      <p style="margin: 10px 0;">After that date, your subscription benefits will end and you won't be charged again.</p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      We're sorry to see you go! If there's anything we could have done better, we'd love to hear from you.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      You can rejoin anytime - we'll be here when you're ready!
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Best wishes,<br>
      The ${businessName} Team
    </p>
  </div>
</body>
</html>
  `;
}

// Alias for backward compatibility
export const subscriptionCancelledEmail = SubscriptionCancelledEmail;
