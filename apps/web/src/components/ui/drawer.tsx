"use client";

import { createPortal } from "react-dom";

/**
 * Reusable drawer (slide-out panel) for forms and detail views.
 *
 * @example
 * const [open, setOpen] = useState(false);
 * <Drawer open={open} onClose={() => setOpen(false)} title="Create plan">
 *   <PlanForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
 * </Drawer>
 *
 * With footer for sticky actions:
 * <Drawer ... footer={<div className="flex gap-2"><Button>Save</Button></div>}>
 */
import { useEffect, useCallback, useRef, useId, useState } from "react";
import { Cross } from "@/components/icons/Cross";

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

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

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
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const titleId = useId();

  useEffect(() => setMounted(true), []);
  const descriptionId = useId();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
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
    },
    []
  );

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      // Focus close button when opened
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
      {/* Backdrop - inline style ensures bg + opacity render (Tailwind opacity can fail with CSS vars) */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[100] transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
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
        className={`fixed top-0 bottom-0 z-[100] flex flex-col bg-white border-neutral-400 shadow-xl transition-transform duration-200 ease-in-out ${
          isRight ? "right-0 border-l" : "left-0 border-r"
        } ${open ? "translate-x-0" : isRight ? "translate-x-full" : "-translate-x-full"}`}
        style={{ width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 h-[61px] border-b border-neutral-400 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-sm font-medium text-neutral-950 truncate">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="text-xs text-neutral-600 truncate mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-neutral-100 transition-colors shrink-0"
          >
            <Cross size={16} className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-neutral-400 bg-neutral-50">
            {footer}
          </div>
        )}
      </div>
    </>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
