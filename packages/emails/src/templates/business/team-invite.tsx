/**
 * Team Invite Email
 * Sent when a business owner or admin invites a new team member
 */

export interface TeamInviteEmailProps {
  businessName: string;
  inviterName: string;
  role: string;
  dashboardUrl: string;
}

export function TeamInviteEmail(props: TeamInviteEmailProps): string {
  const { businessName, inviterName, role, dashboardUrl } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to ${businessName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0;">You're Invited</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${inviterName} has invited you to join <strong>${businessName}</strong> as an <strong>${role}</strong>.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Sign in with this email address to access the dashboard and start managing the business.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      If you don't have an account yet, you'll be prompted to create one when you sign in.
    </p>

    <p style="font-size: 12px; color: #999; margin-top: 30px;">
      This invitation was sent by Vintigo Platform
    </p>
  </div>
</body>
</html>
  `;
}

export const teamInviteEmail = TeamInviteEmail;
