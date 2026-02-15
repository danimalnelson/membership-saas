import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { requirePermission } from "@/lib/tenant-guard";
import { sendEmail, teamInviteEmail } from "@wine-club/emails";

/**
 * POST /api/business/[businessId]/team/invite
 * Invite a new team member by email.
 * If the user already exists in the system, they're added directly.
 * Otherwise, we create the user record + businessUser, and they'll
 * complete their profile when they sign in.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { businessId } = await params;
    const { email, role } = await req.json();

    // Only OWNER/ADMIN can invite
    const { business } = await requirePermission(
      session.user.id,
      businessId,
      "team.invite"
    );

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!["ADMIN", "STAFF"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be Admin or Employee." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this user is already on the team
    const existingMember = await prisma.businessUser.findFirst({
      where: {
        businessId,
        user: { email: normalizedEmail },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "This person is already on the team" },
        { status: 409 }
      );
    }

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: normalizedEmail },
      });
    }

    // Create the BusinessUser link
    await prisma.businessUser.create({
      data: {
        userId: user.id,
        businessId,
        role,
      },
    });

    // Send invite email
    const inviterName = session.user.name || session.user.email || "A team member";
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/app/${business.slug}`;

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: `You've been invited to ${business.name}`,
        html: teamInviteEmail({
          businessName: business.name,
          inviterName,
          role: role === "ADMIN" ? "Admin" : "Employee",
          dashboardUrl,
        }),
      });
    } catch (emailError) {
      console.error("[TEAM_INVITE_EMAIL_ERROR]", emailError);
      // Don't fail the invite if email fails — the user is already added
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.startsWith("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("[TEAM_INVITE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to invite team member" },
      { status: 500 }
    );
  }
}
