/**
 * Welcome/Subscription Confirmation Email
 * Sent when a member successfully subscribes to a plan
 */

export interface WelcomeEmailProps {
  customerName: string;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  businessName: string;
}

export function WelcomeEmail(props: WelcomeEmailProps): string {
  const { customerName, planName, amount, currency, interval, businessName } = props;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Welcome to ${businessName}!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Your subscription to <strong>${planName}</strong> has been confirmed!</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">Subscription Details</h3>
      <p style="margin: 10px 0;"><strong>Plan:</strong> ${planName}</p>
      <p style="margin: 10px 0;"><strong>Amount:</strong> $${(amount / 100).toFixed(2)} ${currency.toUpperCase()} / ${interval}</p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      You can manage your subscription, update your payment method, or cancel anytime from your member portal.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      Questions? Reply to this email and we'll be happy to help!
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

// Alias for backward compatibility
export const subscriptionConfirmationEmail = WelcomeEmail;
