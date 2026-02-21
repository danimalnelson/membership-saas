"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";
import { CloseIcon } from "./icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Called when the drawer should close (escape, overlay click, close button) */
  onClose: () => void;
  /** Title shown in the header */
  title: string;
  /** Optional description/subtitle below the title */
  description?: string;
  /** Main content */
  children: React.ReactNode;
  /** Optional sticky footer (e.g. form actions) */
  footer?: React.ReactNode;
  /** Panel width. Default "480px" */
  width?: string;
  /** Which side the drawer slides from */
  side?: "left" | "right";
  /** Whether clicking the overlay closes the drawer. Default true */
  closeOnOverlayClick?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "480px",
  side = "right",
  closeOnOverlayClick = true,
}: DrawerProps) {
  const [mounted, setMounted] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => setMounted(true), []);

  const handleEscape = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;

    const focusables = getFocusableElements(panelRef.current);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus?.();
    };
  }, [open, handleEscape]);

  const isRight = side === "right";

  const content = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[100] transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        style={{ backgroundColor: "rgba(250, 250, 250, 0.75)" }}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed z-[100] flex flex-col bg-white dark:bg-gray-100 border border-gray-300 dark:border-gray-600 shadow-xl rounded-2xl transition-transform duration-200 ease-in-out",
          "top-3 bottom-3",
          isRight ? "right-3" : "left-3",
          open ? "translate-x-0" : isRight ? "translate-x-[calc(100%+12px)]" : "-translate-x-[calc(100%+12px)]",
        )}
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 h-[61px] border-b border-gray-300 dark:border-gray-600 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-sm font-medium text-gray-950 dark:text-white truncate">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-xs text-gray-600 dark:text-gray-700 truncate mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors shrink-0"
          >
            <CloseIcon className="h-4 w-4 text-gray-950 dark:text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-200 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
