"use client";

import * as React from "react";
import { cn } from "@wine-club/ui";
import { ChevronDown, ChevronUp } from "geist-icons";
import { EmptyState } from "../empty-state";

export type RowHeightPreset =
  | "sm"
  | "md"
  | "lg"
  | "compact"
  | "comfortable"
  | "spacious";

const ROW_HEIGHT_MAP: Record<RowHeightPreset, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-12",
  compact: "h-8",
  comfortable: "h-10",
  spacious: "h-12",
};

const ROW_HEIGHT_PX_MAP: Record<RowHeightPreset, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  compact: 32,
  comfortable: 40,
  spacious: 48,
};

export interface ListColumn<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  headerClassName?: string;
  cellClassName?: string;
  /** Enable sortable header for this column */
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

interface ListPropsBase<T> {
  columns: ListColumn<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  emptyDescription?: React.ReactNode;
  variableRowHeight?: boolean;
  rowHeight?: RowHeightPreset | number;
  headerHeight?: RowHeightPreset | number;
  sortState?: SortState;
  onSort?: (key: string) => void;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  cellClassName?: string;
  /** Optional actions shown on row hover, fixed on the right */
  rowActions?: (item: T) => React.ReactNode;
}

interface ListPropsFlat<T> extends ListPropsBase<T> {
  items: T[];
  onRowClick?: (item: T) => void;
}

export interface ListGroup<G, T> {
  key: string;
  group: G;
  items: T[];
}

interface ListPropsGrouped<G, T> extends ListPropsBase<T> {
  groups: ListGroup<G, T>[];
  renderGroupHeader: (group: G) => React.ReactNode;
  onGroupClick?: (group: G) => void;
  onRowClick?: (item: T) => void;
  /** Show column header row for child items (default: true) */
  showGroupHeader?: boolean;
  groupRowClassName?: string;
  childRowClassName?: string;
}

function resolveHeight(
  value: RowHeightPreset | number | undefined,
  preset: RowHeightPreset
): { className?: string; style?: React.CSSProperties } {
  if (value === undefined) return { className: ROW_HEIGHT_MAP[preset] };
  if (typeof value === "number") return { style: { height: value } };
  return { className: ROW_HEIGHT_MAP[value] };
}

function resolveHeightPx(
  value: RowHeightPreset | number | undefined,
  preset: RowHeightPreset
): number {
  if (value === undefined) return ROW_HEIGHT_PX_MAP[preset];
  if (typeof value === "number") return value;
  return ROW_HEIGHT_PX_MAP[value];
}

function renderTableHeader<T>({
  columns,
  sortState,
  onSort,
  headerHeightRes,
  headerHeightPx,
  headerClassNameProp,
  hasRowActions,
}: {
  columns: ListColumn<T>[];
  sortState?: SortState;
  onSort?: (key: string) => void;
  headerHeightRes: { className?: string; style?: React.CSSProperties };
  headerHeightPx: number;
  headerClassNameProp?: string;
  hasRowActions?: boolean;
}) {
  return (
    <thead className={cn("border-b border-gray-300 dark:border-gray-600 bg-ds-background-200 dark:bg-gray-100", headerClassNameProp)}>
      <tr className="text-left">
        {columns.map((col) => {
          const isSorted = sortState?.key === col.key;
          const canSort = col.sortable && onSort;

          return (
            <th
              key={col.key}
              scope="col"
              aria-sort={
                isSorted
                  ? sortState!.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : canSort
                    ? "none"
                    : undefined
              }
              className={cn(
                "px-3 align-middle font-medium text-sm text-gray-800 dark:text-gray-800",
                headerHeightRes.className,
                col.align === "right" && "text-right",
                canSort && "cursor-pointer select-none hover:text-gray-950 dark:hover:text-white",
                col.headerClassName
              )}
              style={headerHeightRes.style}
              onClick={canSort ? () => onSort!(col.key) : undefined}
            >
              <div className="flex items-center gap-1">
                <span>{col.label}</span>
                {canSort && isSorted &&
                  (sortState!.direction === "asc" ? (
                    <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  ))}
              </div>
            </th>
          );
        })}
        {hasRowActions && (
          <th
            scope="col"
            className="sticky right-0 z-10 w-[42px] min-w-[42px] shrink-0 bg-ds-background-200 dark:bg-gray-100 px-0"
            style={{ height: headerHeightPx }}
          />
        )}
      </tr>
    </thead>
  );
}

/**
 * Configurable list/table component. Use standalone or inside ListView.
 * Supports flat lists, grouped/nested rows, row height, sorting, and style overrides.
 */
