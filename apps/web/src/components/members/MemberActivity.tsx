"use client";

import React, { useState } from "react";
import { Button, formatCurrency, formatDate } from "@wine-club/ui";
import { getTypeConfig } from "@/components/transactions/transaction-utils";
import { List, type ListColumn } from "@/components/ui/data-table";
import { PaymentMethodInline } from "@/components/ui/payment-method";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemberActivityEvent {
  id: string;
  type: string;
  date: Date;
  description: string;
  planName: string | null;
  amount: number | null;
  currency: string | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
}

// Type config imported from shared transaction-utils

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns: ListColumn<MemberActivityEvent>[] = [
  {
    key: "type",
    label: "Type",
    cellClassName: "font-medium",
    render: (event) => {
      const config = getTypeConfig(event.type);
      const Icon = config.icon;
      return (
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded shrink-0"
            style={{ width: 24, height: 24, backgroundColor: config.bg }}
          >
            <Icon size={16} color={config.color} />
          </div>
          <span>{config.label}</span>
        </div>
      );
    },
  },
  {
    key: "plan",
    label: "Plan",
    render: (event) => event.description || event.planName || "—",
  },
  {
    key: "amount",
    label: "Amount",
    render: (event) =>
      event.amount && event.currency
        ? formatCurrency(event.amount, event.currency)
        : "—",
  },
  {
    key: "paymentMethod",
    label: "Payment method",
    render: (event) => (
      <PaymentMethodInline brand={event.paymentMethodBrand} last4={event.paymentMethodLast4} />
    ),
  },
  {
    key: "date",
    label: "Date",
    render: (event) => formatDate(event.date),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 25;

export function MemberActivity({
  events,
}: {
  events: MemberActivityEvent[];
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const paginated = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <List
        columns={columns}
        items={paginated}
        keyExtractor={(e) => e.id}
        rowHeight="compact"
        emptyMessage="No activity yet"
      />
      {events.length > 0 && (
        <div className="flex items-center justify-between h-10 px-3 border-t border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-800">
          <span>
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 h-7 text-xs"
              >
                Previous
              </Button>
              <span>
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-2 h-7 text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
