import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@wine-club/db";
import { getStripeClient } from "@wine-club/lib";
import { Card, CardContent, formatCurrency, formatDate } from "@wine-club/ui";

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { businessId } = await params;
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

  if (!business.stripeAccountId) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Stripe account not connected</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch invoices from Stripe
  const stripe = getStripeClient(business.stripeAccountId);
  const stripeInvoices = await stripe.invoices.list({
    limit: 100,
  });

  // Combine with subscription activity from database
  const planSubscriptions = await prisma.planSubscription.findMany({
    where: {
      plan: {
        businessId: business.id,
      },
    },
    include: {
      consumer: true,
      plan: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  // Create combined transaction list
  const transactions = [
    // Invoice payments
    ...stripeInvoices.data.map((invoice) => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000),
      type: invoice.status === "paid" ? "PAYMENT" : invoice.status === "void" ? "VOIDED" : "PENDING",
      amount: invoice.amount_paid,
      currency: invoice.currency,
      customerEmail: invoice.customer_email || "Unknown",
      customerName: invoice.customer_name || null,
      description: `Invoice ${invoice.number || invoice.id}`,
      stripeId: invoice.id,
    })),
    // Subscription events
    ...planSubscriptions.map((sub) => ({
      id: `sub-${sub.id}`,
      date: sub.createdAt,
      type: "SUBSCRIPTION_CREATED",
      amount: 0,
      currency: "usd",
      customerEmail: sub.consumer.email,
      customerName: sub.consumer.name,
      description: `Subscribed to ${sub.plan.name}`,
      stripeId: sub.stripeSubscriptionId,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{business.name} - Transactions</h1>
            <Link href={`/app/${business.id}`}>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                ← Back
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Transactions</h2>
          <p className="text-muted-foreground">
            View all payments, invoices, and subscription activity
          </p>
        </div>

        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No transactions yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium text-sm text-muted-foreground">Date</th>
                      <th className="p-4 font-medium text-sm text-muted-foreground">Customer</th>
                      <th className="p-4 font-medium text-sm text-muted-foreground">Plan</th>
                      <th className="p-4 font-medium text-sm text-muted-foreground">Type</th>
                      <th className="p-4 font-medium text-sm text-muted-foreground text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((transaction: any) => (
                      <tr key={transaction.id} className="hover:bg-muted/50">
                        <td className="p-4 text-sm">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium">
                            {transaction.customerName || transaction.customerEmail.split('@')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.customerEmail}
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          {transaction.description}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              transaction.type === "PAYMENT"
                                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                                : transaction.type === "SUBSCRIPTION_CREATED"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : transaction.type === "VOIDED"
                                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {transaction.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-right font-medium">
                          {transaction.amount > 0 
                            ? formatCurrency(transaction.amount, transaction.currency)
                            : "—"
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

