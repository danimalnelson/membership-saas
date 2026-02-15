import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { getBusinessBySlug } from "@/lib/data/business";
import { formatDate } from "@wine-club/ui";
import { ChevronBreadcrumb } from "@/components/icons/ChevronBreadcrumb";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EditMemberInfoDialog } from "@/components/members/EditMemberInfoDialog";
import { ActiveSubscriptionsTable } from "@/components/members/ActiveSubscriptionsTable";
import { MemberActivity, type MemberActivityEvent } from "@/components/members/MemberActivity";
import { MemberNotes } from "@/components/members/MemberNotes";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ businessSlug: string; consumerId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { businessSlug, consumerId } = await params;

  // Uses React cache() — shared with layout
  const business = await getBusinessBySlug(businessSlug, session.user.id);

  if (!business) {
    notFound();
  }

  // Run consumer, subscriptions, transactions, and notes queries in parallel
  const [consumer, subscriptions, transactions, notes] = await Promise.all([
    prisma.consumer.findUnique({
      where: { id: consumerId },
    }),
    prisma.planSubscription.findMany({
      where: {
        consumerId,
        plan: { businessId: business.id },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: {
        consumerId,
        businessId: business.id,
      },
      orderBy: { createdAt: "desc" },
    }),
    (async () => {
      try {
        if (prisma.memberNote) {
          return await prisma.memberNote.findMany({
            where: { consumerId },
            include: {
              createdBy: {
                select: { name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
          });
        }
        return [];
      } catch {
        return [];
      }
    })(),
  ]);

  if (!consumer) {
    notFound();
  }

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active" || sub.status === "trialing"
  );

  // Build unified activity timeline from subscriptions + transactions
  const activityEvents: MemberActivityEvent[] = [];

  // Subscription lifecycle events
  for (const sub of subscriptions) {
    activityEvents.push({
      id: `sub-created-${sub.id}`,
      type: "SUBSCRIPTION_CREATED",
      date: sub.createdAt,
      description: sub.plan.name,
      planName: sub.plan.name,
      amount: null,
      currency: null,
    });

    if (sub.status === "canceled") {
      activityEvents.push({
        id: `sub-cancelled-${sub.id}`,
        type: "SUBSCRIPTION_CANCELLED",
        date: sub.updatedAt,
        description: sub.plan.name,
        planName: sub.plan.name,
        amount: null,
        currency: null,
      });
    }

    if (sub.pausedAt) {
      activityEvents.push({
        id: `sub-paused-${sub.id}`,
        type: "SUBSCRIPTION_PAUSED",
        date: sub.pausedAt,
        description: sub.plan.name,
        planName: sub.plan.name,
        amount: null,
        currency: null,
      });
    }
  }

  // Transaction events (payments, refunds)
  for (const tx of transactions) {
    activityEvents.push({
      id: `tx-${tx.id}`,
      type: tx.type,
      date: tx.createdAt,
      description: "",
      planName: null,
      amount: tx.amount,
      currency: tx.currency,
    });
  }

  // Sort by date, newest first
  activityEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

  const memberName = consumer.name || consumer.email.split("@")[0];

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Link
            href={`/app/${business.slug}/members`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Members
          </Link>
          <ChevronBreadcrumb size={14} className="text-gray-500 shrink-0" />
          <span className="truncate">{memberName}</span>
        </div>
      </PageHeader>

      <div className="p-6">
        <div className="w-full">
        {/* Member Info Card */}
        <SectionCard
          title="Member Information"
          actions={
            <EditMemberInfoDialog
              businessId={business.id}
              consumerId={consumer.id}
              initialName={consumer.name}
              initialPhone={consumer.phone}
              email={consumer.email}
            />
          }
          className="mb-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{consumer.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Phone</div>
                <div className="font-medium">{consumer.phone || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Member Since</div>
                <div className="font-medium">{formatDate(consumer.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Subscriptions</div>
                <div className="font-medium">{activeSubscriptions.length}</div>
              </div>
            </div>
        </SectionCard>

        {/* Active Subscriptions */}
        <SectionCard title="Active Subscriptions" className="mb-6">
          <ActiveSubscriptionsTable
            subscriptions={activeSubscriptions}
            stripeAccountId={business.stripeAccountId}
            businessSlug={businessSlug}
            emptyMessage={
              subscriptions.length === 0
                ? "This member has no subscriptions in this business."
                : undefined
            }
          />
        </SectionCard>

        {/* Activity */}
        <SectionCard title="Activity" className="mb-6">
          <MemberActivity events={activityEvents} />
        </SectionCard>

        {/* Internal Notes */}
        <div className="mt-6">
          <MemberNotes consumerId={consumer.id} notes={notes} />
        </div>
        </div>
      </div>
    </>
  );
}

