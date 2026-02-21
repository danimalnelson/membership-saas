"use client";

import * as React from "react";
import { Input, type InputProps } from "./input";
import { SearchIcon } from "./icons";

export interface SearchInputProps extends InputProps {}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onKeyDown, ...props }, forwardedRef) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    const setRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [forwardedRef]
    );

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
          const input = internalRef.current;
          if (input) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value"
            )?.set;
            if (nativeSetter) {
              nativeSetter.call(input, "");
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }
            input.blur();
          }
        }
        onKeyDown?.(e);
      },
      [onKeyDown]
    );

    return (
      <Input
        ref={setRef}
        prefix={<SearchIcon size={14} />}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
