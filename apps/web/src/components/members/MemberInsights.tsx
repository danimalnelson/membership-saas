import { formatCurrency, formatDate } from "@wine-club/ui";
import { SectionCard } from "@/components/ui/section-card";

interface MemberInsightsProps {
  /** Total charged amount in cents. */
  totalCharged: number;
  /** Total refunded amount in cents. */
  totalRefunded: number;
  currency: string;
  /** When the member first joined. */
  memberSince: Date;
}

export function MemberInsights({
  totalCharged,
  totalRefunded,
  currency,
  memberSince,
}: MemberInsightsProps) {
  const netSpend = totalCharged - totalRefunded;

  return (
    <SectionCard title="Insights">
      <div className="space-y-4">
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wide">
            Member Since
          </div>
          <div className="text-sm font-medium mt-1">
            {formatDate(memberSince)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wide">
            Total Spend
          </div>
          <div className="text-2xl font-semibold mt-1">
            {formatCurrency(netSpend, currency)}
          </div>
          {totalRefunded > 0 && (
            <div className="text-xs text-gray-600 mt-1">
              {formatCurrency(totalCharged, currency)} charged &middot;{" "}
              {formatCurrency(totalRefunded, currency)} refunded
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
