import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma, Prisma } from "@wine-club/db";
import { getBusinessBySlug } from "@/lib/data/business";
import { MembersTable } from "@/components/members/MembersTable";
import MembersLoading from "./loading";

const PAGE_SIZE = 40;

async function MembersContent({
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

  // Parse searchParams
  const sp = await searchParams;
  const page = Math.max(0, parseInt(String(sp.page || "0"), 10) || 0);
  const filterName = typeof sp.name === "string" ? sp.name : "";
  const filterEmail = typeof sp.email === "string" ? sp.email : "";
  const filterStatus = typeof sp.status === "string" ? sp.status : "";
  const filterPlan = typeof sp.plan === "string" ? sp.plan : "";

  // Build where clause for consumers who have subscriptions to this business's plans
  const consumerWhere: Prisma.ConsumerWhereInput = {
    planSubscriptions: {
      some: {
        plan: { businessId: business.id },
      },
    },
  };

  // Name filter
  if (filterName) {
    consumerWhere.OR = [
      { name: { contains: filterName, mode: "insensitive" } },
      { email: { startsWith: filterName, mode: "insensitive" } },
    ];
  }

  // Email filter
  if (filterEmail) {
    consumerWhere.email = { contains: filterEmail, mode: "insensitive" };
  }

  // Status filter: ACTIVE means at least one active/trialing sub, INACTIVE means none
  // We handle this by adjusting the query's "some" clause
  if (filterStatus === "ACTIVE") {
    consumerWhere.planSubscriptions = {
      some: {
        plan: { businessId: business.id },
        status: { in: ["active", "trialing"] },
      },
    };
  } else if (filterStatus === "INACTIVE") {
    // Consumer has subs for this business, but NONE are active/trialing
    consumerWhere.planSubscriptions = {
      some: {
        plan: { businessId: business.id },
      },
      none: {
        plan: { businessId: business.id },
        status: { in: ["active", "trialing"] },
      },
    };
  }

  // Plan filter: consumer must have a subscription to a plan with this name
  if (filterPlan) {
    consumerWhere.planSubscriptions = {
      some: {
        plan: {
          businessId: business.id,
          name: filterPlan,
        },
        ...(filterStatus === "ACTIVE"
          ? { status: { in: ["active", "trialing"] } }
          : {}),
      },
      ...(filterStatus === "INACTIVE"
        ? {
            none: {
              plan: { businessId: business.id },
              status: { in: ["active", "trialing"] },
            },
          }
        : {}),
    };
  }

  // Run count + data queries in parallel
  const [totalCount, consumers] = await Promise.all([
    prisma.consumer.count({ where: consumerWhere }),
    prisma.consumer.findMany({
      where: consumerWhere,
      include: {
        planSubscriptions: {
          where: {
            plan: { businessId: business.id },
          },
          include: {
            plan: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  // Get all plan names for this business (for the Plan filter dropdown)
  const allPlans = await prisma.plan.findMany({
    where: { businessId: business.id },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  const allPlanNames = [...new Set(allPlans.map((p) => p.name))];

  // Shape into flat member objects
  const members = consumers.map((consumer) => {
    const activeStatuses = ["active", "ACTIVE", "trialing"];
    const activeSubs = consumer.planSubscriptions.filter((s) =>
      activeStatuses.includes(s.status)
    );
    const activePlans = [...new Set(activeSubs.map((s) => s.plan.name))];

    return {
      id: consumer.id,
      name: consumer.name || consumer.email.split("@")[0],
      email: consumer.email,
      status: (activeSubs.length > 0 ? "ACTIVE" : "INACTIVE") as "ACTIVE" | "INACTIVE",
      joinedAt: consumer.createdAt,
      activePlans,
    };
  });

  return (
    <MembersTable
      members={members}
      totalCount={totalCount}
      page={page}
      pageSize={PAGE_SIZE}
      allPlanNames={allPlanNames}
      businessId={business.id}
      businessSlug={business.slug}
      timeZone={business.timeZone}
    />
  );
}

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="max-w-7xl mx-auto">
      <Suspense fallback={<MembersLoading />}>
        <MembersContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
