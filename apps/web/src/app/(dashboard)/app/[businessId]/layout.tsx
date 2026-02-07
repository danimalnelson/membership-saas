import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { LinearLayout } from "@/components/linear-layout";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { businessId } = await params;
  
  // Fetch current business
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      users: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!business) {
    notFound();
  }

  // Fetch all businesses for the user (for business switcher)
  const allBusinesses = await prisma.business.findMany({
    where: {
      users: {
        some: {
          userId: session.user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
    },
  });

  return (
    <LinearLayout
      businessId={businessId}
      business={business}
      allBusinesses={allBusinesses}
      userEmail={session.user.email || undefined}
    >
      {children}
    </LinearLayout>
  );
}

