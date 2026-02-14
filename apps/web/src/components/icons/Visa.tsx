"use client";

import React, { useId } from "react";

/**
 * Visa card icon from Vercel Geist Design System.
 * Source: https://vercel.com/geist/icons — right-click "logo-visa" → Copy SVG
 */
export function Visa({
  size = 24,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const id = useId();
  const gradientId = `paint0_linear_${id.replace(/:/g, "")}`;
  const clipId = `clip0_${id.replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      strokeLinejoin="round"
      {...props}
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="68.1717"
          y1="96.448"
          x2="69.5566"
          y2="40.8729"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="1" stopColor="white" stopOpacity={1} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect width="16" height="16" rx="2" fill="white" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d="M0 0H16V16H0V0Z" fill="#1434CB" />
        <path
          d="M9.70766 4.44446L7.85966 9.21868L7.08989 5.15557C6.98678 4.69868 6.62766 4.44446 6.26855 4.44446H3.60722L3.55566 4.64801C4.17166 4.80001 4.63478 4.95201 5.04544 5.15557C5.17344 5.21957 5.28011 5.33335 5.345 5.81601L6.67922 11.5556H8.57789L11.5557 4.44446H9.70766Z"
          fill={`url(#${gradientId})`}
        />
      </g>
    </svg>
  );
}
