"use client";

import { Button } from "@wine-club/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

interface FloatingManageButtonProps {
  businessSlug: string;
}

export function FloatingManageButton({ businessSlug }: FloatingManageButtonProps) {
  const [isVisible, setIsVisible] = useState(true);
  const SCROLL_THRESHOLD = 50; // Hide button after scrolling 50px

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show button only when at top (less than threshold)
      setIsVisible(currentScrollY <= SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Button
        size="sm"
        asChild
        className="bg-[#F5F5F5] hover:bg-[#E5E5E5] text-foreground shadow-lg transition-colors h-10 px-6 rounded-full"
      >
        <Link href={`/${businessSlug}/portal`}>Manage membership</Link>
      </Button>
    </div>
  );
}

