"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, CloseIcon, MenuContainer, Menu, useMenuContext } from "@wine-club/ui";

interface FilterPillProps {
  /** The base label that always stays visible (e.g., "Name") */
  label: string;
  /** The active filter value to display after the pipe (e.g., "Dan") */
  activeValue?: string;
  active: boolean;
  onToggle: () => void;
  onClear?: () => void;
  children: React.ReactNode;
  isOpen: boolean;
  /** Footer content pinned below menu body (e.g., Apply button) */
  footer?: React.ReactNode;
}


function FilterPillTrigger({ label, activeValue, active, onClear }: { label: string; activeValue?: string; active: boolean; onClear?: () => void }) {
  const { isOpen, toggle, triggerRef } = useMenuContext();

  // Defer active styling briefly on mount so the transition is visible
  const [showActive, setShowActive] = useState(false);
  useEffect(() => {
    if (active) {
      const t = requestAnimationFrame(() => setShowActive(true));
      return () => cancelAnimationFrame(t);
    }
    setShowActive(false);
  }, [active]);

  const mergedRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
    },
    [triggerRef],
  );

  if (showActive) {
    return (
      <div className="inline-flex h-8 items-stretch rounded-md border border-gray-950 bg-gray-950 text-white dark:border-white dark:bg-white dark:text-gray-950 transition-colors">
        <button
          ref={mergedRef}
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="flex items-center gap-1.5 px-2.5 text-sm font-normal outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] rounded-l-md"
        >
          {label}
          {activeValue && (
            <>
              <span className="opacity-40">|</span>
              <span className="font-normal">{activeValue}</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClear?.(); }}
          aria-label={`Clear ${label} filter`}
          className="flex w-8 items-center justify-center border-l border-white/20 hover:bg-white/10 transition-[color,background-color,border-color,box-shadow] duration-150 outline-none focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] rounded-r-md dark:border-gray-950/20 dark:hover:bg-gray-950/10"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    );
  }

  return (
    <Button
      ref={mergedRef}
      variant="secondary"
      size="small"
      onClick={toggle}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      showChevron
      className="font-normal transition-colors"
    >
      {label}
    </Button>
  );
}

export function FilterPill({ label, activeValue, active, onToggle, onClear, children, isOpen, footer }: FilterPillProps) {
  return (
    <MenuContainer
      open={isOpen}
      onOpenChange={(open) => {
        if (open !== isOpen) onToggle();
      }}
    >
      <FilterPillTrigger label={label} activeValue={activeValue} active={active} onClear={onClear} />
      <Menu width={240} footer={footer}>
        {children}
      </Menu>
    </MenuContainer>
  );
}
