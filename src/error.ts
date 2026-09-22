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
  readonly param?: string;
  readonly errorType?: string;

  constructor(
    status?: number,
    error?: any,
    message?: string,
    param?: string,
    code?: string,
    errorType?: string
  ) {
    super(message || (typeof error === "string" ? error : `Cortiqa API error with status ${status}`));
    this.status = status;
    this.error = error;
    this.param = param;
    this.code = code || (error && typeof error === "object" && "code" in error ? error.code : undefined);
    this.errorType = errorType || (error && typeof error === "object" && "type" in error ? error.type : undefined);
    if (!this.param && error && typeof error === "object" && "param" in error) {
      this.param = error.param;
    }
  }
}

export class BadRequestError extends APIError {
  constructor(status = 400, error?: any, message?: string, param?: string, code?: string, errorType?: string) {
    super(status, error, message || "Invalid request.", param, code, errorType);
  }
}

export class AuthenticationError extends APIError {
  constructor(status = 401, error?: any, message?: string, param?: string, code?: string, errorType?: string) {
    super(status, error, message || "Invalid or missing Cortiqa API key.", param, code, errorType);
  }
}

export class PermissionDeniedError extends APIError {
  constructor(status = 403, error?: any, message?: string, param?: string, code?: string, errorType?: string) {
    super(status, error, message || "You do not have permission to access this resource.", param, code, errorType);
  }
}

export class NotFoundError extends APIError {
  constructor(status = 404, error?: any, message?: string, param?: string, code?: string, errorType?: string) {
    super(status, error, message || "Resource not found.", param, code, errorType);
  }
}

export class UnprocessableEntityError extends APIError {
  constructor(status = 422, error?: any, message?: string, param?: string, code?: string, errorType?: string) {
    super(status, error, message || "Unprocessable entity.", param, code, errorType);
  }
}

export class RateLimitError extends APIError {
  constructor(status = 429, error?: any, message?: string, param?: string, code?: string, errorType?: string) {
    super(status, error, message || "Rate limit exceeded. Please back off your requests.", param, code, errorType);
  }
}

export class InternalServerError extends APIError {
  constructor(status = 500, error?: any, message?: string, param?: string, code?: string, errorType?: string) {
    super(status, error, message || "Cortiqa service encountered an internal error.", param, code, errorType);
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
