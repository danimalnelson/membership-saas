/**
 * Refund Processed Email
 * Sent when a refund is issued to a member
 */

export interface RefundProcessedEmailProps {
  customerName: string;
  amount: number;
  currency: string;
  businessName: string;
  reason?: string;
}

export function RefundProcessedEmail(props: RefundProcessedEmailProps): string {
  const { customerName, amount, currency, businessName, reason } = props;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Processed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Refund Processed</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">A refund of <strong>$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</strong> has been processed to your original payment method.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; color: #10b981;">Refund Details</h3>
      <p style="margin: 10px 0;"><strong>Amount:</strong> $${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</p>
      ${reason ? `<p style="margin: 10px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      The refund will appear in your account within 5-10 business days, depending on your bank.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      If you have any questions, please don't hesitate to contact us.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Best regards,<br>
      The ${businessName} Team
    </p>
  </div>
</body>
</html>
  `;
}

// Alias for backward compatibility
export const refundProcessedEmail = RefundProcessedEmail;
