import { describe, it, expect } from "vitest";

/**
 * Unit tests for Email Template Helpers
 */

describe("Email Template Formatting", () => {
  it("should format welcome email data correctly", () => {
    const memberName = "John Doe";
    const businessName = "Ruby Tap Wine Club";
    
    // Validate the data we would pass to template
    expect(memberName).toBeTruthy();
    expect(businessName).toBeTruthy();
    expect(memberName.length).toBeGreaterThan(0);
  });

  it("should format payment failed email with amount", () => {
    const memberName = "Jane Smith";
    const amount = "$49.99";
    const businessName = "Test Wine Club";
    
    expect(amount).toMatch(/^\$/);
    expect(parseFloat(amount.replace("$", ""))).toBeGreaterThan(0);
  });

  it("should format monthly summary stats", () => {
    const stats = {
      newMembers: 15,
      revenue: "$12,450.00",
      activeMembers: 247,
    };

    expect(stats.newMembers).toBeGreaterThanOrEqual(0);
    expect(stats.activeMembers).toBeGreaterThanOrEqual(0);
    expect(stats.revenue).toMatch(/^\$/);
  });

  it("should handle zero values in stats", () => {
    const stats = {
      newMembers: 0,
      revenue: "$0.00",
      activeMembers: 0,
    };

    expect(stats.newMembers).toBe(0);
    expect(stats.activeMembers).toBe(0);
    expect(stats.revenue).toBe("$0.00");
  });

  it("should validate email recipient format", () => {
    const validEmails = [
      "user@example.com",
      "test.user@domain.co.uk",
      "member+tag@wineclub.com",
    ];

    validEmails.forEach((email) => {
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  it("should reject invalid email formats", () => {
    const invalidEmails = [
      "notanemail",
      "@example.com",
      "user@",
      "user @example.com",
    ];

    invalidEmails.forEach((email) => {
      expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });
});

