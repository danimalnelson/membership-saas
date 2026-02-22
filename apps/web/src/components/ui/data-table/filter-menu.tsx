"use client";

import { useEffect, useRef } from "react";
import { Checkbox, Input } from "@wine-club/ui";
import { FilterPill } from "./filter-pill";
import type { FilterConfig, TextFilterConfig, SelectFilterConfig } from "./use-data-table";

// ---------------------------------------------------------------------------
// Delayed-focus input — focuses after a brief delay so the ring animates in
// ---------------------------------------------------------------------------

function DelayedFocusInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Input
      ref={inputRef}
      type="text"
      size="medium"
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Shared filter menu components
// ---------------------------------------------------------------------------

export function FilterPillFromConfig({
  config,
  value,
  inputValue,
  isOpen,
  onToggle,
  onClear,
  onApplyText,
  onApplySelect,
  onSetInput,
}: {
  config: FilterConfig;
  value: string;
  inputValue: string;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  onApplyText: () => void;
  onApplySelect: (value: string) => void;
  onSetInput: (value: string) => void;
}) {
  const active = !!value;

  if (config.type === "text") {
    const textConfig = config as TextFilterConfig;
    const displayValue = active
      ? textConfig.formatActive
        ? textConfig.formatActive(value)
        : value
      : undefined;

    return (
      <FilterPill
        label={config.label}
        activeValue={displayValue}
        active={active}
        onToggle={onToggle}
        onClear={onClear}
        isOpen={isOpen}
      >
        <div>
          <DelayedFocusInput
            placeholder={textConfig.placeholder || "contains..."}
            maxLength={textConfig.maxLength}
            value={inputValue}
            onChange={(e) => {
              const v = textConfig.inputTransform ? textConfig.inputTransform(e.target.value) : e.target.value;
              onSetInput(v);
            }}
          />
        </div>
      </FilterPill>
    );
  }

  // Multi-select filter
  return (
    <MultiSelectFilterPill
      config={config as SelectFilterConfig}
      value={value}
      active={active}
      isOpen={isOpen}
      onToggle={onToggle}
      onClear={onClear}
      onApplySelect={onApplySelect}
    />
  );
}

function MultiSelectFilterPill({
  config,
  value,
  active,
  isOpen,
  onToggle,
  onClear,
  onApplySelect,
}: {
  config: SelectFilterConfig;
  value: string;
  active: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  onApplySelect: (value: string) => void;
}) {
  const selectedValues = value ? value.split(",") : [];

  const toggleOption = (optValue: string) => {
    const current = new Set(selectedValues);
    if (current.has(optValue)) {
      current.delete(optValue);
    } else {
      current.add(optValue);
    }
    onApplySelect(Array.from(current).join(","));
  };

  // Build display value for the pill
  const displayValue = active
    ? config.formatActive
      ? config.formatActive(value)
      : selectedValues
          .map((v) => config.options.find((o) => o.value === v)?.label || v)
          .join(", ")
    : undefined;

  return (
    <FilterPill
      label={config.label}
      activeValue={displayValue}
      active={active}
      onToggle={onToggle}
      onClear={onClear}
      isOpen={isOpen}
    >
      <div className="min-h-0">
        <div className="flex flex-col gap-0.5">
          {config.options.map((opt) => {
            const checked = selectedValues.includes(opt.value);
            return (
              <Checkbox
                key={opt.value}
                checked={checked}
                onChange={() => toggleOption(opt.value)}
                className="w-full h-9 px-2 rounded-md text-sm font-normal hover:bg-gray-100"
              >
                {opt.icon ? (
                  <span className="flex items-center gap-1.5">
                    <span className="shrink-0">{opt.icon}</span>
                    {opt.label}
                  </span>
                ) : (
                  opt.label
                )}
              </Checkbox>
            );
          })}
        </div>
      </div>
    </FilterPill>
  );
}
