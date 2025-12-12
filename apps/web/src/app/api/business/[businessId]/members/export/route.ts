import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { requireBusinessAuth, withMiddleware } from "@wine-club/lib";

export const GET = withMiddleware(async (req: NextRequest) => {
  const { businessId } = await (req as any).params as { businessId: string };

  // Authenticate and authorize
  const authResult = await requireBusinessAuth(authOptions, prisma, businessId);

  if ("error" in authResult) {
    return authResult.error;
  }

  // Get all members with their subscriptions
  const subscriptions = await prisma.planSubscription.findMany({
    where: {
      plan: { businessId },
    },
    include: {
      consumer: true,
      plan: {
        include: {
          membership: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Dedupe by consumer (one row per member with their most recent subscription)
  const memberMap = new Map<
    string,
    {
      name: string;
      email: string;
      plan: string;
      status: string;
      joinDate: string;
    }
  >();

  for (const sub of subscriptions) {
    // Skip if we already have this consumer (keep the most recent)
    if (memberMap.has(sub.consumerId)) continue;

    memberMap.set(sub.consumerId, {
      name: sub.consumer.name || "",
      email: sub.consumer.email,
      plan: `${sub.plan.membership.name} - ${sub.plan.name}`,
      status: formatStatus(sub.status),
      joinDate: sub.createdAt.toISOString().split("T")[0],
    });
  }

  // Generate CSV
  const headers = ["Name", "Email", "Plan", "Status", "Join Date"];
  const rows = Array.from(memberMap.values()).map((member) => [
    escapeCsvField(member.name),
    escapeCsvField(member.email),
    escapeCsvField(member.plan),
    escapeCsvField(member.status),
    member.joinDate,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Get business name for filename
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true },
  });
  const filename = `${slugify(business?.name || "members")}-members-${new Date().toISOString().split("T")[0]}.csv`;

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7ebd8bc0-6508-4d0d-819b-62165c5218ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export/route.ts:beforeResponse',message:'CSV content and headers',data:{csvContentLength:csvContent.length,csvPreview:csvContent.slice(0,200),filename},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2-H3'})}).catch(()=>{});
  // #endregion

  // Create response with CSV headers
  const response = new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7ebd8bc0-6508-4d0d-819b-62165c5218ee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'export/route.ts:afterResponse',message:'Response created',data:{contentType:response.headers.get('Content-Type'),contentDisposition:response.headers.get('Content-Disposition')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H2'})}).catch(()=>{});
  // #endregion

  return response;
});

/**
 * Escape a field for CSV (wrap in quotes if contains comma, quote, or newline)
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format subscription status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Active",
    trialing: "Trial",
    past_due: "Past Due",
    canceled: "Canceled",
    paused: "Paused",
    unpaid: "Unpaid",
    incomplete: "Incomplete",
  };
  return statusMap[status] || status;
}

/**
 * Convert string to URL-safe slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
