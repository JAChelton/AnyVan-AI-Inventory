// src/services/errors/ServiceError.ts
export class ServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public recoverable: boolean = true,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class NetworkError extends ServiceError {
  constructor(message: string, service: string, originalError?: Error) {
    super(message, service, true, originalError);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ServiceError {
  constructor(service: string, timeoutMs: number) {
    super(`${service} timed out after ${timeoutMs}ms`, service, true);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, service: string) {
    super(message, service, false);
    this.name = 'ValidationError';
  }
}

export class APIError extends ServiceError {
  constructor(
    message: string,
    service: string,
    public statusCode: number,
    public recoverable: boolean = true
  ) {
    super(message, service, recoverable);
    this.name = 'APIError';
  }
}

// Error handling utilities
export const handleServiceError = (error: unknown, service: string): ServiceError => {
  if (error instanceof ServiceError) {
    return error;
  }
  
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return new TimeoutError(service, 10000);
    }
    if (error.message.includes('fetch')) {
      return new NetworkError(error.message, service, error);
    }
    return new ServiceError(error.message, service, true, error);
  }
  
  return new ServiceError('Unknown error occurred', service, true);
};