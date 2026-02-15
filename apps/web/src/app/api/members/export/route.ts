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

  // Build where clause from search params
  const filterName = searchParams.get("name") || "";
  const filterEmail = searchParams.get("email") || "";
  const filterStatus = searchParams.get("status") || "";
  const filterPlan = searchParams.get("plan") || "";

  const consumerWhere: Prisma.ConsumerWhereInput = {
    planSubscriptions: {
      some: {
        plan: { businessId },
      },
    },
  };

  if (filterName) {
    consumerWhere.OR = [
      { name: { contains: filterName, mode: "insensitive" } },
      { email: { startsWith: filterName, mode: "insensitive" } },
    ];
  }

  if (filterEmail) {
    consumerWhere.email = { contains: filterEmail, mode: "insensitive" };
  }

  if (filterStatus === "ACTIVE") {
    consumerWhere.planSubscriptions = {
      some: {
        plan: { businessId },
        status: { in: ["active", "trialing"] },
      },
    };
  } else if (filterStatus === "INACTIVE") {
    consumerWhere.planSubscriptions = {
      some: { plan: { businessId } },
      none: {
        plan: { businessId },
        status: { in: ["active", "trialing"] },
      },
    };
  }

  if (filterPlan) {
    consumerWhere.planSubscriptions = {
      some: {
        plan: { businessId, name: filterPlan },
        ...(filterStatus === "ACTIVE"
          ? { status: { in: ["active", "trialing"] } }
          : {}),
      },
      ...(filterStatus === "INACTIVE"
        ? {
            none: {
              plan: { businessId },
              status: { in: ["active", "trialing"] },
            },
          }
        : {}),
    };
  }

  // Fetch all matching consumers (capped at 10,000)
  const consumers = await prisma.consumer.findMany({
    where: consumerWhere,
    include: {
      planSubscriptions: {
        where: { plan: { businessId } },
        include: { plan: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  // Build CSV
  const headers = ["Name", "Email", "Status", "Created", "Active Plans"];
  const rows = consumers.map((consumer) => {
    const activeStatuses = ["active", "ACTIVE", "trialing"];
    const activeSubs = consumer.planSubscriptions.filter((s) =>
      activeStatuses.includes(s.status)
    );
    const activePlans = [...new Set(activeSubs.map((s) => s.plan.name))];
    const status = activeSubs.length > 0 ? "ACTIVE" : "INACTIVE";
    const name = consumer.name || consumer.email.split("@")[0];

    return [
      name.replace(/,/g, ""),
      consumer.email,
      status,
      consumer.createdAt.toISOString().split("T")[0],
      activePlans.join("; "),
    ];
  });

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="members-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
