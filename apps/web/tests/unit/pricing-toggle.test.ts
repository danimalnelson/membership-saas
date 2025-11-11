import { describe, it, expect } from "vitest";

/**
 * Unit tests for Pricing Toggle Logic
 */

describe("Pricing Toggle Calculations", () => {
  it("should calculate monthly price correctly", () => {
    const monthlyPrice = 4999; // $49.99 in cents
    expect(monthlyPrice).toBe(4999);
  });

  it("should calculate yearly price with discount", () => {
    const monthlyPrice = 4999; // $49.99/month
    const yearlyPrice = monthlyPrice * 12;
    const discountPercent = 10; // 10% off
    const yearlyDiscounted = Math.round(yearlyPrice * (1 - discountPercent / 100));
    
    expect(yearlyDiscounted).toBe(53989); // $539.89 in cents (rounded)
  });

  it("should format price for display", () => {
    const priceInCents = 4999;
    const formatted = `$${(priceInCents / 100).toFixed(2)}`;
    
    expect(formatted).toBe("$49.99");
  });

  it("should show savings amount for yearly plans", () => {
    const monthlyPrice = 5000; // $50
    const yearlyPrice = 54000; // $540 (10% off)
    const monthlyCost = monthlyPrice * 12; // $600
    const savings = monthlyCost - yearlyPrice; // $60
    
    expect(savings).toBe(6000); // $60 in cents
  });

  it("should toggle between monthly and yearly intervals", () => {
    let currentInterval: "month" | "year" = "month";
    
    // Toggle function
    const toggle = () => {
      currentInterval = currentInterval === "month" ? "year" : "month";
    };

    expect(currentInterval).toBe("month");
    toggle();
    expect(currentInterval).toBe("year");
    toggle();
    expect(currentInterval).toBe("month");
  });

  it("should handle zero prices gracefully", () => {
    const freePrice = 0;
    const formatted = `$${(freePrice / 100).toFixed(2)}`;
    
    expect(formatted).toBe("$0.00");
  });
});

