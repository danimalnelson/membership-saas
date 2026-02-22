"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, SearchInput, formatCurrency, MenuContainer, Menu, MenuItem, MenuIconTrigger } from "@wine-club/ui";
import { Download, MoreHorizontal } from "geist-icons";
import { getTypeConfig, TypeBadge } from "./transaction-utils";
import {
  DataTable,
  useDataTable,
  type Column,
  type FilterConfig,
} from "@/components/ui/data-table";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { PaymentMethodInline } from "@/components/ui/payment-method";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Transaction {
  id: string;
  date: Date;
  dateDisplay: string;
  type: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string | null;
  consumerId: string;
  description: string;
  stripeId: string | null;
  /** Set when this event can be refunded — either a DB transaction ID (for CHARGE)
      or a Stripe subscription ID prefixed with "stripe:" (for SUBSCRIPTION_CREATED) */
  refundableId: string | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}

// ---------------------------------------------------------------------------
// Type icon helper (for filter options)
// ---------------------------------------------------------------------------

function TypeIcon({ type }: { type: string }) {
  const config = getTypeConfig(type);
  const Icon = config.icon;
  return (
    <div
      className="flex items-center justify-center rounded shrink-0"
      style={{ width: 24, height: 24, backgroundColor: config.bg }}
    >
      <Icon size={16} color={config.color} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Filter + column config
// ---------------------------------------------------------------------------

const TYPE_FILTER: FilterConfig = {
  type: "select",
  key: "type",
  label: "Type",
  options: [
    { value: "SUBSCRIPTION_CREATED", label: "Started", icon: <TypeIcon type="SUBSCRIPTION_CREATED" /> },
    { value: "CHARGE", label: "Renewed", icon: <TypeIcon type="CHARGE" /> },
    { value: "SUBSCRIPTION_PAUSED", label: "Paused", icon: <TypeIcon type="SUBSCRIPTION_PAUSED" /> },
    { value: "CANCELED", label: "Canceled", icon: <TypeIcon type="SUBSCRIPTION_CANCELLED" /> },
    { value: "RENEWAL_FAILED", label: "Failed", icon: <TypeIcon type="RENEWAL_FAILED" /> },
  ],
};

function buildFilterConfigs(activePlanNames: string[]): FilterConfig[] {
  return [
    TYPE_FILTER,
    {
      type: "select",
      key: "plan",
      label: "Plan",
      options: activePlanNames.map((p) => ({ value: p, label: p })),
    },
  ];
}

function matchesSearch(t: Transaction, query: string): boolean {
  const q = query.toLowerCase();
  const name = (t.customerName || t.customerEmail.split("@")[0]).toLowerCase();
  const email = t.customerEmail.toLowerCase();
  const plan = t.description.toLowerCase();
  const brand = (t.paymentMethodBrand || "").toLowerCase();
  const last4 = t.paymentMethodLast4 || "";
  if (name.includes(q) || email.includes(q) || plan.includes(q) || brand.includes(q) || last4.includes(q)) {
    return true;
  }
  const stripped = query.replace(/^\$/, "");
  const num = parseFloat(stripped);
  if (!isNaN(num) && t.amount > 0) {
    const amountDollars = t.amount / 100;
    if (stripped.includes(".")) {
      return amountDollars === num;
    }
    return Math.floor(amountDollars) === num;
  }
  return false;
}

function filterFn(t: Transaction, filters: Record<string, string>): boolean {
  if (filters.type) {
    const selected = new Set(filters.type.split(","));
    if (selected.has("CANCELED")) {
      selected.delete("CANCELED");
      selected.add("SUBSCRIPTION_CANCELLED");
      selected.add("CANCELLATION_SCHEDULED");
    }
    if (!selected.has(t.type)) return false;
  }
  if (filters.plan) {
    const plans = filters.plan.split(",");
    if (!plans.includes(t.description)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Row actions
// ---------------------------------------------------------------------------

function TransactionActions({
  transaction,
  businessSlug,
  stripeAccountId,
}: {
  transaction: Transaction;
  businessSlug: string;
  stripeAccountId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const canRefund = !!transaction.refundableId;
  const stripeUrl = transaction.stripeId
    ? `https://dashboard.stripe.com/${stripeAccountId ? `connect/accounts/${stripeAccountId}/` : ""}payments/${transaction.stripeId}`
    : null;

  const handleRefund = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundableId: transaction.refundableId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refund");
      }

      setShowRefundDialog(false);
      router.refresh();
    } catch (error: any) {
      alert(`Refund failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <MenuContainer>
          <MenuIconTrigger><MoreHorizontal className="h-4 w-4" /></MenuIconTrigger>
          <Menu width={192} align="end">
            {canRefund && (
              <MenuItem onClick={() => setShowRefundDialog(true)}>
                Refund
              </MenuItem>
            )}
            <MenuItem onClick={() => router.push(`/app/${businessSlug}/members/${transaction.consumerId}`)}>
              View member
            </MenuItem>
            {stripeUrl && (
              <MenuItem href={stripeUrl} target="_blank">
                View on Stripe
              </MenuItem>
            )}
          </Menu>
        </MenuContainer>
      </div>

      {canRefund && (
        <Dialog
          open={showRefundDialog}
          onClose={() => setShowRefundDialog(false)}
          title="Refund Payment"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowRefundDialog(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="error" onClick={handleRefund} loading={loading}>
                Refund {formatCurrency(transaction.amount, transaction.currency)}
              </Button>
            </>
          }
        >
          <p className="text-sm text-gray-600 dark:text-gray-800">
            This will issue a full refund of{" "}
            <strong>{formatCurrency(transaction.amount, transaction.currency)}</strong>{" "}
            to {transaction.customerName || transaction.customerEmail}.
            This action cannot be undone.
          </p>
        </Dialog>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TransactionTable({
  transactions,
  activePlanNames,
  businessSlug,
  stripeAccountId,
}: {
  transactions: Transaction[];
  activePlanNames: string[];
  businessSlug: string;
  stripeAccountId: string;
}) {
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [searchQuery, setSearchQuery] = useState("");

  const filterConfigs = React.useMemo(
    () => buildFilterConfigs(activePlanNames),
    [activePlanNames]
  );

  const preFiltered = React.useMemo(() => {
    let items = transactions.filter((t) => t.type !== "START_FAILED");
    if (dateRange.from || dateRange.to) {
      items = items.filter((t) => {
        const d = t.date instanceof Date ? t.date.getTime() : new Date(t.date).getTime();
        if (dateRange.from && d < dateRange.from.getTime()) return false;
        if (dateRange.to && d > dateRange.to.getTime()) return false;
        return true;
      });
    }
    if (searchQuery.trim()) {
      items = items.filter((t) => matchesSearch(t, searchQuery.trim()));
    }
    return items;
  }, [transactions, dateRange, searchQuery]);

  const table = useDataTable({
    data: preFiltered,
    filters: filterConfigs,
    filterFn,
  });

  const columns: Column<Transaction>[] = [
    {
      key: "type",
      label: "Type",
      cellClassName: "font-medium",
      render: (t) => <TypeBadge type={t.type} />,
    },
    {
      key: "name",
      label: "Name",
      render: (t) => t.customerName || t.customerEmail.split("@")[0],
    },
    {
      key: "email",
      label: "Email",
      render: (t) => t.customerEmail,
    },
    {
      key: "plan",
      label: "Plan",
      render: (t) => t.description,
    },
    {
      key: "amount",
      label: "Amount",
      render: (t) => (t.amount > 0 ? formatCurrency(t.amount, t.currency) : "—"),
    },
    {
      key: "paymentMethod",
      label: "Payment method",
      render: (t) => <PaymentMethodInline brand={t.paymentMethodBrand} last4={t.paymentMethodLast4} />,
    },
    {
      key: "date",
      label: "Date",
      render: (t) => t.dateDisplay,
    },
  ];

  const exportCsv = useCallback(() => {
    const headers = ["Type", "Name", "Email", "Plan", "Amount", "Payment Method", "Date"];
    const rows = table.filtered.map((t) => [
      t.type.replace(/_/g, " "),
      (t.customerName || t.customerEmail.split("@")[0]).replace(/,/g, ""),
      t.customerEmail,
      t.description.replace(/,/g, ""),
      t.amount > 0 ? (t.amount / 100).toFixed(2) : "0.00",
      t.paymentMethodBrand && t.paymentMethodLast4
        ? `${t.paymentMethodBrand} ****${t.paymentMethodLast4}`
        : "",
      t.date instanceof Date ? t.date.toISOString().split("T")[0] : String(t.date).split("T")[0],
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [table.filtered]);

  const router = useRouter();

  return (
    <DataTable
      title="Activity"
      columns={columns}
      data={preFiltered}
      keyExtractor={(t) => t.id}
      onRowClick={(t) => router.push(`/app/${businessSlug}/transactions/${t.id}`)}
      table={table}
      searchInput={
        <SearchInput
          size="small"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[240px]"
        />
      }
      extraFilters={
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      }
      rowActions={(t) => (
        <TransactionActions
          transaction={t}
          businessSlug={businessSlug}
          stripeAccountId={stripeAccountId}
        />
      )}
      emptyMessage="No transactions found"
      filteredEmptyMessage="No transactions found"
      actions={
        <Button
          variant="secondary"
          size="small"
          onClick={exportCsv}
          prefix={<Download className="h-3.5 w-3.5" />}
        >
          Export
        </Button>
      }
    />
  );
}
