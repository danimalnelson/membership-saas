/**
 * Standardized API error responses
 * 
 * Provides consistent error format across all API routes for better
 * client-side error handling and debugging.
 */

import { NextResponse } from "next/server";

/**
 * Standard error response structure
 */
export interface ApiError {
  /** Error type/code for programmatic handling */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Additional context (only in development) */
  details?: any;
  /** Request ID for tracking (future enhancement) */
  requestId?: string;
}

/**
 * Creates a standardized JSON error response
 * 
 * @param error - Error code/type (e.g., 'UNAUTHORIZED', 'NOT_FOUND')
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param details - Additional error details (only included in development)
 * @returns NextResponse with standardized error format
 * 
 * @example
 * return apiError('UNAUTHORIZED', 'You must be logged in', 401);
 * 
 * @example
 * return apiError('VALIDATION_ERROR', 'Invalid email format', 400, { field: 'email' });
 */
export function apiError(
  error: string,
  message: string,
  status: number,
  details?: any
): NextResponse<ApiError> {
  const body: ApiError = {
    error,
    message,
  };

  // Only include details in non-production environments
  if (process.env.NODE_ENV !== "production" && details) {
    body.details = details;
  }

  return NextResponse.json(body, { status });
}

/**
 * Common error responses for consistency
 */
export const ApiErrors = {
  /**
   * 401 Unauthorized - User is not authenticated
   */
  unauthorized: (message = "Unauthorized") =>
    apiError("UNAUTHORIZED", message, 401),

  /**
   * 403 Forbidden - User is authenticated but lacks permission
   */
  forbidden: (message = "Forbidden") =>
    apiError("FORBIDDEN", message, 403),

  /**
   * 404 Not Found - Resource doesn't exist
   */
  notFound: (resource = "Resource", details?: any) =>
    apiError("NOT_FOUND", `${resource} not found`, 404, details),

  /**
   * 400 Bad Request - Invalid input/validation error
   */
  badRequest: (message: string, details?: any) =>
    apiError("BAD_REQUEST", message, 400, details),

  /**
   * 422 Unprocessable Entity - Validation failed
   */
  validationError: (message: string, details?: any) =>
    apiError("VALIDATION_ERROR", message, 422, details),

  /**
   * 409 Conflict - Resource already exists or state conflict
   */
  conflict: (message: string, details?: any) =>
    apiError("CONFLICT", message, 409, details),

  /**
   * 429 Too Many Requests - Rate limit exceeded
   */
  rateLimitExceeded: (message = "Too many requests, please try again later") =>
    apiError("RATE_LIMIT_EXCEEDED", message, 429),

  /**
   * 500 Internal Server Error - Unexpected server error
   */
  internalError: (message = "An unexpected error occurred", details?: any) =>
    apiError("INTERNAL_ERROR", message, 500, details),

  /**
   * 503 Service Unavailable - External service down
   */
  serviceUnavailable: (service = "Service", details?: any) =>
    apiError("SERVICE_UNAVAILABLE", `${service} is currently unavailable`, 503, details),
};

/**
 * Wraps async API route handlers with error catching
 * 
 * Automatically converts thrown errors into standardized API error responses
 * 
 * @param handler - Async route handler function
 * @returns Wrapped handler with error handling
 * 
 * @example
 * export const GET = withErrorHandler(async (req) => {
 *   const data = await fetchData(); // If this throws, automatically returns 500
 *   return NextResponse.json(data);
 * });
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error: any) {
      console.error("[API Error]", error);
      
      // If error is already a NextResponse, return it
      if (error instanceof NextResponse) {
        return error;
      }

      // Convert known error types
      if (error.name === "ZodError") {
        return ApiErrors.validationError(
          "Validation failed",
          error.errors
        );
      }

      // Default to internal server error
      return ApiErrors.internalError(
        error.message || "An unexpected error occurred",
        process.env.NODE_ENV !== "production" ? error.stack : undefined
      );
    }
  };
}

