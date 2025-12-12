/**
 * Email service - Re-exports from @wine-club/emails
 * 
 * This file is maintained for backward compatibility.
 * New code should import directly from @wine-club/emails.
 * 
 * @deprecated Import from @wine-club/emails instead
 */

export {
  sendEmail,
  sendBusinessEmail,
  // Member templates
  WelcomeEmail,
  subscriptionConfirmationEmail,
  PaymentFailedEmail,
  paymentFailedEmail,
  SubscriptionCancelledEmail,
  subscriptionCancelledEmail,
  SubscriptionPausedEmail,
  subscriptionPausedEmail,
  SubscriptionResumedEmail,
  subscriptionResumedEmail,
  RenewalReminderEmail,
  renewalReminderEmail,
  RefundProcessedEmail,
  refundProcessedEmail,
  // Business templates
  NewMemberEmail,
  newMemberEmail,
  MemberChurnedEmail,
  memberChurnedEmail,
  MonthlySummaryEmail,
  monthlySummaryEmail,
  PaymentAlertEmail,
  paymentAlertEmail,
} from "@wine-club/emails";

export type {
  EmailOptions,
  EmailResult,
  WelcomeEmailProps,
  PaymentFailedEmailProps,
  SubscriptionCancelledEmailProps,
  SubscriptionPausedEmailProps,
  SubscriptionResumedEmailProps,
  RenewalReminderEmailProps,
  RefundProcessedEmailProps,
  NewMemberEmailProps,
  MemberChurnedEmailProps,
  MonthlySummaryEmailProps,
  PaymentAlertEmailProps,
} from "@wine-club/emails";
