"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@wine-club/ui";
import { Badge, Button, Card, CardContent } from "@wine-club/ui";
import { Plus, Pencil } from "geist-icons";
import { Drawer } from "@wine-club/ui";
import { PlanForm } from "./PlanForm";
import { MembershipForm } from "@/components/memberships/MembershipForm";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Plan {
  id: string;
  membershipId: string;
  name: string;
  description: string;
  status: string;
  price: number | null;
  currency: string;
  setupFee: number | null;
  recurringFee: number | null;
  recurringFeeName: string | null;
  shippingFee: number | null;
  stockStatus: string;
  maxSubscribers: number | null;
  subscriptionCount: number;
}

export interface MembershipGroup {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  status: string;
  billingInterval: string;
  billingAnchor: string;
  cohortBillingDay: number | null;
  chargeImmediately: boolean;
  allowMultiplePlans: boolean;
  maxMembers: number | null;
  giftEnabled: boolean;
  waitlistEnabled: boolean;
  membersOnlyAccess: boolean;
  pauseEnabled: boolean;
  skipEnabled: boolean;
  benefits: any;
  displayOrder: number;
  plans: Plan[];
}

// For PlanForm's membership prop
interface MembershipOption {
  id: string;
  name: string;
  billingAnchor: string;
  cohortBillingDay?: number | null;
  status: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlansAndMembershipsTable({
  groups,
  businessId,
  businessSlug,
}: {
  groups: MembershipGroup[];
  businessId: string;
  businessSlug: string;
}) {
  const router = useRouter();
  const [createPlanForGroup, setCreatePlanForGroup] = useState<MembershipGroup | null>(null);
  const [membershipDrawerOpen, setMembershipDrawerOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<MembershipGroup | null>(null);
  const [editingPlan, setEditingPlan] = useState<{ plan: Plan; group: MembershipGroup } | null>(null);

  // Memberships for PlanForm drawer
  const membershipOptions: MembershipOption[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    billingAnchor: g.billingAnchor,
    cohortBillingDay: g.cohortBillingDay,
    status: g.status,
  }));

  return (
    <>
      {/* Row 1: Title */}
      <div className="sticky top-0 z-10 -mx-6 px-6 flex items-center h-[60px] border-b border-gray-300 bg-ds-background-200">
        <h1 className="text-sm font-medium text-foreground">Plans</h1>
      </div>

      {/* Row 2: Actions */}
      <div className="sticky top-[60px] z-10 -mx-6 px-6 flex items-center gap-2 h-[60px] border-b border-gray-300 bg-ds-background-200">
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setMembershipDrawerOpen(true)}
            prefix={<Plus className="h-3.5 w-3.5" />}
          >
            Create club
          </Button>
        </div>
      </div>

