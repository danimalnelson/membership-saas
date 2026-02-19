import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@wine-club/db";
import { formatCurrency, formatDate } from "@wine-club/ui";
import { authOptions } from "@/lib/auth";
import { getBusinessBySlug } from "@/lib/data/business";
import { stripe } from "@wine-club/lib/stripe";
import { ChevronBreadcrumb } from "@/components/icons/ChevronBreadcrumb";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { PaymentMethodCard } from "@/components/ui/payment-method";
import { getTypeConfig } from "@/components/transactions/transaction-utils";
import { ActivityActions } from "@/components/transactions/ActivityActions";

// ---------------------------------------------------------------------------
// ID parsing — determines the source of this activity
//
// "transaction"           → DB Transaction row (CHARGE, REFUND, PAYMENT_FAILED, etc.)
// "subscription_created"  → PlanSubscription row — this IS a charge (first payment)
// "cancellation_scheduled", "subscription_cancelled", "subscription_paused"
//                         → PlanSubscription row — lifecycle status changes (no charge)
// ---------------------------------------------------------------------------

type ActivitySource =
  | { kind: "transaction"; id: string }
  | { kind: "subscription_created"; planSubId: string }
  | { kind: "cancellation_scheduled"; planSubId: string }
  | { kind: "subscription_cancelled"; planSubId: string }
  | { kind: "subscription_paused"; planSubId: string };

function parseActivityId(activityId: string): ActivitySource | null {
  if (activityId.startsWith("sub-created-"))
    return { kind: "subscription_created", planSubId: activityId.slice("sub-created-".length) };
  if (activityId.startsWith("sub-cancel-scheduled-"))
    return { kind: "cancellation_scheduled", planSubId: activityId.slice("sub-cancel-scheduled-".length) };
  if (activityId.startsWith("sub-cancelled-"))
    return { kind: "subscription_cancelled", planSubId: activityId.slice("sub-cancelled-".length) };
  if (activityId.startsWith("sub-paused-"))
    return { kind: "subscription_paused", planSubId: activityId.slice("sub-paused-".length) };
  if (/^[a-z0-9]{20,}$/.test(activityId))
    return { kind: "transaction", id: activityId };
  return null;
}

// ---------------------------------------------------------------------------
// Stripe enrichment helpers
// ---------------------------------------------------------------------------

interface StripeDetails {
  receiptUrl?: string | null;
  invoiceUrl?: string | null;
  invoicePdf?: string | null;
  failureReason?: string | null;
  riskScore?: number | null;
  riskLevel?: string | null;
  refunds?: { amount: number; currency: string; created: Date }[];
  subscriptionStatus?: string | null;
}

