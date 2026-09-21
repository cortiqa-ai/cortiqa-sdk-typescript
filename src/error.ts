/**
 * Custom error classes for Cortiqa TypeScript SDK.
 */

export class CortiqaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class APIError extends CortiqaError {
  readonly status?: number;
  readonly error?: any;
  readonly code?: string;

  constructor(status?: number, error?: any, message?: string) {
    super(message || (typeof error === "string" ? error : `Cortiqa API error with status ${status}`));
    this.status = status;
    this.error = error;
    if (error && typeof error === "object" && "code" in error) {
      this.code = error.code;
    }
  }
}

export class AuthenticationError extends APIError {
  constructor(status = 401, error?: any, message?: string) {
    super(status, error, message || "Invalid or missing Cortiqa API key.");
  }
}

export class PermissionDeniedError extends APIError {
  constructor(status = 403, error?: any, message?: string) {
    super(status, error, message || "You do not have permission to access this resource.");
  }
}

export class NotFoundError extends APIError {
  constructor(status = 404, error?: any, message?: string) {
    super(status, error, message || "Resource not found.");
  }
}

export class RateLimitError extends APIError {
  constructor(status = 429, error?: any, message?: string) {
    super(status, error, message || "Rate limit exceeded. Please back off your requests.");
  }
}

export class InternalServerError extends APIError {
  constructor(status = 500, error?: any, message?: string) {
    super(status, error, message || "Cortiqa service encountered an internal error.");
  }
}

export class APIConnectionError extends CortiqaError {
  readonly cause?: any;

  constructor(message = "Could not connect to Cortiqa API.", cause?: any) {
    super(message);
    this.cause = cause;
  }
}

export class APITimeoutError extends APIConnectionError {
  constructor(message = "Request to Cortiqa API timed out.", cause?: any) {
    super(message, cause);
  }
}