      {/* Clubs and plans */}
      {groups.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No clubs yet. Create a club to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {groups.map((group) => (
            <ClubCard
              key={group.id}
              group={group}
              onEditClub={() => setEditingMembership(group)}
              onAddPlan={() => setCreatePlanForGroup(group)}
              onEditPlan={(plan) => setEditingPlan({ plan, group })}
            />
          ))}
        </div>
      )}

      {/* Create drawers */}
      <Drawer open={!!createPlanForGroup} onClose={() => setCreatePlanForGroup(null)} title="Create plan">
        {createPlanForGroup && (
          <PlanForm
            businessId={businessId}
            memberships={[{
              id: createPlanForGroup.id,
              name: createPlanForGroup.name,
              billingAnchor: createPlanForGroup.billingAnchor,
              cohortBillingDay: createPlanForGroup.cohortBillingDay,
              status: createPlanForGroup.status,
            }]}
            initialData={{ membershipId: createPlanForGroup.id }}
            onSuccess={() => {
              setCreatePlanForGroup(null);
              router.refresh();
            }}
            onCancel={() => setCreatePlanForGroup(null)}
          />
        )}
      </Drawer>

      <Drawer open={membershipDrawerOpen} onClose={() => setMembershipDrawerOpen(false)} title="Create club">
        <MembershipForm
          businessId={businessId}
          onSuccess={() => {
            setMembershipDrawerOpen(false);
            router.refresh();
          }}
          onCancel={() => setMembershipDrawerOpen(false)}
        />
      </Drawer>

      {/* Edit club drawer */}
      <Drawer
        open={!!editingMembership}
        onClose={() => setEditingMembership(null)}
        title="Edit club"
      >
        {editingMembership && (
          <MembershipForm
            key={editingMembership.id}
            businessId={businessId}
            membership={editingMembership}
            onSuccess={() => {
              setEditingMembership(null);
              router.refresh();
            }}
            onCancel={() => setEditingMembership(null)}
          />
        )}
      </Drawer>

      {/* Edit plan drawer */}
      <Drawer
        open={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        title="Edit plan"
      >
        {editingPlan && (
          <PlanForm
            key={editingPlan.plan.id}
            businessId={businessId}
            memberships={membershipOptions}
            planId={editingPlan.plan.id}
            initialData={{
              membershipId: editingPlan.plan.membershipId,
              name: editingPlan.plan.name,
              description: editingPlan.plan.description,
              basePrice: editingPlan.plan.price ? (editingPlan.plan.price / 100).toString() : "",
              currency: editingPlan.plan.currency,
              interval: "MONTH",
              intervalCount: 1,
              setupFee: editingPlan.plan.setupFee ? (editingPlan.plan.setupFee / 100).toString() : "",
              recurringFee: editingPlan.plan.recurringFee ? (editingPlan.plan.recurringFee / 100).toString() : "",
              recurringFeeName: editingPlan.plan.recurringFeeName || "",
              shippingFee: editingPlan.plan.shippingFee ? (editingPlan.plan.shippingFee / 100).toString() : "",
              stockStatus: editingPlan.plan.stockStatus as any,
              maxSubscribers: editingPlan.plan.maxSubscribers?.toString() || "",
            }}
            onSuccess={() => {
              setEditingPlan(null);
              router.refresh();
            }}
            onCancel={() => setEditingPlan(null)}
          />
        )}
      </Drawer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Club card: contains plan table
// ---------------------------------------------------------------------------

function ClubCard({
  group,
  onEditClub,
  onAddPlan,
  onEditPlan,
}: {
  group: MembershipGroup;
  onEditClub: () => void;
  onAddPlan: () => void;
  onEditPlan: (plan: Plan) => void;
}) {
  const planStatusBadge = (stockStatus: string): { label: string; variant: "green-subtle" | "gray-subtle" } => {
    switch (stockStatus) {
      case "AVAILABLE":
        return { label: "Available", variant: "green-subtle" };
      case "UNAVAILABLE":
        return { label: "Not available", variant: "gray-subtle" };
      case "SOLD_OUT":
        return { label: "Sold out", variant: "gray-subtle" };
      case "COMING_SOON":
        return { label: "Coming soon", variant: "gray-subtle" };
      case "WAITLIST":
        return { label: "Waitlist only", variant: "gray-subtle" };
      default:
        return { label: "Not available", variant: "gray-subtle" };
    }
  };

  return (
    <Card className="shadow-none overflow-hidden">
      <CardContent className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">{group.name}</h2>
        </div>

        {group.plans.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-gray-300 p-4 text-sm text-muted-foreground">
            No plans yet for this club.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {group.plans.map((plan, index) => {
                  const statusBadge = planStatusBadge(plan.stockStatus);
                  return (
                    <tr
                      key={plan.id}
                      className={`h-10 cursor-pointer hover:bg-gray-100 transition-colors ${index < group.plans.length - 1 ? "border-b border-gray-300" : ""}`}
                      onClick={() => onEditPlan(plan)}
                    >
                      <td className="px-4 py-0 align-middle text-14 font-medium text-foreground">
                        {plan.name}
                      </td>
                      <td className="px-4 py-0 align-middle text-right">
                        <Badge size="sm" variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-0 align-middle text-right text-muted-foreground">
                        <span className="text-foreground font-normal">
                          {formatCurrency(plan.price ?? 0, plan.currency)}
                        </span>
                      </td>
                      <td className="px-4 py-0 align-middle text-right text-foreground whitespace-nowrap">
                        <span>{plan.subscriptionCount}</span>{" "}
                        active subscriber{plan.subscriptionCount === 1 ? "" : "s"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="-mx-6 mt-6 border-t border-gray-300 bg-ds-background-200 px-6 py-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            size="small"
            onClick={onAddPlan}
            prefix={<Plus className="h-3.5 w-3.5" />}
          >
            Add plan
          </Button>
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={onEditClub}
            prefix={<Pencil className="h-3.5 w-3.5" />}
          >
            Edit club
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
