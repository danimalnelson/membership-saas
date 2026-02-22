"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, SearchInput } from "@wine-club/ui";
import { Download, Plus } from "geist-icons";
import {
  DataTable,
  useDataTable,
  type Column,
  type FilterConfig,
} from "@/components/ui/data-table";
import { Drawer } from "@wine-club/ui";
import { AddMemberForm } from "./AddMemberForm";
import { MemberActions } from "./MemberActions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Member {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  joinedAt: Date;
  activePlans: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatJoinedDate(date: Date, timeZone?: string) {
  const d = date instanceof Date ? date : new Date(date);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone }).format(d);
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone }).format(d);
  const year = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone }).format(d);
  return `${month} ${day}, ${year}`;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

const EMPTY_FILTERS: FilterConfig[] = [];

function matchesSearch(m: Member, query: string): boolean {
  const q = query.toLowerCase();
  return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
}

function filterFn(_m: Member, _filters: Record<string, string>): boolean {
  return true;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MembersTable({
  members,
  businessId,
  businessSlug,
  timeZone,
}: {
  members: Member[];
  businessId: string;
  businessSlug: string;
  timeZone?: string;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return members;
    return members.filter((m) => matchesSearch(m, searchQuery.trim()));
  }, [members, searchQuery]);

  const table = useDataTable({
    data: filtered,
    filters: EMPTY_FILTERS,
    filterFn,
  });

  const columns: Column<Member>[] = [
    {
      key: "name",
      label: "Name",
      cellClassName: "font-medium",
      render: (m) => m.name,
    },
    {
      key: "email",
      label: "Email",
      render: (m) => m.email,
    },
    {
      key: "joined",
      label: "Joined",
      render: (m) => formatJoinedDate(m.joinedAt, timeZone),
    },
    {
      key: "plans",
      label: "Plans",
      cellClassName: "max-w-[200px]",
      render: (m) =>
        m.activePlans.length > 0 ? (
          <span className="block truncate" title={m.activePlans.join(", ")}>
            {m.activePlans.join(", ")}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  const exportCsv = useCallback(() => {
    const headers = ["Name", "Email", "Status", "Joined", "Active Plans"];
    const rows = table.filtered.map((m) => [
      m.name.replace(/,/g, ""),
      m.email,
      m.status,
      m.joinedAt instanceof Date ? m.joinedAt.toISOString().split("T")[0] : String(m.joinedAt).split("T")[0],
      m.activePlans.join("; "),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [table.filtered]);

  return (
  <>
    <DataTable
      title="Members"
      showPageMenu={false}
      primaryActions={
        <Button
          size="small"
          onClick={() => setDrawerOpen(true)}
          prefix={<Plus className="h-3.5 w-3.5" />}
        >
          Add member
        </Button>
      }
      columns={columns}
      data={filtered}
      keyExtractor={(m) => m.id}
      onRowClick={(m) => {
        window.location.href = `/app/${businessSlug}/members/${m.id}`;
      }}
      rowActions={(m) => (
        <MemberActions
          memberId={m.id}
          memberName={m.name}
          businessSlug={businessSlug}
        />
      )}
      tableInset={24}
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
      emptyMessage="No members found"
      filteredEmptyMessage="No members match filters"
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

    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add member">
      <AddMemberForm
        businessId={businessId}
        onSuccess={() => {
          setDrawerOpen(false);
          router.refresh();
        }}
        onCancel={() => setDrawerOpen(false)}
      />
    </Drawer>
  </>
  );
}
