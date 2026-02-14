"use client";

import React from "react";

/**
 * Pause-circle icon from Vercel Geist Design System.
 * Source: https://vercel.com/geist/icons — right-click "pause-circle" → Copy SVG
 */
export function PauseCircle({
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
      <path d="M14.5 8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-5.5-2.5h-5v5h5v-5Z" />
    </svg>
  );
}
