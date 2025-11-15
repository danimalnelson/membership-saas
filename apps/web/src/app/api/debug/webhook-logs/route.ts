import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wine-club/db";

export async function GET(req: NextRequest) {
  try {
    // Get recent webhook events with full details
    const recentWebhooks = await prisma.webhookEvent.findMany({
      orderBy: {
        id: "desc",
      },
      take: 10,
      select: {
        id: true,
        type: true,
        processed: true,
        signatureValid: true,
        processingError: true,
        accountId: true,
        body: true, // Get the full payload to see metadata
      },
    });

    return NextResponse.json({
      webhooks: recentWebhooks.map(wh => {
        const parsedPayload = wh.body as any;

        return {
          id: wh.id,
          type: wh.type,
          processed: wh.processed,
          signatureValid: wh.signatureValid,
          error: wh.processingError,
          accountId: wh.accountId,
          metadata: parsedPayload?.data?.object?.metadata || null,
          subscriptionId: parsedPayload?.data?.object?.subscription || null,
          customerId: parsedPayload?.data?.object?.customer || null,
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

