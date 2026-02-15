"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@wine-club/ui";
import { useBusinessContext } from "@/contexts/business-context";

const accountNavItems = [
  { href: "", label: "Profile" },
  { href: "/notifications", label: "Notifications" },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { businessSlug } = useBusinessContext();
  const pathname = usePathname();
  const basePath = `/app/${businessSlug}/account`;

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    if (href === "") {
      return pathname === basePath;
    }
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-20 font-semibold text-gray-950">Account</h1>
        <p className="text-14 text-gray-600 mt-1">
          Manage your personal profile and preferences.
        </p>
      </div>

      {/* Sub-nav tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-300">
        {accountNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={`${basePath}${item.href}`}
              className={cn(
                "px-3 pb-2.5 text-14 font-medium transition-colors -mb-px",
                active
                  ? "text-gray-950 border-b-2 border-gray-950"
                  : "text-gray-600 hover:text-gray-950"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
