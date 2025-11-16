"use client";

import { useState } from "react";

interface PaymentMethod {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
}

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
  onSetDefault: (paymentMethodId: string) => Promise<void>;
  onRemove: (paymentMethodId: string) => Promise<void>;
}

export function PaymentMethodList({
  paymentMethods,
  defaultPaymentMethodId,
  onSetDefault,
  onRemove,
}: PaymentMethodListProps) {
  const [processingAction, setProcessingAction] = useState<{ id: string; action: 'default' | 'remove' } | null>(null);

  const getCardBrandIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💳";
      case "discover":
        return "💳";
      default:
        return "💳";
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    setProcessingAction({ id: paymentMethodId, action: 'default' });
    try {
      await onSetDefault(paymentMethodId);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    setProcessingAction({ id: paymentMethodId, action: 'remove' });
    try {
      await onRemove(paymentMethodId);
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="space-y-3">
      {paymentMethods.map((pm) => (
          <div
            key={pm.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getCardBrandIcon(pm.brand)}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 capitalize">
                    {pm.brand} ••••{pm.last4}
                  </span>
                  {pm.id === defaultPaymentMethodId && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Expires {pm.expMonth}/{pm.expYear}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pm.id !== defaultPaymentMethodId && (
                <button
                  onClick={() => handleSetDefault(pm.id)}
                  disabled={processingAction?.id === pm.id}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                >
                  {processingAction?.id === pm.id && processingAction?.action === 'default' 
                    ? "Setting..." 
                    : "Set as Default"}
                </button>
              )}
              {pm.id !== defaultPaymentMethodId && (
                <button
                  onClick={() => handleRemove(pm.id)}
                  disabled={processingAction?.id === pm.id}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:text-gray-400"
                >
                  {processingAction?.id === pm.id && processingAction?.action === 'remove' 
                    ? "Removing..." 
                    : "Remove"}
                </button>
              )}
            </div>
        </div>
      ))}
    </div>
  );
}

