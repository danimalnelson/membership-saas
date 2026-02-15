import { prisma } from "@wine-club/db";
import { sendEmail } from "@wine-club/emails";

/**
 * Send "Set Your Password" emails to all existing users who don't have a password.
 *
 * This is a one-time migration script to transition existing users
 * from magic-link-only auth to password-based auth.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/send-set-password-emails.ts
 *
 * Options:
 *   --dry-run    Preview which users would receive emails without sending
 */

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const isDryRun = process.argv.includes("--dry-run");

async function sendSetPasswordEmails() {
  console.log(
    isDryRun
      ? "🔍 DRY RUN: Previewing users without passwords...\n"
      : "📧 Sending set-password emails to users without passwords...\n"
  );

  // Find all users without a password
  const users = await prisma.user.findMany({
    where: { password: null },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  console.log(`Found ${users.length} user(s) without a password.\n`);

  if (users.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const displayName = user.name || user.email;

    if (isDryRun) {
      console.log(`  Would send to: ${user.email} (${displayName})`);
      sent++;
      continue;
    }

    const signInUrl = `${APP_URL}/auth/forgot-password`;

    const result = await sendEmail({
      to: user.email,
      subject: "Set your Vintigo password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Set Your Password</h2>
          <p>Hi${user.name ? ` ${user.name}` : ""},</p>
          <p>We've added password protection to Vintigo accounts for improved security. You'll need to set a password to continue signing in.</p>
          <p>Click the button below to set your password:</p>
          <a href="${signInUrl}" 
             style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 500;">
            Set Your Password
          </a>
          <p style="color: #666; font-size: 14px;">
            You'll be asked to sign in with your email first, then you can create your new password.
          </p>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `,
    });

    if (result.success) {
      console.log(`  ✓ Sent to: ${user.email}`);
      sent++;
    } else {
      console.error(`  ✗ Failed for: ${user.email} — ${result.error}`);
      failed++;
    }

    // Small delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}`);
}

sendSetPasswordEmails()
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