export function List<T, G = undefined>(
  props: ListPropsFlat<T> | ListPropsGrouped<G, T>
) {
  const {
    columns,
    keyExtractor,
    emptyMessage,
    emptyDescription,
    variableRowHeight = false,
    rowHeight = "comfortable",
    headerHeight = "comfortable",
    sortState,
    onSort,
    footer,
    className,
    headerClassName: headerClassNameProp,
    rowClassName: rowClassNameProp,
    cellClassName: cellClassNameProp,
    rowActions,
  } = props;

  const headerHeightRes = resolveHeight(headerHeight, "comfortable");
  const headerHeightPx = resolveHeightPx(headerHeight, "comfortable");
  const rowHeightRes = resolveHeight(rowHeight, "comfortable");
  const rowHeightPx = resolveHeightPx(rowHeight, "comfortable");

  const isGrouped = "groups" in props && props.groups;

  if (isGrouped) {
    const {
      groups,
      renderGroupHeader,
      onGroupClick,
      onRowClick,
      showGroupHeader = true,
      groupRowClassName,
      childRowClassName,
    } = props as ListPropsGrouped<G, T>;

    const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

    if (totalItems === 0 && groups.length === 0 && emptyMessage) {
      return (
        <div className={cn("py-12 text-center", className)}>
          <EmptyState message={emptyMessage} description={emptyDescription} />
        </div>
      );
    }

    if (groups.length === 0) {
      return null;
    }

    const childRowCn = cn(
      variableRowHeight ? undefined : rowHeightRes.className,
      "transition-colors hover:bg-gray-50",
      onRowClick && "cursor-pointer",
      childRowClassName ?? rowClassNameProp
    );

    const groupRowCn = cn(
      "bg-white dark:bg-gray-100 border-b cursor-pointer active:bg-gray-200 dark:active:bg-gray-300 transition-colors",
      rowHeightRes.className,
      groupRowClassName
    );

    return (
      <div className={cn("overflow-hidden", className)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed border-collapse">
            {showGroupHeader && renderTableHeader({
              columns,
              sortState,
              onSort,
              headerHeightRes,
              headerHeightPx,
              headerClassNameProp,
              hasRowActions: !!rowActions,
            })}
            <tbody className="[&>tr]:border-b [&>tr]:border-gray-200 dark:[&>tr]:border-gray-700 [&>tr:last-child]:border-b-0">
              {groups.map(({ key, group, items }) => (
                <React.Fragment key={key}>
                  <tr
                    className={groupRowCn}
                    style={rowHeightRes.style}
                    onClick={onGroupClick ? () => onGroupClick(group) : undefined}
                  >
                    <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-3">
                      {renderGroupHeader(group)}
                    </td>
                  </tr>
                  {items.map((item) => (
                    <tr
                      key={keyExtractor(item)}
                      className={cn(childRowCn, rowActions && "group")}
                      style={
                        variableRowHeight
                          ? { minHeight: rowHeightPx }
                          : rowHeightRes.style
                      }
                      onClick={onRowClick ? () => onRowClick(item) : undefined}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "min-w-0 px-3 text-sm align-middle overflow-hidden",
                            variableRowHeight ? "py-2" : "py-0 leading-none",
                            col.align === "right" && "text-right",
                            col.cellClassName,
                            cellClassNameProp
                          )}
                        >
                          <div
                            className={cn(
                              "min-w-0 truncate overflow-hidden",
                              variableRowHeight ? undefined : "leading-none"
                            )}
                            style={{ maxHeight: rowHeightPx }}
                          >
                            {col.render(item)}
                          </div>
                        </td>
                      ))}
                      {rowActions && (
                        <td
                          className="sticky right-0 z-10 w-[42px] min-w-[42px] py-0 px-0 align-middle shrink-0 bg-white dark:bg-gray-100"
                          onClick={(e) => e.stopPropagation()}
                          style={{ height: rowHeightPx }}
                        >
                          <div className="relative flex w-[42px] items-center justify-center" style={{ height: rowHeightPx }}>
                            {rowActions(item)}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {footer}
      </div>
    );
  }

  // Flat mode
  const { items, onRowClick } = props as ListPropsFlat<T>;

  if (items.length === 0 && emptyMessage) {
    return (
      <div className={cn("py-12 text-center", className)}>
        <EmptyState message={emptyMessage} description={emptyDescription} />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const rowClassName = cn(
    variableRowHeight ? undefined : rowHeightRes.className,
    "transition-colors hover:bg-gray-50",
    onRowClick && "cursor-pointer",
    rowActions && "group",
    rowClassNameProp
  );

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          {renderTableHeader({
            columns,
            sortState,
            onSort,
            headerHeightRes,
            headerHeightPx,
            headerClassNameProp,
            hasRowActions: !!rowActions,
          })}
          <tbody className="[&>tr]:border-b [&>tr]:border-gray-200 dark:[&>tr]:border-gray-700 [&>tr:last-child]:border-b-0">
            {items.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={rowClassName}
                style={
                  variableRowHeight
                    ? { minHeight: rowHeightPx }
                    : rowHeightRes.style
                }
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "min-w-0 px-3 text-sm align-middle overflow-hidden",
                      variableRowHeight ? "py-2" : "py-0 leading-none",
                      col.align === "right" && "text-right",
                      col.cellClassName,
                      cellClassNameProp
                    )}
                  >
                    <div
                      className={cn(
                        "min-w-0 truncate overflow-hidden",
                        variableRowHeight ? undefined : "leading-none"
                      )}
                      style={{ maxHeight: rowHeightPx }}
                    >
                      {col.render(item)}
                    </div>
                  </td>
                ))}
                {rowActions && (
                  <td
                    className="sticky right-0 z-10 w-[42px] min-w-[42px] py-0 px-0 align-middle shrink-0 bg-white dark:bg-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  style={{ height: rowHeightPx }}
                  >
                  <div className="relative flex w-[42px] items-center justify-center" style={{ height: rowHeightPx }}>
                      {rowActions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