async function fetchStripeDetails(
  stripeAccountId: string,
  opts: { chargeId?: string | null; paymentIntentId?: string | null; subscriptionId?: string | null; type: string },
): Promise<StripeDetails> {
  const details: StripeDetails = {};
  try {
    if (opts.type === "CHARGE" || opts.type === "REFUND") {
      // Retrieve charge — either directly or via the payment intent
      let chargeId = opts.chargeId;
      if (!chargeId && opts.paymentIntentId) {
        const pi = await stripe.paymentIntents.retrieve(opts.paymentIntentId, {
          expand: ["latest_charge"],
        }, { stripeAccount: stripeAccountId });
        const latestCharge = pi.latest_charge;
        if (latestCharge && typeof latestCharge === "object") {
          chargeId = latestCharge.id;
        } else if (typeof latestCharge === "string") {
          chargeId = latestCharge;
        }
      }
      if (chargeId) {
        const charge = await stripe.charges.retrieve(chargeId, {
          expand: ["refunds"],
        }, { stripeAccount: stripeAccountId });
        details.receiptUrl = charge.receipt_url;
        if (charge.outcome) {
          details.riskScore = charge.outcome.risk_score ?? null;
          details.riskLevel = charge.outcome.risk_level ?? null;
        }
        if (charge.refunds?.data?.length) {
          details.refunds = charge.refunds.data.map((r) => ({
            amount: r.amount,
            currency: r.currency,
            created: new Date(r.created * 1000),
          }));
        }
      }
    }
    if (opts.paymentIntentId && (opts.type === "PAYMENT_FAILED" || opts.type === "RENEWAL_FAILED" || opts.type === "START_FAILED")) {
      const pi = await stripe.paymentIntents.retrieve(opts.paymentIntentId, {}, { stripeAccount: stripeAccountId });
      details.failureReason = pi.last_payment_error?.message ?? null;
    }
    if (opts.subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(opts.subscriptionId, {
        expand: ["latest_invoice"],
      }, { stripeAccount: stripeAccountId });
      details.subscriptionStatus = sub.status;
      const invoice = sub.latest_invoice;
      if (invoice && typeof invoice === "object") {
        details.invoiceUrl = invoice.hosted_invoice_url ?? null;
        details.invoicePdf = invoice.invoice_pdf ?? null;
        if (!details.receiptUrl) {
          details.receiptUrl = invoice.hosted_invoice_url ?? null;
        }

        // If we don't have charge-level details yet, follow invoice → payment intent → charge
        if (details.riskScore == null && invoice.payment_intent) {
          const piId = typeof invoice.payment_intent === "string"
            ? invoice.payment_intent
            : invoice.payment_intent.id;
          if (piId) {
            const pi = await stripe.paymentIntents.retrieve(piId, {
              expand: ["latest_charge"],
            }, { stripeAccount: stripeAccountId });
            const latestCharge = pi.latest_charge;
            if (latestCharge && typeof latestCharge === "object") {
              if (!details.receiptUrl && latestCharge.receipt_url) {
                details.receiptUrl = latestCharge.receipt_url;
              }
              if (latestCharge.outcome) {
                details.riskScore = latestCharge.outcome.risk_score ?? null;
                details.riskLevel = latestCharge.outcome.risk_level ?? null;
              }
              if (!details.refunds && latestCharge.refunds?.data?.length) {
                details.refunds = latestCharge.refunds.data.map((r) => ({
                  amount: r.amount,
                  currency: r.currency,
                  created: new Date(r.created * 1000),
                }));
              }
            }
          }
        }
      }
    }
  } catch {
    // Stripe call failed — proceed without enrichment
  }
  return details;
}

// ---------------------------------------------------------------------------
// Date formatting (server-side with timezone)
// ---------------------------------------------------------------------------

