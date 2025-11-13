/**
 * Application-wide constants
 * 
 * Centralized location for magic strings and configuration values
 * to improve maintainability and reduce typos.
 */

/**
 * Member status values
 * Used throughout the application for filtering and displaying member states
 */
export const MEMBER_STATUS = {
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
} as const;

/**
 * Stripe subscription status values
 * Matches Stripe's subscription.status field
 * @see https://stripe.com/docs/api/subscriptions/object#subscription_object-status
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired",
} as const;

/**
 * Stripe price billing intervals
 */
export const PRICE_INTERVAL = {
  MONTH: "month",
  YEAR: "year",
  WEEK: "week",
  DAY: "day",
} as const;

/**
 * Stripe webhook event types that we handle
 */
export const WEBHOOK_EVENTS = {
  ACCOUNT_UPDATED: "account.updated",
  CUSTOMER_SUBSCRIPTION_CREATED: "customer.subscription.created",
  CUSTOMER_SUBSCRIPTION_UPDATED: "customer.subscription.updated",
  CUSTOMER_SUBSCRIPTION_DELETED: "customer.subscription.deleted",
  INVOICE_PAYMENT_FAILED: "invoice.payment_failed",
  INVOICE_PAYMENT_SUCCEEDED: "invoice.payment_succeeded",
} as const;

/**
 * Cache TTL values in milliseconds
 */
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000, // 2 minutes - for frequently changing data
  MEDIUM: 5 * 60 * 1000, // 5 minutes - for semi-static data
  LONG: 15 * 60 * 1000, // 15 minutes - for rarely changing data
} as const;

/**
 * Environment names
 */
export const ENV = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
  TEST: "test",
} as const;

// Type exports for TypeScript
export type MemberStatus = typeof MEMBER_STATUS[keyof typeof MEMBER_STATUS];
export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
export type PriceInterval = typeof PRICE_INTERVAL[keyof typeof PRICE_INTERVAL];
export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

