/**
 * Renewal Reminder Email
 * Sent X days before a subscription renews
 */

export interface RenewalReminderEmailProps {
  customerName: string;
  planName: string;
  renewalDate: string;
  amount: number;
  currency: string;
  businessName: string;
  portalUrl: string;
  daysUntilRenewal: number;
}

export function RenewalReminderEmail(props: RenewalReminderEmailProps): string {
  const { customerName, planName, renewalDate, amount, currency, businessName, portalUrl, daysUntilRenewal } = props;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upcoming Renewal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">Upcoming Renewal</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">This is a friendly reminder that your <strong>${planName}</strong> subscription will renew in <strong>${daysUntilRenewal} days</strong>.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">Renewal Details</h3>
      <p style="margin: 10px 0;"><strong>Plan:</strong> ${planName}</p>
      <p style="margin: 10px 0;"><strong>Renewal Date:</strong> ${renewalDate}</p>
      <p style="margin: 10px 0;"><strong>Amount:</strong> $${(amount / 100).toFixed(2)} ${currency.toUpperCase()}</p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      No action is needed if you'd like to continue your subscription. Your payment method on file will be charged automatically.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${portalUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Manage Subscription</a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Need to update your payment method or make changes? Visit your member portal anytime.
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      Thank you for being a member!<br>
      The ${businessName} Team
    </p>
  </div>
</body>
</html>
  `;
}

export const renewalReminderEmail = RenewalReminderEmail;
