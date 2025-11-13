import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  generateCorrelationId,
  createRequestContext,
  logRequest,
  withMiddleware,
  parseRequestBody,
  compose,
  withCacheHeaders,
  withCORS,
  type RequestContext,
} from "@wine-club/lib";

describe("API Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("generateCorrelationId", () => {
    it("should generate unique correlation IDs", () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe("createRequestContext", () => {
    it("should create context from request", () => {
      const req = new NextRequest("https://example.com/api/test", {
        method: "POST",
      });

      const context = createRequestContext(req);

      expect(context).toHaveProperty("correlationId");
      expect(context).toHaveProperty("startTime");
      expect(context.method).toBe("POST");
      expect(context.path).toBe("/api/test");
    });

    it("should use existing correlation ID from header", () => {
      const existingId = "test-correlation-123";
      const req = new NextRequest("https://example.com/api/test", {
        headers: {
          "x-correlation-id": existingId,
        },
      });

      const context = createRequestContext(req);

      expect(context.correlationId).toBe(existingId);
    });
  });

  describe("logRequest", () => {
    it("should log successful request", () => {
      const context: RequestContext = {
        correlationId: "test-123",
        startTime: Date.now() - 100,
        method: "GET",
        path: "/api/test",
      };

      logRequest(context, 200);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("test-123")
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("INFO")
      );
    });

    it("should log error with stack trace", () => {
      const context: RequestContext = {
        correlationId: "test-123",
        startTime: Date.now() - 100,
        method: "POST",
        path: "/api/test",
      };
      const error = new Error("Test error");

      logRequest(context, 500, error);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("ERROR")
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Test error")
      );
    });

    it("should use WARN level for 4xx errors", () => {
      const context: RequestContext = {
        correlationId: "test-123",
        startTime: Date.now(),
        method: "GET",
        path: "/api/test",
      };

      logRequest(context, 404);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("WARN")
      );
    });
  });

  describe("withMiddleware", () => {
    it("should add correlation ID to response", async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withMiddleware(handler);
      const req = new NextRequest("https://example.com/api/test");
      const response = await wrappedHandler(req);

      expect(response.headers.get("x-correlation-id")).toBeTruthy();
    });

    it("should catch and handle errors", async () => {
      const handler = vi.fn(async () => {
        throw new Error("Handler error");
      });

      const wrappedHandler = withMiddleware(handler);
      const req = new NextRequest("https://example.com/api/test");
      const response = await wrappedHandler(req);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    it("should pass context to handler", async () => {
      const handler = vi.fn(async (req, context) => {
        expect(context).toHaveProperty("correlationId");
        expect(context).toHaveProperty("startTime");
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withMiddleware(handler);
      const req = new NextRequest("https://example.com/api/test");
      await wrappedHandler(req);

      expect(handler).toHaveBeenCalled();
    });

    it("should log requests", async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withMiddleware(handler);
      const req = new NextRequest("https://example.com/api/test");
      await wrappedHandler(req);

      expect(console.log).toHaveBeenCalled();
    });
  });

  describe("parseRequestBody", () => {
    it("should parse valid JSON body", async () => {
      const req = new NextRequest("https://example.com/api/test", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      });

      const result = await parseRequestBody(req);

      expect(result.data).toEqual({ name: "Test" });
      expect(result.error).toBeUndefined();
    });

    it("should return error for invalid JSON", async () => {
      const req = new NextRequest("https://example.com/api/test", {
        method: "POST",
        body: "not valid json",
      });

      const result = await parseRequestBody(req);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(400);
    });
  });

  describe("withCacheHeaders", () => {
    it("should add cache headers to response", async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ data: "test" });
      });

      const wrappedHandler = withCacheHeaders(300)(handler);
      const req = new NextRequest("https://example.com/api/test");
      const context = createRequestContext(req);
      const response = await wrappedHandler(req, context);

      expect(response.headers.get("Cache-Control")).toContain("max-age=300");
    });

    it("should support s-maxage", async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ data: "test" });
      });

      const wrappedHandler = withCacheHeaders(300, 600)(handler);
      const req = new NextRequest("https://example.com/api/test");
      const context = createRequestContext(req);
      const response = await wrappedHandler(req, context);

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toContain("max-age=300");
      expect(cacheControl).toContain("s-maxage=600");
    });
  });

  describe("withCORS", () => {
    it("should handle OPTIONS preflight", async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ data: "test" });
      });

      const wrappedHandler = withCORS(["https://example.com"])(handler);
      const req = new NextRequest("https://example.com/api/test", {
        method: "OPTIONS",
      });
      const context = createRequestContext(req);
      const response = await wrappedHandler(req, context);

      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
      expect(handler).not.toHaveBeenCalled();
    });

    it("should add CORS headers to regular requests", async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ data: "test" });
      });

      const wrappedHandler = withCORS(["https://example.com"])(handler);
      const req = new NextRequest("https://example.com/api/test", {
        method: "GET",
      });
      const context = createRequestContext(req);
      const response = await wrappedHandler(req, context);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        "https://example.com"
      );
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("compose", () => {
    it("should compose multiple middleware", async () => {
      const middleware1 = (handler: any) => async (req: any, ctx: any) => {
        const response = await handler(req, ctx);
        response.headers.set("X-Middleware-1", "true");
        return response;
      };

      const middleware2 = (handler: any) => async (req: any, ctx: any) => {
        const response = await handler(req, ctx);
        response.headers.set("X-Middleware-2", "true");
        return response;
      };

      const handler = vi.fn(async () => {
        return NextResponse.json({ data: "test" });
      });

      const composedHandler = compose(middleware1, middleware2)(handler);
      const req = new NextRequest("https://example.com/api/test");
      const context = createRequestContext(req);
      const response = await composedHandler(req, context);

      expect(response.headers.get("X-Middleware-1")).toBe("true");
      expect(response.headers.get("X-Middleware-2")).toBe("true");
    });

    it("should execute middleware in correct order", async () => {
      const order: string[] = [];

      const middleware1 = (handler: any) => async (req: any, ctx: any) => {
        order.push("before-1");
        const response = await handler(req, ctx);
        order.push("after-1");
        return response;
      };

      const middleware2 = (handler: any) => async (req: any, ctx: any) => {
        order.push("before-2");
        const response = await handler(req, ctx);
        order.push("after-2");
        return response;
      };

      const handler = vi.fn(async () => {
        order.push("handler");
        return NextResponse.json({ data: "test" });
      });

      const composedHandler = compose(middleware1, middleware2)(handler);
      const req = new NextRequest("https://example.com/api/test");
      const context = createRequestContext(req);
      await composedHandler(req, context);

      expect(order).toEqual([
        "before-1",
        "before-2",
        "handler",
        "after-2",
        "after-1",
      ]);
    });
  });
});

