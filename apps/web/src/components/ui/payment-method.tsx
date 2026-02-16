import { Amex } from "@/components/icons/Amex";
import { Mastercard } from "@/components/icons/Mastercard";
import { Visa } from "@/components/icons/Visa";

const CARD_BRAND_LOGOS: Record<string, string> = {
  visa: "/card-brands/visa.svg",
  discover: "/card-brands/discover.svg",
};

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  diners: "Diners",
  jcb: "JCB",
  unionpay: "UnionPay",
};

export function CardBrandIcon({ brand }: { brand: string }) {
  const key = brand.toLowerCase();
  if (key === "visa") return <Visa size={16} className="h-4 w-auto" />;
  if (key === "mastercard") return <Mastercard size={16} className="h-4 w-auto" />;
  if (key === "amex") return <Amex size={16} className="h-4 w-auto" />;
  const logo = CARD_BRAND_LOGOS[key];
  return (
    <img
      src={logo || "/card-brands/generic.svg"}
      alt={CARD_BRAND_LABELS[key] || brand}
      className="h-4 w-auto"
    />
  );
}

export function PaymentMethodInline({ brand, last4 }: { brand: string | null; last4: string | null }) {
  if (!brand || !last4) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center">
      <CardBrandIcon brand={brand} />
      <span className="text-xs ml-2" style={{ letterSpacing: "0.1em" }}>••••</span>
      <span className="text-sm ml-1">{last4}</span>
    </div>
  );
}

export function PaymentMethodCard({
  brand,
  last4,
  expMonth,
  expYear,
  isDefault,
}: {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault?: boolean;
}) {
  if (!brand || !last4) return null;

  const brandLabel = CARD_BRAND_LABELS[brand.toLowerCase()] || brand;
  const expiry = expMonth && expYear
    ? `${String(expMonth).padStart(2, "0")}/${String(expYear).slice(-2)}`
    : null;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center justify-center w-9 h-6 rounded border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-100 shrink-0">
        <CardBrandIcon brand={brand} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-950 dark:text-white">
            {brandLabel} ••{last4}
          </span>
          {isDefault && (
            <span className="text-[10px] font-medium text-gray-500 uppercase">Default</span>
          )}
        </div>
        {expiry && (
          <div className="text-12 text-gray-500">Expires {expiry}</div>
        )}
      </div>
    </div>
  );
}
