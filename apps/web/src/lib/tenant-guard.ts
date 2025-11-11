import { prisma } from "@wine-club/db";

/**
 * Verifies user has access to a business and returns the business if authorized
 * Throws error if unauthorized
 */
export async function requireBusinessAccess(
  userId: string,
  businessId: string,
  requiredRoles?: ("OWNER" | "ADMIN" | "STAFF")[]
) {
  const businessUser = await prisma.businessUser.findUnique({
    where: {
      userId_businessId: {
        userId,
        businessId,
      },
    },
    include: {
      business: true,
    },
  });

  if (!businessUser) {
    throw new Error("Access denied: You do not have access to this business");
  }

  // Check role if specified
  if (requiredRoles && !requiredRoles.includes(businessUser.role)) {
    throw new Error(
      `Access denied: This operation requires ${requiredRoles.join(" or ")} role`
    );
  }

  return businessUser.business;
}

/**
 * Verifies a resource belongs to the specified business
 * Prevents cross-tenant access
 */
export async function verifyResourceOwnership(
  resourceType: "plan" | "member" | "price" | "subscription",
  resourceId: string,
  expectedBusinessId: string
): Promise<boolean> {
  switch (resourceType) {
    case "plan": {
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: resourceId },
        select: { businessId: true },
      });
      return plan?.businessId === expectedBusinessId;
    }

    case "member": {
      const member = await prisma.member.findUnique({
        where: { id: resourceId },
        select: { businessId: true },
      });
      return member?.businessId === expectedBusinessId;
    }

    case "price": {
      const price = await prisma.price.findUnique({
        where: { id: resourceId },
        include: { membershipPlan: { select: { businessId: true } } },
      });
      return price?.membershipPlan.businessId === expectedBusinessId;
    }

    case "subscription": {
      const subscription = await prisma.subscription.findUnique({
        where: { id: resourceId },
        include: { member: { select: { businessId: true } } },
      });
      return subscription?.member.businessId === expectedBusinessId;
    }

    default:
      return false;
  }
}

/**
 * Audit log helper for tenant actions
 */
export async function logTenantAction(
  businessId: string,
  actorUserId: string,
  action: string,
  metadata?: Record<string, any>
) {
  await prisma.auditLog.create({
    data: {
      businessId,
      actorUserId,
      type: action,
      metadata: metadata || undefined,
    },
  });
}

