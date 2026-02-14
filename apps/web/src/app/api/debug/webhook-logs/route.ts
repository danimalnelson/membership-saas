import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type"); // e.g. customer.subscription.deleted
    const take = Math.min(parseInt(searchParams.get("take") || "20", 10), 100);

    const recentWebhooks = await prisma.webhookEvent.findMany({
      where: typeFilter ? { type: typeFilter } : undefined,
      orderBy: { receivedAt: "desc" },
      take,
      select: {
        id: true,
        type: true,
        processed: true,
        signatureValid: true,
        processingError: true,
        accountId: true,
        receivedAt: true,
        body: true,
      },
    });

    return NextResponse.json({
      webhooks: recentWebhooks.map(wh => {
        const parsedPayload = wh.body as any;
        const obj = parsedPayload?.data?.object || {};
        return {
          id: wh.id,
          stripeEventId: parsedPayload?.id || null,
          type: wh.type,
          processed: wh.processed,
          signatureValid: wh.signatureValid,
          error: wh.processingError,
          accountId: wh.accountId,
          receivedAt: wh.receivedAt,
          subscriptionId: obj.subscription || obj.id,
          customerId: obj.customer,
          status: obj.status,
          cancellation_details: obj.cancellation_details || null,
          cancel_at_period_end: obj.cancel_at_period_end,
          metadata: obj.metadata || null,
        };
      }),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch webhook logs", details: error.message },
      { status: 500 }
    );
  }
}

