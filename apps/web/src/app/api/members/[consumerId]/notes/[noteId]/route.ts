import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ consumerId: string; noteId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { consumerId, noteId } = await context.params;

    // Verify the note exists and user has access
    const note = await prisma.memberNote.findUnique({
      where: { id: noteId },
      include: {
        consumer: {
          include: {
            planSubscriptions: {
              include: {
                plan: {
                  include: {
                    business: {
                      include: {
                        users: {
                          where: {
                            userId: session.user.id,
                            role: {
                              in: ["OWNER", "ADMIN"],
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.consumer.planSubscriptions.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (note.consumer.planSubscriptions[0].plan.business.users.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete note
    await prisma.memberNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}

