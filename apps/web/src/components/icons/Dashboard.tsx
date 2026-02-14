"use client";

import React from "react";

/**
 * Dashboard icon from Vercel Geist Design System.
 * Source: https://vercel.com/geist/icons — right-click "dashboard" → Copy SVG
 */
export function Dashboard({
  size = 24,
  color = "currentColor",
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={color}
      fillRule="evenodd"
      clipRule="evenodd"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2.5H1.5V5.005H14.5V2.5ZM14.5 6.255H6.245V13.5H13.5C14.0523 13.5 14.5 13.0523 14.5 12.5V6.255ZM4.995 6.255H1.5V12.5C1.5 13.0523 1.94772 13.5 2.5 13.5H4.995V6.255ZM1.5 1H0V2.5V12.5C0 13.8807 1.11929 15 2.5 15H13.5C14.8807 15 16 13.8807 16 12.5V2.5V1H14.5H1.5Z" />
    </svg>
  );
}
