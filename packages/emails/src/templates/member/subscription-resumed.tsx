/**
 * Subscription Resumed Email
 * Sent when a member resumes their paused subscription
 */

export interface SubscriptionResumedEmailProps {
  customerName: string;
  planName: string;
  nextBillingDate: string;
  amount: number;
  currency: string;
  businessName: string;
}

export function SubscriptionResumedEmail(props: SubscriptionResumedEmailProps): string {
  const { customerName, planName, nextBillingDate, amount, currency, businessName } = props;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Resumed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome Back!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Great news! Your subscription to <strong>${planName}</strong> has been resumed.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; color: #10b981;">Subscription Details</h3>
      <p style="margin: 10px 0;"><strong>Plan:</strong> ${planName}</p>
      <p style="margin: 10px 0;"><strong>Next Billing Date:</strong> ${nextBillingDate}</p>
      <p style="margin: 10px 0;"><strong>Amount:</strong> $${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Your membership benefits are now active again. We're glad to have you back!
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      If you have any questions, just reply to this email.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Cheers,<br>
      The ${businessName} Team
    </p>
  </div>
</body>
</html>
  `;
}

export const subscriptionResumedEmail = SubscriptionResumedEmail;
