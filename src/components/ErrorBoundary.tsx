import { Component, createSignal, JSX, ErrorBoundary as SolidErrorBoundary } from 'solid-js';

interface ErrorBoundaryProps {
  children: JSX.Element;
  fallback?: (error: Error, reset: () => void) => JSX.Element;
  onError?: (error: Error, errorInfo: any) => void;
  resetKeys?: any[];
  resetOnPropsChange?: boolean;
}

interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: any;
  errorBoundaryStack?: string;
}

/**
 * Enhanced Error Boundary component that provides graceful error handling
 * with user-friendly fallback UI and recovery mechanisms
 */
const ErrorBoundary: Component<ErrorBoundaryProps> = (props) => {
  const [errorCount, setErrorCount] = createSignal(0);
  const [lastError, setLastError] = createSignal<Error | null>(null);

  const handleError = (error: Error, errorInfo?: ErrorInfo) => {
    setErrorCount(prev => prev + 1);
    setLastError(error);
    
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    if (errorInfo) {
      console.error('Error info:', errorInfo);
    }
    
    // Call custom error handler if provided
    if (props.onError) {
      props.onError(error, errorInfo);
    }
  };

  const reset = () => {
    setErrorCount(0);
    setLastError(null);
  };

  const defaultFallback = (error: Error, resetFn: () => void) => (
    <div class="dirnav-error-boundary">
      <div class="dirnav-error-content">
        <h3>Something went wrong</h3>
        <p>An unexpected error occurred in the navigation component.</p>
        <details class="dirnav-error-details">
          <summary>Error details</summary>
          <pre>{error.message}</pre>
          {error.stack && (
            <pre class="dirnav-error-stack">{error.stack}</pre>
          )}
        </details>
        <div class="dirnav-error-actions">
          <button 
            class="dirnav-error-retry-btn"
            onClick={resetFn}
          >
            Try Again
          </button>
          <button 
            class="dirnav-error-reload-btn"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
        {errorCount() > 1 && (
          <p class="dirnav-error-warning">
            This error has occurred {errorCount()} times. Consider reloading the page.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <SolidErrorBoundary
      fallback={(error: Error) => {
        handleError(error);
        const fallbackComponent = props.fallback || defaultFallback;
        return fallbackComponent(error, reset);
      }}
    >
      {props.children}
    </SolidErrorBoundary>
  );
};

export default ErrorBoundary;