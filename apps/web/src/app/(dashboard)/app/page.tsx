import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const businesses = await prisma.business.findMany({
    where: {
      users: {
        some: {
          userId: session.user.id,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      slug: true,
      status: true,
      stripeAccountId: true,
    },
  });

  // Redirect new users to onboarding
  if (businesses.length === 0) {
    redirect("/onboarding");
  }

  const onboardingBusiness = businesses.find(
    (business) => business.status !== "ONBOARDING_COMPLETE"
  );

  if (onboardingBusiness) {
    if (!onboardingBusiness.stripeAccountId) {
      redirect(`/onboarding/connect?businessId=${onboardingBusiness.id}`);
    }

    if (onboardingBusiness.status !== "ONBOARDING_COMPLETE") {
      redirect(`/onboarding/success?businessId=${onboardingBusiness.id}`);
    }
  }

  // Redirect to the most recently updated business dashboard
  const mostRecent = businesses[0];
  redirect(`/app/${mostRecent.slug}`);
}
