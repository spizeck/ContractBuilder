// Centralized error handling utilities

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

// Error type guard
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Safe error handling with logging
export function handleError(error: unknown, context?: string): AppError {
  console.error(`Error in ${context || 'unknown context'}:`, error);
  
  if (error instanceof AppError) {
    return error;
  }
  
  if (isError(error)) {
    // Firebase errors
    if (error.name === 'FirebaseError') {
      return new AppError(
        error.message,
        'FIREBASE_ERROR',
        500
      );
    }
    
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new NetworkError(error.message);
    }
    
    // Generic error
    return new AppError(
      error.message,
      'GENERIC_ERROR',
      500
    );
  }
  
  // Unknown error type
  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500
  );
}

// Async error wrapper for try-catch patterns
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  context?: string
): Promise<[T | null, AppError | null]> {
  try {
    const result = await asyncFn();
    return [result, null];
  } catch (error) {
    return [null, handleError(error, context)];
  }
}

// Sync error wrapper for try-catch patterns
export function safeSync<T>(
  syncFn: () => T,
  context?: string
): [T | null, AppError | null] {
  try {
    const result = syncFn();
    return [result, null];
  } catch (error) {
    return [null, handleError(error, context)];
  }
}
