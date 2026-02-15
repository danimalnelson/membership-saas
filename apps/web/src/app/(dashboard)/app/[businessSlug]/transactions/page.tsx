import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma, Prisma } from "@wine-club/db";
import { authOptions } from "@/lib/auth";
import { Card, CardContent } from "@wine-club/ui";
import { getBusinessBySlug } from "@/lib/data/business";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import TransactionsLoading from "./loading";

const PAGE_SIZE = 20;

async function TransactionsContent({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { businessSlug } = await params;
  const business = await getBusinessBySlug(businessSlug, session.user.id);

  if (!business) {
    notFound();
  }

  // Parse searchParams for pagination and filters
  const sp = await searchParams;
  const page = Math.max(0, parseInt(String(sp.page || "0"), 10) || 0);
  const filterType = typeof sp.type === "string" ? sp.type : "";
  const filterName = typeof sp.name === "string" ? sp.name : "";
  const filterEmail = typeof sp.email === "string" ? sp.email : "";
  const filterPlan = typeof sp.plan === "string" ? sp.plan : "";
  const filterLast4 = typeof sp.last4 === "string" ? sp.last4 : "";

  // Build Prisma where clause from filters
  const where: Prisma.TransactionWhereInput = {
    businessId: business.id,
  };

  // Type filter: map UI type names to TransactionType enum values
  if (filterType) {
    const typeMap: Record<string, string> = {
      PAYMENT: "CHARGE",
      CHARGE: "CHARGE",
      REFUND: "REFUND",
      SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED",
      SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
      SUBSCRIPTION_PAUSED: "SUBSCRIPTION_PAUSED",
      PAYOUT_FEE: "PAYOUT_FEE",
    };
    const types = filterType.split(",").map((t) => typeMap[t] || t).filter(Boolean);
    if (types.length > 0) {
      where.type = { in: types as Prisma.EnumTransactionTypeFilter["in"] };
    }
  }

  // Name filter: search consumer name (case-insensitive)
  if (filterName) {
    where.consumer = {
      ...((where.consumer as Prisma.ConsumerWhereInput) || {}),
      name: { contains: filterName, mode: "insensitive" },
    };
  }

  // Email filter: search consumer email (case-insensitive)
  if (filterEmail) {
    where.consumer = {
      ...((where.consumer as Prisma.ConsumerWhereInput) || {}),
      email: { contains: filterEmail, mode: "insensitive" },
    };
  }

  // Plan/description filter
  if (filterPlan) {
    where.description = { contains: filterPlan, mode: "insensitive" };
  }

  // Payment method last4 filter
  if (filterLast4) {
    where.paymentMethodLast4 = { contains: filterLast4 };
  }

  // Run count + data queries in parallel
  const [totalCount, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: {
        consumer: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  // Format dates on server to avoid hydration mismatch
  const formatDate = (date: Date, tz?: string | null) => {
    const d = date instanceof Date ? date : new Date(date);
    const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: tz || undefined }).format(d);
    const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: tz || undefined }).format(d);
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz || undefined }).format(d);
    return `${month} ${day}, ${time}`;
  };

  // Map DB type to UI display type
  const typeDisplayMap: Record<string, string> = {
    CHARGE: "PAYMENT",
    REFUND: "REFUND",
    PAYOUT_FEE: "PAYOUT_FEE",
    SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED",
    SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
    SUBSCRIPTION_PAUSED: "SUBSCRIPTION_PAUSED",
  };

  // Transform to the shape the TransactionTable expects
  const formattedTransactions = transactions.map((tx) => ({
    id: tx.id,
    date: tx.createdAt,
    dateDisplay: formatDate(tx.createdAt, business.timeZone),
    type: typeDisplayMap[tx.type] || tx.type,
    amount: tx.amount,
    currency: tx.currency,
    customerEmail: tx.consumer.email,
    customerName: tx.consumer.name,
    description: tx.description || "–",
    stripeId: tx.stripeChargeId || tx.stripePaymentIntentId || null,
    paymentMethodBrand: tx.paymentMethodBrand,
    paymentMethodLast4: tx.paymentMethodLast4,
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <TransactionTable
        transactions={formattedTransactions}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        timeZone={business.timeZone}
        businessId={business.id}
      />
    </div>
  );
}

export default async function TransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="max-w-7xl mx-auto">
      <Suspense fallback={<TransactionsLoading />}>
        <TransactionsContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
