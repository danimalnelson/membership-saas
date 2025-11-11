// Enhanced email templates for wine club notifications

export function WelcomeEmail({ 
  memberName, 
  businessName 
}: { 
  memberName: string; 
  businessName: string;
}) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#6366f1' }}>Welcome to {businessName}!</h1>
      <p>Hi {memberName},</p>
      <p>Thank you for joining our wine club. We're excited to have you as a member!</p>
      <p>You'll receive exclusive benefits, special offers, and curated wine selections.</p>
      <p style={{ marginTop: '32px' }}>
        Cheers,<br />
        The {businessName} Team
      </p>
    </div>
  );
}

export function PaymentFailedEmail({
  memberName,
  amount,
  businessName,
}: {
  memberName: string;
  amount: string;
  businessName: string;
}) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#dc2626' }}>Payment Failed</h1>
      <p>Hi {memberName},</p>
      <p>We were unable to process your payment of {amount} for your {businessName} membership.</p>
      <p>Please update your payment method to continue enjoying your membership benefits.</p>
      <p style={{ marginTop: '32px' }}>
        Best regards,<br />
        The {businessName} Team
      </p>
    </div>
  );
}

export function MonthlySummaryEmail({
  businessName,
  stats,
}: {
  businessName: string;
  stats: {
    newMembers: number;
    revenue: string;
    activeMembers: number;
  };
}) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Monthly Summary for {businessName}</h1>
      <p>Here's how your wine club performed this month:</p>
      <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '8px', marginTop: '16px' }}>
        <p style={{ margin: '8px 0' }}>
          <strong>New Members:</strong> {stats.newMembers}
        </p>
        <p style={{ margin: '8px 0' }}>
          <strong>Total Revenue:</strong> {stats.revenue}
        </p>
        <p style={{ margin: '8px 0' }}>
          <strong>Active Members:</strong> {stats.activeMembers}
        </p>
      </div>
      <p style={{ marginTop: '32px' }}>
        Keep up the great work!
      </p>
    </div>
  );
}

