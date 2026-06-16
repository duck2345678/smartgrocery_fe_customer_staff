/**
 * Error handling utilities for API and application errors
 */

export interface AppError extends Error {
  status?: number;
  code?: string;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
  isServerError?: boolean;
  originalError?: unknown;
}

/**
 * Create typed app error
 */
export function createAppError(
  message: string,
  options: {
    status?: number;
    code?: string;
    isNetworkError?: boolean;
    isTimeoutError?: boolean;
    isServerError?: boolean;
    originalError?: unknown;
  } = {}
): AppError {
  const error = new Error(message) as AppError;
  error.status = options.status;
  error.code = options.code;
  error.isNetworkError = options.isNetworkError;
  error.isTimeoutError = options.isTimeoutError;
  error.isServerError = options.isServerError;
  error.originalError = options.originalError;
  return error;
}

/**
 * Check if error is network related
 */
export function isNetworkError(error: unknown): error is AppError {
  return error instanceof Error && (error as AppError).isNetworkError === true;
}

/**
 * Check if error is timeout related
 */
export function isTimeoutError(error: unknown): error is AppError {
  return error instanceof Error && (error as AppError).isTimeoutError === true;
}

/**
 * Check if error is server error (5xx)
 */
export function isServerError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    (error as AppError).isServerError === true
  );
}

/**
 * Check if error is auth related (401/403)
 */
export function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status = (error as AppError).status;
  return status === 401 || status === 403;
}

/**
 * Check if error is validation related (400)
 */
export function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (error as AppError).status === 400;
}

/**
 * Check if error is rate limited (429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (error as AppError).status === 429;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.';
  }

  const appError = error as AppError;

  // Network errors
  if (appError.isNetworkError) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  }

  // Timeout errors
  if (appError.isTimeoutError) {
    return 'Kết nối bị quá thời gian. Vui lòng kiểm tra mạng và thử lại.';
  }

  // Auth errors
  if (appError.status === 401) {
    return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  }

  if (appError.status === 403) {
    return 'Bạn không có quyền truy cập tài nguyên này.';
  }

  // Validation errors
  if (appError.status === 400) {
    return appError.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
  }

  // Rate limit
  if (appError.status === 429) {
    return 'Quá nhiều yêu cầu. Vui lòng chờ một lát rồi thử lại.';
  }

  // Server errors
  if (appError.isServerError || (appError.status && appError.status >= 500)) {
    return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
  }

  // Not found
  if (appError.status === 404) {
    return 'Tài nguyên không tìm thấy.';
  }

  // Default
  return appError.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

/**
 * Log error with context (dev only)
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${context}`, {
      error: error instanceof Error ? {
        ...(error as AppError),
        message: error.message,
        stack: error.stack,
      } : error,
      ...additionalInfo
    });
  }
}

/**
 * Report error to error tracking service (Sentry, etc.)
 * Implement when error tracking is set up
 */
export async function reportErrorToService(
  error: unknown,
  context?: string
): Promise<void> {
  // TODO: Implement error tracking service integration
  // Example with Sentry:
  // Sentry.captureException(error, { tags: { context } });
  
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error('[Error Report]', { error, context });
  }
}

/**
 * Retry logic for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const delayMs = options.delayMs ?? 1000;
  const backoffMultiplier = options.backoffMultiplier ?? 1;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (
        isAuthError(error) ||
        isValidationError(error) ||
        (error instanceof Error && (error as AppError).status === 404)
      ) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt);
        options.onRetry?.(attempt + 1, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Safely execute async operation with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | typeof fallback> {
  try {
    return await operation();
  } catch (error) {
    logError('safeAsync', error);
    return fallback as any;
  }
}
