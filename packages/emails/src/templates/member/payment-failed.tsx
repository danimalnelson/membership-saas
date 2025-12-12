/**
 * Payment Failed Email
 * Sent when a subscription payment fails
 */

export interface PaymentFailedEmailProps {
  customerName: string;
  planName: string;
  amount: number;
  currency: string;
  businessName: string;
  portalUrl: string;
}

export function PaymentFailedEmail(props: PaymentFailedEmailProps): string {
  const { customerName, planName, amount, currency, businessName, portalUrl } = props;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f97316; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Payment Update Required</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">We had trouble processing your payment for <strong>${planName}</strong> ($${(amount / 100).toFixed(2)} ${currency.toUpperCase()}).</p>
    
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
      <h3 style="margin-top: 0; color: #f97316;">Action Required</h3>
      <p style="margin: 10px 0;">Please update your payment method to avoid service interruption.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Update Payment Method</a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      If you have questions or need help, please don't hesitate to reach out.
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

// Alias for backward compatibility
export const paymentFailedEmail = PaymentFailedEmail;
