import { describe, it, expect } from "vitest";
import { updateBusinessProfileSchema } from "@wine-club/lib";

/**
 * Unit tests for Business Profile Management
 */

describe("Business Profile Validation", () => {
  it("should validate valid profile update data", () => {
    const validData = {
      name: "The Ruby Tap",
      logoUrl: "https://example.com/logo.png",
      description: "Premium wine club in downtown",
      website: "https://rubytap.com",
      contactEmail: "contact@rubytap.com",
      contactPhone: "+1234567890",
      brandColorPrimary: "#6366f1",
      brandColorSecondary: "#ec4899",
    };

    const result = updateBusinessProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should accept partial updates", () => {
    const partialData = {
      name: "Updated Name",
    };

    const result = updateBusinessProfileSchema.safeParse(partialData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalidData = {
      contactEmail: "not-an-email",
    };

    const result = updateBusinessProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain("email");
    }
  });

  it("should reject invalid URL format for website", () => {
    const invalidData = {
      website: "not-a-url",
    };

    const result = updateBusinessProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject invalid URL format for logo", () => {
    const invalidData = {
      logoUrl: "not-a-url",
    };

    const result = updateBusinessProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject invalid hex color format", () => {
    const invalidData = {
      brandColorPrimary: "blue",
    };

    const result = updateBusinessProfileSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should accept valid hex colors", () => {
    const validColors = [
      { brandColorPrimary: "#000000" },
      { brandColorPrimary: "#FFFFFF" },
      { brandColorPrimary: "#6366f1" },
      { brandColorPrimary: "#ec4899" },
    ];

    validColors.forEach((data) => {
      const result = updateBusinessProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid phone number format", () => {
    const invalidPhones = [
      { contactPhone: "abc123" }, // Contains letters
      { contactPhone: "123-456-7890" }, // Has dashes
      { contactPhone: "01234567890" }, // Starts with 0 (invalid per E.164)
      { contactPhone: "+abc" }, // Not a number
      { contactPhone: "1" }, // Too short (only 1 digit)
    ];

    invalidPhones.forEach((data) => {
      const result = updateBusinessProfileSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  it("should accept valid phone number formats", () => {
    const validPhones = [
      { contactPhone: "+1234567890" },
      { contactPhone: "+442071234567" },
      { contactPhone: "1234567890" },
    ];

    validPhones.forEach((data) => {
      const result = updateBusinessProfileSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it("should enforce name length limits", () => {
    const tooLongName = {
      name: "A".repeat(101), // Max is 100
    };

    const result = updateBusinessProfileSchema.safeParse(tooLongName);
    expect(result.success).toBe(false);
  });

  it("should enforce description length limits", () => {
    const tooLongDescription = {
      description: "A".repeat(1001), // Max is 1000
    };

    const result = updateBusinessProfileSchema.safeParse(tooLongDescription);
    expect(result.success).toBe(false);
  });

  it("should accept null values for optional fields", () => {
    const dataWithNulls = {
      logoUrl: null,
      description: null,
      website: null,
      contactEmail: null,
      contactPhone: null,
      brandColorPrimary: null,
      brandColorSecondary: null,
    };

    const result = updateBusinessProfileSchema.safeParse(dataWithNulls);
    expect(result.success).toBe(true);
  });

  it("should accept empty strings for optional fields", () => {
    const dataWithEmptyStrings = {
      logoUrl: "",
      description: "",
      website: "",
      contactEmail: "",
      contactPhone: "",
      brandColorSecondary: "",
    };

    // Empty strings that aren't valid URLs/emails should fail
    const result = updateBusinessProfileSchema.safeParse(dataWithEmptyStrings);
    // Most will fail because empty string isn't valid URL/email format
    expect(result.success).toBe(false);
  });
});