function formatDateDisplay(date: Date, tz?: string | null) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz || undefined,
  }).format(d);
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ businessSlug: string; activityId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin");

  const { businessSlug, activityId } = await params;
  const business = await getBusinessBySlug(businessSlug, session.user.id);
  if (!business || !business.stripeAccountId) notFound();

  const source = parseActivityId(activityId);
  if (!source) notFound();

  // Shared state across both paths
  let typeLabel = "";
  let eventType = "";
  let amount = 0;
  let currency = "usd";
  let eventDate: Date = new Date();
  let consumerName: string | null = null;
  let consumerEmail = "";
  let consumerId = "";
  let consumerPhone: string | null = null;
  let planName: string | null = null;
  let planSubStatus: string | null = null;
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;
  let paymentMethodBrand: string | null = null;
  let paymentMethodLast4: string | null = null;
  let paymentMethodExpMonth: number | null = null;
  let paymentMethodExpYear: number | null = null;
  let stripeId: string | null = null;
  let stripeDetails: StripeDetails = {};
  let refundableId: string | null = null;
  let relatedTransactions: {
    id: string;
    type: string;
    amount: number;
    currency: string;
    createdAt: Date;
  }[] = [];

  if (source.kind === "transaction") {
    const transaction = await prisma.transaction.findUnique({
      where: { id: source.id },
      include: {
        consumer: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            paymentMethods: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { brand: true, last4: true, expMonth: true, expYear: true },
            },
          },
        },
        subscription: {
          include: { membershipPlan: { select: { name: true } } },
        },
        business: { select: { stripeAccountId: true } },
      },
    });
    if (!transaction || transaction.businessId !== business.id) notFound();

    eventType = transaction.type;
    amount = transaction.amount;
    currency = transaction.currency;
    eventDate = transaction.createdAt;
    consumerName = transaction.consumer.name;
    consumerEmail = transaction.consumer.email;
    consumerId = transaction.consumer.id;
    consumerPhone = transaction.consumer.phone ?? null;
    stripeId = transaction.stripeChargeId || transaction.stripePaymentIntentId;

    if (transaction.type === "CHARGE") refundableId = `tx:${transaction.id}`;

    const pm = transaction.consumer.paymentMethods[0];
    if (pm) {
      paymentMethodBrand = pm.brand;
      paymentMethodLast4 = pm.last4;
      paymentMethodExpMonth = pm.expMonth;
      paymentMethodExpYear = pm.expYear;
    }

    // Find plan name from subscription or plan subscription
    planName = transaction.subscription?.membershipPlan?.name ?? null;
    if (!planName) {
      const planSub = await prisma.planSubscription.findFirst({
        where: { consumerId: transaction.consumerId, plan: { businessId: business.id } },
        include: { plan: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
      if (planSub) {
        planName = planSub.plan.name;
        planSubStatus = planSub.status;
        periodStart = planSub.currentPeriodStart;
        periodEnd = planSub.currentPeriodEnd;
      }
    }

    // Fetch related transactions for this consumer (e.g., refunds on a charge)
    relatedTransactions = await prisma.transaction.findMany({
      where: {
        businessId: business.id,
        consumerId: transaction.consumerId,
        id: { not: transaction.id },
      },
      select: { id: true, type: true, amount: true, currency: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Stripe enrichment
    stripeDetails = await fetchStripeDetails(business.stripeAccountId, {
      chargeId: transaction.stripeChargeId,
      paymentIntentId: transaction.stripePaymentIntentId,
      type: transaction.type,
    });
  } else {
    // PlanSubscription-sourced events — either a financial event (Subscription Started
    // is a charge) or a lifecycle event (cancellation, pause).
    const planSub = await prisma.planSubscription.findUnique({
      where: { id: source.planSubId },
      include: {
        consumer: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            paymentMethods: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { brand: true, last4: true, expMonth: true, expYear: true },
            },
          },
        },
        plan: { select: { name: true, basePrice: true, currency: true, businessId: true } },
      },
    });
    if (!planSub || planSub.plan.businessId !== business.id) notFound();

    const typeMap: Record<string, string> = {
      subscription_created: "SUBSCRIPTION_CREATED",
      cancellation_scheduled: "CANCELLATION_SCHEDULED",
      subscription_cancelled: "SUBSCRIPTION_CANCELLED",
      subscription_paused: "SUBSCRIPTION_PAUSED",
    };
    eventType = typeMap[source.kind] || source.kind.toUpperCase();

    const dateMap: Record<string, Date> = {
      subscription_created: planSub.createdAt,
      cancellation_scheduled: planSub.updatedAt,
      subscription_cancelled: planSub.updatedAt,
      subscription_paused: planSub.pausedAt || planSub.updatedAt,
    };
    eventDate = dateMap[source.kind] || planSub.createdAt;

    amount = planSub.plan.basePrice ?? 0;
    currency = planSub.plan.currency || "usd";
    consumerName = planSub.consumer.name;
    consumerEmail = planSub.consumer.email;
    consumerId = planSub.consumer.id;
    consumerPhone = planSub.consumer.phone ?? null;
    planName = planSub.plan.name;
    planSubStatus = planSub.status;
    periodStart = planSub.currentPeriodStart;
    periodEnd = planSub.currentPeriodEnd;
    stripeId = planSub.stripeSubscriptionId;

    const pm = planSub.consumer.paymentMethods[0];
    if (pm) {
      paymentMethodBrand = pm.brand;
      paymentMethodLast4 = pm.last4;
      paymentMethodExpMonth = pm.expMonth;
      paymentMethodExpYear = pm.expYear;
    }

    const isFinancialEvent = source.kind === "subscription_created";

    if (isFinancialEvent && planSub.stripeSubscriptionId) {
      // Subscription Started IS a charge — enrich via subscription → invoice → charge
      refundableId = `sub:${planSub.stripeSubscriptionId}`;

      stripeDetails = await fetchStripeDetails(business.stripeAccountId, {
        subscriptionId: planSub.stripeSubscriptionId,
        type: "CHARGE",
      });

      if (stripeDetails.subscriptionStatus) {
        planSubStatus = stripeDetails.subscriptionStatus;
      }
    } else if (planSub.stripeSubscriptionId) {
      // Lifecycle events (cancellation, pause) — only need subscription status
      stripeDetails = await fetchStripeDetails(business.stripeAccountId, {
        subscriptionId: planSub.stripeSubscriptionId,
        type: eventType,
      });

      if (stripeDetails.subscriptionStatus) {
        planSubStatus = stripeDetails.subscriptionStatus;
      }
    }

    relatedTransactions = await prisma.transaction.findMany({
      where: { businessId: business.id, consumerId: planSub.consumerId },
      select: { id: true, type: true, amount: true, currency: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  const config = getTypeConfig(eventType);
  typeLabel = config.label;
  const displayName = consumerName || consumerEmail.split("@")[0];
  const stripeUrl = stripeId
    ? `https://dashboard.stripe.com/${business.stripeAccountId ? `connect/accounts/${business.stripeAccountId}/` : ""}payments/${stripeId}`
    : null;

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Link
            href={`/app/${businessSlug}/transactions`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Activity
          </Link>
          <ChevronBreadcrumb size={14} className="text-gray-500 shrink-0" />
          <span className="truncate">{typeLabel}</span>
        </div>
      </PageHeader>

      <div className="p-6">
        <div className="flex gap-6">
          {/* Left column — main content */}
          <div className="flex-1 min-w-0">
            {/* Summary */}
            <SectionCard title="Summary" className="mb-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded shrink-0"
                    style={{ width: 36, height: 36, backgroundColor: config.bg }}
                  >
                    <config.icon size={20} color={config.color} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-950 dark:text-white">{typeLabel}</div>
                    <div className="text-12 text-gray-600 dark:text-gray-800">{formatDateDisplay(eventDate, business.timeZone)}</div>
                  </div>
                  {amount > 0 && (
                    <div className="ml-auto text-lg font-medium text-gray-950 dark:text-white tabular-nums">
                      {eventType === "REFUND" ? "−" : ""}{formatCurrency(amount, currency)}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Stripe details (failure reason, receipt, refunds) */}
            {(stripeDetails.failureReason || stripeDetails.receiptUrl || stripeDetails.invoiceUrl || stripeDetails.riskScore != null || stripeDetails.refunds?.length) && (
              <SectionCard title="Details" className="mb-6">
                <div className="space-y-3">
                  {stripeDetails.riskScore != null && (
                    <div>
                      <div className="text-12 text-gray-600 dark:text-gray-800">Risk evaluation</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-950 dark:text-white tabular-nums">{stripeDetails.riskScore}</span>
                        {stripeDetails.riskLevel && (
                          <span className={`text-12 font-medium px-1.5 py-0.5 rounded ${
                            stripeDetails.riskLevel === "elevated" || stripeDetails.riskLevel === "highest"
                              ? "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950"
                              : "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950"
                          }`}>
                            {stripeDetails.riskLevel === "normal" ? "Normal" : stripeDetails.riskLevel === "elevated" ? "Elevated" : stripeDetails.riskLevel === "highest" ? "Highest" : stripeDetails.riskLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {stripeDetails.failureReason && (
                    <div>
                      <div className="text-12 text-gray-600 dark:text-gray-800">Failure reason</div>
                      <div className="text-sm text-red-600 dark:text-red-400">{stripeDetails.failureReason}</div>
                    </div>
                  )}
                  {stripeDetails.invoiceUrl && (
                    <div>
                      <div className="text-12 text-gray-600 dark:text-gray-800">Invoice</div>
                      <div className="flex items-center gap-3">
                        <a
                          href={stripeDetails.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2"
                        >
                          View invoice
                        </a>
                        {stripeDetails.invoicePdf && (
                          <a
                            href={stripeDetails.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2"
                          >
                            Download PDF
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {stripeDetails.receiptUrl && stripeDetails.receiptUrl !== stripeDetails.invoiceUrl && (
                    <div>
                      <div className="text-12 text-gray-600 dark:text-gray-800">Receipt</div>
                      <a
                        href={stripeDetails.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2"
                      >
                        View receipt
                      </a>
                    </div>
                  )}
                  {stripeDetails.refunds && stripeDetails.refunds.length > 0 && (
                    <div>
                      <div className="text-12 text-gray-600 dark:text-gray-800 mb-1">Refunds</div>
                      <div className="space-y-1">
                        {stripeDetails.refunds.map((r, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-950 dark:text-white">{formatCurrency(r.amount, r.currency)}</span>
                            <span className="text-gray-600 dark:text-gray-800">{formatDate(r.created)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Related activity */}
            {relatedTransactions.length > 0 && (
              <SectionCard title="Related Activity" flush>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-2 text-12 font-medium text-gray-600 dark:text-gray-800">Type</th>
                      <th className="text-right px-4 py-2 text-12 font-medium text-gray-600 dark:text-gray-800">Amount</th>
                      <th className="text-right px-4 py-2 text-12 font-medium text-gray-600 dark:text-gray-800">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedTransactions.map((rt) => {
                      const rtConfig = getTypeConfig(rt.type);
                      return (
                        <tr key={rt.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/app/${businessSlug}/transactions/${rt.id}`}
                              className="flex items-center gap-2 hover:underline"
                            >
                              <div
                                className="flex items-center justify-center rounded shrink-0"
                                style={{ width: 20, height: 20, backgroundColor: rtConfig.bg }}
                              >
                                <rtConfig.icon size={12} color={rtConfig.color} />
                              </div>
                              <span>{rtConfig.label}</span>
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {rt.amount > 0 ? formatCurrency(rt.amount, rt.currency) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-800">
                            {formatDate(rt.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </SectionCard>
            )}
          </div>

          {/* Right column — sidebar */}
          <div className="w-80 shrink-0 space-y-6 hidden lg:block">
            {/* Customer */}
            <SectionCard title="Customer">
              <div className="space-y-3">
                <div>
                  <div className="text-12 text-gray-600 dark:text-gray-800">Name</div>
                  <div className="text-14 font-medium">
                    <Link
                      href={`/app/${businessSlug}/members/${consumerId}`}
                      className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                    >
                      {displayName}
                    </Link>
                  </div>
                </div>
                <div>
                  <div className="text-12 text-gray-600 dark:text-gray-800">Email</div>
                  <div className="text-14 font-medium">{consumerEmail}</div>
                </div>
                {consumerPhone && (
                  <div>
                    <div className="text-12 text-gray-600 dark:text-gray-800">Phone</div>
                    <div className="text-14 font-medium">{consumerPhone}</div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Plan / Subscription */}
            {planName && (
              <SectionCard title="Subscription">
                <div className="space-y-3">
                  <div>
                    <div className="text-12 text-gray-600 dark:text-gray-800">Plan</div>
                    <div className="text-14 font-medium">{planName}</div>
                  </div>
                  {planSubStatus && (
                    <div>
                      <div className="text-12 text-gray-600 dark:text-gray-800">Status</div>
                      <div className="text-14 font-medium capitalize">{planSubStatus}</div>
                    </div>
                  )}
                  {periodStart && periodEnd && (
                    <div>
                      <div className="text-12 text-gray-600 dark:text-gray-800">Current period</div>
                      <div className="text-14 font-medium">
                        {formatDate(periodStart)} – {formatDate(periodEnd)}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Payment method */}
            {paymentMethodBrand && paymentMethodLast4 && (
              <SectionCard title="Payment Method">
                <PaymentMethodCard
                  brand={paymentMethodBrand}
                  last4={paymentMethodLast4}
                  expMonth={paymentMethodExpMonth}
                  expYear={paymentMethodExpYear}
                />
              </SectionCard>
            )}

            {/* Actions */}
            <SectionCard title="Actions">
              <ActivityActions
                stripeUrl={stripeUrl}
                refundableId={refundableId}
                amount={amount}
                currency={currency}
                customerName={displayName}
              />
            </SectionCard>
          </div>
        </div>
      </div>
    </>
  );
}
