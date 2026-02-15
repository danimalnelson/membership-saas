"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { FilterConfig, UseDataTableReturn } from "./use-data-table";

const DEFAULT_PAGE_SIZE = 40;

/**
 * Server-side pagination hook.
 *
 * Returns the same `UseDataTableReturn<T>` interface as `useDataTable` so that
 * `DataTable` works without any changes, but page & filter state is managed via
 * URL searchParams instead of local React state.
 *
 * The server component reads the same searchParams to build Prisma `where` +
 * `skip`/`take` clauses, then passes the already-paginated rows + totalCount
 * into this hook.
 */
export function useServerTable<T>({
  data,
  totalCount,
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  filters: filterConfigs,
}: {
  /** Current page's items (already paginated by the server). */
  data: T[];
  /** Total number of items matching current filters (from a COUNT query). */
  totalCount: number;
  /** Current 0-indexed page number (from searchParams). */
  page: number;
  /** Items per page (default 40). */
  pageSize?: number;
  /** Filter configurations to render pills. */
  filters: FilterConfig[];
}): UseDataTableReturn<T> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive committed filter values from URL
  const filterValues: Record<string, string> = {};
  for (const f of filterConfigs) {
    filterValues[f.key] = searchParams.get(f.key) || "";
  }

  // Text input drafts (local state — not committed until user presses Enter/Apply)
  const [inputValues, setInputValuesState] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of filterConfigs) {
      if (f.type === "text") initial[f.key] = searchParams.get(f.key) || "";
    }
    return initial;
  });

  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // URL navigation helpers
  // ---------------------------------------------------------------------------

  /** Build a new URL and navigate (shallow), resetting page to 0 when filters change. */
  const navigateWithParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      if (resetPage) {
        params.delete("page");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  // ---------------------------------------------------------------------------
  // Filter actions (mirror useDataTable interface but push to URL)
  // ---------------------------------------------------------------------------

  const toggleFilter = useCallback((key: string) => {
    setOpenFilter((prev) => (prev === key ? null : key));
  }, []);

  const applyTextFilter = useCallback(
    (key: string) => {
      const value = inputValues[key] || "";
      navigateWithParams({ [key]: value || null });
      setOpenFilter(null);
    },
    [inputValues, navigateWithParams],
  );

  const applySelectFilter = useCallback(
    (key: string, value: string) => {
      navigateWithParams({ [key]: value || null });
      setOpenFilter(null);
    },
    [navigateWithParams],
  );

  const clearFilter = useCallback(
    (key: string) => {
      setInputValuesState((prev) => ({ ...prev, [key]: "" }));
      navigateWithParams({ [key]: null });
      setOpenFilter(null);
    },
    [navigateWithParams],
  );

  const setInput = useCallback((key: string, value: string) => {
    setInputValuesState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ---------------------------------------------------------------------------
  // Pagination (push page number to URL)
  // ---------------------------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const setPage = useCallback(
    (pageOrFn: number | ((p: number) => number)) => {
      const newPage = typeof pageOrFn === "function" ? pageOrFn(page) : pageOrFn;
      const clamped = Math.max(0, Math.min(newPage, totalPages - 1));
      const params = new URLSearchParams(searchParams.toString());
      if (clamped === 0) {
        params.delete("page");
      } else {
        params.set("page", String(clamped));
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [page, totalPages, router, pathname, searchParams],
  );

  // ---------------------------------------------------------------------------
  // Return (same shape as useDataTable)
  // ---------------------------------------------------------------------------

  return {
    filterConfigs,
    filterValues,
    inputValues,
    openFilter,
    toggleFilter,
    applyTextFilter,
    applySelectFilter,
    clearFilter,
    setInput,
    // For server-side pagination, filtered & paginated are the same (server already did it)
    filtered: data,
    paginated: data,
    page,
    setPage,
    totalPages,
    pageSize,
    totalCount,
  };
}
