import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { z } from "zod";

const noteSchema = z.object({
  content: z.string().max(5000),
});

/** Verify the current user has access to this consumer via a business subscription. */
async function verifyAccess(consumerId: string, userId: string) {
  const consumer = await prisma.consumer.findUnique({
    where: { id: consumerId },
    include: {
      planSubscriptions: {
        include: {
          plan: {
            include: {
              business: {
                include: {
                  users: { where: { userId, role: { in: ["OWNER", "ADMIN"] } } },
                },
              },
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!consumer || consumer.planSubscriptions.length === 0) return null;
  if (consumer.planSubscriptions[0].plan.business.users.length === 0) return null;
  return consumer;
}

/**
 * PUT — Upsert the single note for a member.
 * If content is empty, deletes all notes for this consumer.
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ consumerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { consumerId } = await context.params;
    const body = await req.json();
    const data = noteSchema.parse(body);

    const consumer = await verifyAccess(consumerId, session.user.id);
    if (!consumer) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // If content is empty, delete any existing notes
    if (!data.content.trim()) {
      await prisma.memberNote.deleteMany({ where: { consumerId } });
      return NextResponse.json({ success: true });
    }

    // Find existing note (we only keep one)
    const existing = await prisma.memberNote.findFirst({
      where: { consumerId },
      orderBy: { createdAt: "desc" },
    });

    let note;
    if (existing) {
      note = await prisma.memberNote.update({
        where: { id: existing.id },
        data: { content: data.content },
      });
    } else {
      note = await prisma.memberNote.create({
        data: {
          consumerId,
          content: data.content,
          createdById: session.user.id,
        },
      });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Upsert note error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to save note" },
      { status: 500 }
    );
  }
}

/** POST — Legacy create endpoint (redirects to upsert behavior). */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ consumerId: string }> }
) {
  return PUT(req, context);
}

