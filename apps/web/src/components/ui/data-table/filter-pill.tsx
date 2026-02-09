"use client";

import { useRef, useEffect } from "react";

interface FilterPillProps {
  /** The base label that always stays visible (e.g., "Name") */
  label: string;
  /** The active filter value to display after the pipe (e.g., "Dan") */
  activeValue?: string;
  active: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isOpen: boolean;
}

function PlusIcon({ active, className }: { active?: boolean; className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={className}>
      <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" />
      <g
        className="transition-transform duration-300"
        style={{ transformOrigin: "6px 6px", transform: active ? "rotate(45deg)" : "rotate(0deg)" }}
      >
        <path d="M6 3.5V8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M3.5 6H8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function FilterPill({ label, activeValue, active, onToggle, children, isOpen }: FilterPillProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className={`group inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-xs font-medium border transition-all duration-300 ${
          active
            ? "bg-[#171717] text-white border-[#171717]"
            : "bg-white text-[#666] border-[#e0e0e0] hover:border-[#ccc] hover:text-[#171717]"
        }`}
      >
        {/* Fixed 12x12 icon container — rotate + to × when active */}
        <span className="flex items-center justify-center w-3 h-3 shrink-0">
          <PlusIcon
            active={active}
            className={active ? "" : "group-hover:text-[#171717]"}
          />
        </span>
        <span>{label}</span>
        {active && activeValue && (
          <>
            <span className="opacity-40">|</span>
            <span className="font-semibold">{activeValue}</span>
          </>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-lg border border-[#eaeaea] overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
}
