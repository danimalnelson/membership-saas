import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, Prisma } from "@wine-club/db";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  // Verify user has access to this business
  const businessUser = await prisma.businessUser.findFirst({
    where: { userId: session.user.id, businessId },
  });

  if (!businessUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build where clause from search params (same logic as page)
  const where: Prisma.TransactionWhereInput = { businessId };

  const filterType = searchParams.get("type") || "";
  const filterName = searchParams.get("name") || "";
  const filterEmail = searchParams.get("email") || "";
  const filterPlan = searchParams.get("plan") || "";
  const filterLast4 = searchParams.get("last4") || "";

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

  if (filterName) {
    where.consumer = {
      ...((where.consumer as Prisma.ConsumerWhereInput) || {}),
      name: { contains: filterName, mode: "insensitive" },
    };
  }

  if (filterEmail) {
    where.consumer = {
      ...((where.consumer as Prisma.ConsumerWhereInput) || {}),
      email: { contains: filterEmail, mode: "insensitive" },
    };
  }

  if (filterPlan) {
    where.description = { contains: filterPlan, mode: "insensitive" };
  }

  if (filterLast4) {
    where.paymentMethodLast4 = { contains: filterLast4 };
  }

  // Fetch all matching transactions (capped at 10,000 to prevent abuse)
  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      consumer: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  // Type display map
  const typeDisplayMap: Record<string, string> = {
    CHARGE: "Payment",
    REFUND: "Refund",
    PAYOUT_FEE: "Payout fee",
    SUBSCRIPTION_CREATED: "Subscription started",
    SUBSCRIPTION_CANCELLED: "Subscription cancelled",
    SUBSCRIPTION_PAUSED: "Subscription paused",
  };

  // Build CSV
  const headers = ["Type", "Name", "Email", "Plan", "Amount", "Payment Method", "Date"];
  const rows = transactions.map((tx) => [
    typeDisplayMap[tx.type] || tx.type.replace(/_/g, " "),
    (tx.consumer.name || tx.consumer.email.split("@")[0]).replace(/,/g, ""),
    tx.consumer.email,
    (tx.description || "").replace(/,/g, ""),
    tx.amount > 0 ? (tx.amount / 100).toFixed(2) : "0.00",
    tx.paymentMethodBrand && tx.paymentMethodLast4
      ? `${tx.paymentMethodBrand} ****${tx.paymentMethodLast4}`
      : "",
    tx.createdAt.toISOString().split("T")[0],
  ]);

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
