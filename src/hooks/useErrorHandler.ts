import React, { useState, useCallback } from 'react';
import { AppError, createAppError, logError } from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  error: AppError | null;
  setError: (error: Error | AppError | string | null) => void;
  clearError: () => void;
  handleError: (error: unknown, context?: string) => void;
}

/**
 * Hook for handling errors at component level
 * 
 * @example
 * const { error, setError, clearError, handleError } = useErrorHandler();
 * 
 * try {
 *   await fetchData();
 * } catch (err) {
 *   handleError(err, 'fetch_data');
 * }
 * 
 * return error ? <div>{error.message}</div> : <ComponentContent />;
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<AppError | null>(null);

  const setError = useCallback((newError: Error | AppError | string | null) => {
    if (newError === null) {
      setErrorState(null);
    } else if (typeof newError === 'string') {
      setErrorState(createAppError(newError));
    } else {
      setErrorState(newError as AppError);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    let appError: AppError;

    if (error instanceof Error) {
      appError = error as AppError;
    } else if (typeof error === 'string') {
      appError = createAppError(error);
    } else {
      appError = createAppError(String(error));
    }

    logError(context || 'component_error', appError);
    setErrorState(appError);
  }, []);

  return {
    error,
    setError,
    clearError,
    handleError
  };
}

interface UseAsyncErrorHandlerReturn<T> extends UseErrorHandlerReturn {
  isLoading: boolean;
  data: T | null;
  execute: (asyncFn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Hook for handling errors from async operations
 * 
 * @example
 * const { data, error, isLoading, execute } = useAsyncErrorHandler<Product[]>();
 * 
 * useEffect(() => {
 *   execute(async () => {
 *     return await fetchProducts();
 *   });
 * }, []);
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 * return <ProductList products={data} />;
 */
export function useAsyncErrorHandler<T>(
  defaultData: T | null = null
): UseAsyncErrorHandlerReturn<T> {
  const [data, setData] = useState<T | null>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<AppError | null>(null);

  const setError = useCallback((newError: Error | AppError | string | null) => {
    if (newError === null) {
      setErrorState(null);
    } else if (typeof newError === 'string') {
      setErrorState(createAppError(newError));
    } else {
      setErrorState(newError as AppError);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const handleError = useCallback((error: unknown, context?: string) => {
    let appError: AppError;

    if (error instanceof Error) {
      appError = error as AppError;
    } else if (typeof error === 'string') {
      appError = createAppError(error);
    } else {
      appError = createAppError(String(error));
    }

    logError(context || 'async_operation', appError);
    setErrorState(appError);
  }, []);

  const execute = useCallback(
    async (asyncFn: () => Promise<T>): Promise<T | null> => {
      try {
        setIsLoading(true);
        setErrorState(null);
        
        const result = await asyncFn();
        setData(result);
        return result;
      } catch (err) {
        handleError(err, 'async_execute');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  return {
    data,
    isLoading,
    error,
    setError,
    clearError,
    handleError,
    execute
  };
}

interface UseErrorCallbackReturn {
  execute: <T>(fn: () => T | Promise<T>) => Promise<T | null>;
  error: AppError | null;
  clearError: () => void;
}

/**
 * Hook for wrapping callback functions with error handling
 * 
 * @example
 * const { execute, error, clearError } = useErrorCallback();
 * 
 * const handleClick = async () => {
 *   await execute(async () => {
 *     await updateProfile(data);
 *   });
 * };
 */
export function useErrorCallback(): UseErrorCallbackReturn {
  const [error, setError] = useState<AppError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(
    async <T,>(fn: () => T | Promise<T>): Promise<T | null> => {
      try {
        setError(null);
        return await Promise.resolve(fn());
      } catch (err) {
        const appError = err instanceof Error ? err as AppError : createAppError(String(err));
        logError('callback_error', appError);
        setError(appError);
        return null;
      }
    },
    []
  );

  return {
    execute,
    error,
    clearError
  };
}

/**
 * HOC for wrapping functional components with error boundary behavior
 * Note: This is a workaround as functional components can't use getDerivedStateFromError
 * For proper error boundaries, use ErrorBoundaryWeb class component
 * 
 * @example
 * const SafeComponent = withErrorHandler(MyComponent);
 */
export function withErrorHandler<P extends object>(
  Component: React.ComponentType<P & { error: AppError | null; clearError: () => void }>
) {
  return function SafeComponent(props: P) {
    const { error, clearError } = useErrorHandler();

    return React.createElement(Component, { ...props, error, clearError });
  };
}
