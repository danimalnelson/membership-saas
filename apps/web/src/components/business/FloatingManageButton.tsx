import { Button } from "@wine-club/ui";
import Link from "next/link";

interface FloatingManageButtonProps {
  businessSlug: string;
}

export function FloatingManageButton({ businessSlug }: FloatingManageButtonProps) {
  return (
    <Button
      asChild
      className="bg-neutral-100 hover:bg-neutral-200 text-foreground transition-colors h-10 px-6 rounded-full shrink-0"
    >
      <Link href={`/${businessSlug}/portal`}>Manage membership</Link>
    </Button>
  );
}

