/**
 * Business Onboarding State Machine
 * Maps Stripe account state to internal BusinessStatus
 */

import type Stripe from "stripe";
import { BusinessStatus } from "@wine-club/db";

/**
 * Simplified interface compatible with Stripe's Account type.
 * Uses Stripe's official types for requirements and capabilities.
 */
export interface StripeAccountState {
  id: string;
  charges_enabled: boolean;
  details_submitted: boolean;
  payouts_enabled?: boolean;
  requirements?: Stripe.Account.Requirements;
  capabilities?: Stripe.Account.Capabilities;
}

export interface StateTransition {
  from: BusinessStatus;
  to: BusinessStatus;
  reason: string;
  timestamp: Date;
  eventId?: string;
}

/**
 * Determines the appropriate BusinessStatus based on current state and Stripe account data.
 * 
 * This is the core function of the onboarding state machine. It evaluates the Stripe
 * account's capabilities and requirements to determine what status the business should
 * have in our system.
 * 
 * @param currentStatus - The current BusinessStatus in our database
 * @param stripeAccount - Live data from Stripe account (null if no account yet)
 * @returns The new BusinessStatus that should be applied
 * 
 * @example
 * // New business with no Stripe account yet
 * const status = determineBusinessState('CREATED', null);
 * // Returns 'CREATED'
 * 
 * @example
 * // Business with complete Stripe account
 * const status = determineBusinessState('PENDING_VERIFICATION', {
 *   id: 'acct_123',
 *   charges_enabled: true,
 *   details_submitted: true
 * });
 * // Returns 'ONBOARDING_COMPLETE'
 * 
 * @example
 * // Business with restricted Stripe account
 * const status = determineBusinessState('ONBOARDING_COMPLETE', {
 *   id: 'acct_123',
 *   charges_enabled: false,
 *   details_submitted: true,
 *   requirements: { disabled_reason: 'rejected.fraud' }
 * });
 * // Returns 'RESTRICTED'
 */
export function determineBusinessState(
  currentStatus: BusinessStatus,
  stripeAccount: StripeAccountState | null
): BusinessStatus {
  // No Stripe account yet
  if (!stripeAccount) {
    if (currentStatus === "CREATED" || currentStatus === "DETAILS_COLLECTED") {
      return currentStatus;
    }
    return "STRIPE_ONBOARDING_REQUIRED";
  }

  // Check if onboarding is complete
  if (stripeAccount.charges_enabled && stripeAccount.details_submitted) {
    return "ONBOARDING_COMPLETE";
  }

  // Check if account is restricted
  const hasCurrentlyDue = (stripeAccount.requirements?.currently_due?.length ?? 0) > 0;
  const hasPastDue = (stripeAccount.requirements?.past_due?.length ?? 0) > 0;
  const disabledReason = stripeAccount.requirements?.disabled_reason;

  if (disabledReason || hasPastDue) {
    return "RESTRICTED";
  }

  // Check if details submitted but waiting for verification
  if (stripeAccount.details_submitted && !stripeAccount.charges_enabled) {
    return "PENDING_VERIFICATION";
  }

  // Has requirements but in progress
  if (hasCurrentlyDue || !stripeAccount.details_submitted) {
    return "STRIPE_ONBOARDING_IN_PROGRESS";
  }

  // Default: needs onboarding
  return "STRIPE_ONBOARDING_REQUIRED";
}

/**
 * Validates if a state transition is allowed according to business rules.
 * 
 * Checks if transitioning from one BusinessStatus to another is permitted.
 * Helps prevent invalid state changes and maintains data integrity.
 * 
 * @param from - The current BusinessStatus
 * @param to - The target BusinessStatus to transition to
 * @returns true if transition is valid, false otherwise
 * 
 * @example
 * isValidTransition('CREATED', 'DETAILS_COLLECTED'); // true
 * isValidTransition('ONBOARDING_COMPLETE', 'CREATED'); // false (invalid backward transition)
 */
export function isValidTransition(
  from: BusinessStatus,
  to: BusinessStatus
): boolean {
  // Define valid state transitions
  const validTransitions: Record<BusinessStatus, BusinessStatus[]> = {
    CREATED: ["DETAILS_COLLECTED", "ABANDONED"],
    DETAILS_COLLECTED: ["STRIPE_ACCOUNT_CREATED", "STRIPE_ONBOARDING_REQUIRED", "ABANDONED"],
    STRIPE_ACCOUNT_CREATED: ["STRIPE_ONBOARDING_REQUIRED", "STRIPE_ONBOARDING_IN_PROGRESS", "ABANDONED"],
    STRIPE_ONBOARDING_REQUIRED: ["STRIPE_ONBOARDING_IN_PROGRESS", "ABANDONED"],
    STRIPE_ONBOARDING_IN_PROGRESS: [
      "PENDING_VERIFICATION",
      "ONBOARDING_COMPLETE",
      "RESTRICTED",
      "FAILED",
      "ABANDONED",
    ],
    ONBOARDING_PENDING: [
      "STRIPE_ONBOARDING_IN_PROGRESS",
      "PENDING_VERIFICATION",
      "ONBOARDING_COMPLETE",
      "RESTRICTED",
      "ABANDONED",
    ],
    PENDING_VERIFICATION: ["ONBOARDING_COMPLETE", "RESTRICTED", "FAILED"],
    RESTRICTED: ["STRIPE_ONBOARDING_IN_PROGRESS", "ONBOARDING_COMPLETE", "SUSPENDED"],
    ONBOARDING_COMPLETE: ["RESTRICTED", "SUSPENDED"],
    FAILED: ["STRIPE_ONBOARDING_REQUIRED", "ABANDONED"],
    ABANDONED: ["STRIPE_ONBOARDING_REQUIRED"],
    SUSPENDED: ["ONBOARDING_COMPLETE"],
  };

  const allowedTransitions = validTransitions[from] || [];
  return allowedTransitions.includes(to);
}

