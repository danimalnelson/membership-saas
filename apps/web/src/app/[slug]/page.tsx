import { notFound } from "next/navigation";
import { prisma } from "@wine-club/db";
import { BusinessPhotos } from "@/components/business/BusinessPhotos";
import { MembershipListing } from "@/components/business/MembershipListing";
import { FloatingManageButton } from "@/components/business/FloatingManageButton";

// Force dynamic rendering to fetch fresh data on each request
export const dynamic = "force-dynamic";

export default async function BusinessLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: {
          plans: {
            where: { status: "ACTIVE" },
            orderBy: [
              { displayOrder: "asc" },
              { basePrice: "asc" },
            ],
          },
        },
        orderBy: [
          { displayOrder: "asc" },
          { createdAt: "desc" },
        ],
      },
    },
  });

  if (!business) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <BusinessPhotos
          businessName={business.name}
          photos={[]} // Add business.photos when available in schema
        />
      </div>

      <MembershipListing
        businessName={business.name}
        businessSlug={slug}
        businessDescription={business.description || undefined}
        memberships={business.memberships}
      />

      <FloatingManageButton businessSlug={slug} />
    </main>
  );
}
