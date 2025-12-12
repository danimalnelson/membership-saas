/**
 * @wine-club/emails
 * 
 * Centralized email system for the wine club platform.
 * Provides email sending functionality and templates for both
 * members and business owners.
 */

// Core email sending functions
export { sendEmail, sendBusinessEmail } from "./send";
export type { EmailOptions, EmailResult } from "./send";

// Member email templates
export {
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
} from "./templates/member";

export type {
  WelcomeEmailProps,
  PaymentFailedEmailProps,
  SubscriptionCancelledEmailProps,
  SubscriptionPausedEmailProps,
  SubscriptionResumedEmailProps,
  RenewalReminderEmailProps,
  RefundProcessedEmailProps,
} from "./templates/member";

// Business owner email templates
export {
  NewMemberEmail,
  newMemberEmail,
  MemberChurnedEmail,
  memberChurnedEmail,
  MonthlySummaryEmail,
  monthlySummaryEmail,
  PaymentAlertEmail,
  paymentAlertEmail,
} from "./templates/business";

export type {
  NewMemberEmailProps,
  MemberChurnedEmailProps,
  MonthlySummaryEmailProps,
  PaymentAlertEmailProps,
} from "./templates/business";