/**
 * Provides user-facing guidance on what action to take next based on onboarding status.
 * 
 * Returns a structured object with the next action, user message, and dashboard access permission.
 * Used to drive UI/UX for onboarding flow and status pages.
 * 
 * @param status - Current BusinessStatus
 * @param stripeAccount - Stripe account state (used for requirement details)
 * @returns Object containing action type, user message, and dashboard access flag
 * 
 * @example
 * const guidance = getNextAction('PENDING_VERIFICATION', { id: 'acct_123', charges_enabled: false, details_submitted: true });
 * // Returns: { action: 'wait_verification', message: '...', canAccessDashboard: true }
 */
export function getNextAction(status: BusinessStatus, stripeAccount: StripeAccountState | null): {
  action: "complete_details" | "start_stripe_onboarding" | "resume_stripe_onboarding" | "wait_verification" | "fix_requirements" | "contact_support" | "none";
  message: string;
  canAccessDashboard: boolean;
} {
  switch (status) {
    case "CREATED":
      return {
        action: "complete_details",
        message: "Complete your business details to continue",
        canAccessDashboard: false,
      };

    case "DETAILS_COLLECTED":
    case "STRIPE_ONBOARDING_REQUIRED":
      return {
        action: "start_stripe_onboarding",
        message: "Connect your Stripe account to start accepting payments",
        canAccessDashboard: false,
      };

    case "STRIPE_ACCOUNT_CREATED":
    case "STRIPE_ONBOARDING_IN_PROGRESS":
    case "ONBOARDING_PENDING":
      return {
        action: "resume_stripe_onboarding",
        message: "Complete your Stripe onboarding to activate your account",
        canAccessDashboard: false,
      };

    case "PENDING_VERIFICATION":
      return {
        action: "wait_verification",
        message: "Your account is being verified by Stripe. This usually takes a few minutes to 24 hours.",
        canAccessDashboard: true, // Can view dashboard but not process payments
      };

    case "RESTRICTED":
      const requirements = stripeAccount?.requirements?.currently_due || [];
      return {
        action: "fix_requirements",
        message: `Your account requires additional information: ${requirements.join(", ")}`,
        canAccessDashboard: true,
      };

    case "ONBOARDING_COMPLETE":
      return {
        action: "none",
        message: "Your account is fully set up and ready to accept payments",
        canAccessDashboard: true,
      };

    case "FAILED":
      return {
        action: "contact_support",
        message: "There was an issue with your onboarding. Please contact support.",
        canAccessDashboard: false,
      };

    case "ABANDONED":
      return {
        action: "start_stripe_onboarding",
        message: "Resume your account setup to start accepting payments",
        canAccessDashboard: false,
      };

    case "SUSPENDED":
      return {
        action: "contact_support",
        message: "Your account has been suspended. Please contact support.",
        canAccessDashboard: false,
      };

    default:
      return {
        action: "none",
        message: "",
        canAccessDashboard: false,
      };
  }
}

/**
 * Creates a structured state transition record for audit trail.
 * 
 * Generates a timestamped record of business status changes, including the reason
 * for the transition and optional webhook event ID for traceability.
 * 
 * @param from - Previous BusinessStatus
 * @param to - New BusinessStatus
 * @param reason - Human-readable explanation for the transition
 * @param eventId - Optional Stripe webhook event ID that triggered this transition
 * @returns StateTransition object ready to be appended to stateTransitions JSON field
 * 
 * @example
 * const transition = createStateTransition(
 *   'STRIPE_ONBOARDING_IN_PROGRESS',
 *   'ONBOARDING_COMPLETE',
 *   'Webhook account.updated: charges=true, details=true',
 *   'evt_123'
 * );
 */
export function createStateTransition(
  from: BusinessStatus,
  to: BusinessStatus,
  reason: string,
  eventId?: string
): StateTransition {
  return {
    from,
    to,
    reason,
    timestamp: new Date(),
    eventId,
  };
}

/**
 * Safely appends a new transition to the existing transitions array stored in JSON field.
 * 
 * Handles the JSON field from Prisma which may be null or empty.
 * Ensures the returned value is always a valid array.
 * 
 * @param existingTransitions - Current stateTransitions value from database (may be null)
 * @param newTransition - New StateTransition to append
 * @returns Updated array of transitions with the new transition appended
 * 
 * @example
 * const updated = appendTransition(
 *   business.stateTransitions,
 *   createStateTransition('CREATED', 'DETAILS_COLLECTED', 'User submitted form')
 * );
 * // Use in Prisma update:
 * await prisma.business.update({
 *   where: { id },
 *   data: { stateTransitions: updated }
 * });
 */
export function appendTransition(
  existingTransitions: StateTransition[] | null,
  newTransition: StateTransition
): StateTransition[] {
  const transitions = existingTransitions || [];
  return [...transitions, newTransition];
}

