import { Component, JSX } from 'solid-js';
import ErrorBoundary from './ErrorBoundary';

interface VirtualDirectoryErrorBoundaryProps {
  children: JSX.Element;
  onVirtualDirectoryError?: (error: Error) => void;
  onRetry?: () => void;
  onFallback?: () => void;
}

/**
 * Specialized error boundary for virtual directory loading and execution errors
 * Provides retry mechanisms and fallback behavior for async operations
 */
const VirtualDirectoryErrorBoundary: Component<VirtualDirectoryErrorBoundaryProps> = (props) => {
  const handleVirtualDirectoryError = (error: Error, errorInfo: any) => {
    // Log virtual directory specific error context
    console.error('Virtual directory error occurred:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString()
    });

    // Call custom virtual directory error handler if provided
    if (props.onVirtualDirectoryError) {
      props.onVirtualDirectoryError(error);
    }
  };

  const virtualDirectoryErrorFallback = (error: Error, reset: () => void) => {
    const isNetworkError = error.message.includes('fetch') || 
                           error.message.includes('network') ||
                           error.message.includes('timeout') ||
                           error.message.includes('connection');
    
    const isAsyncError = error.message.includes('Promise') ||
                         error.message.includes('async') ||
                         error.message.includes('await');

    const isDataError = error.message.includes('parse') ||
                        error.message.includes('JSON') ||
                        error.message.includes('invalid data');

    return (
      <div class="dirnav-virtual-directory-error">
        <div class="dirnav-error-content">
          <h3>Virtual Directory Error</h3>
          {isNetworkError && (
            <div class="dirnav-error-specific">
              <p>Network or connection error:</p>
              <ul>
                <li>Check your internet connection</li>
                <li>The remote service may be temporarily unavailable</li>
                <li>Try again in a few moments</li>
              </ul>
            </div>
          )}
          {isAsyncError && !isNetworkError && (
            <div class="dirnav-error-specific">
              <p>Async operation failed:</p>
              <ul>
                <li>The virtual directory loading timed out</li>
                <li>An unexpected error occurred during data loading</li>
                <li>Try refreshing or using a different approach</li>
              </ul>
            </div>
          )}
          {isDataError && (
            <div class="dirnav-error-specific">
              <p>Data format error:</p>
              <ul>
                <li>The virtual directory returned invalid data</li>
                <li>Data parsing failed</li>
                <li>Contact the data provider for assistance</li>
              </ul>
            </div>
          )}
          <details class="dirnav-error-details">
            <summary>Technical details</summary>
            <pre>{error.message}</pre>
          </details>
          <div class="dirnav-error-actions">
            <button 
              class="dirnav-error-retry-btn"
              onClick={() => {
                if (props.onRetry) {
                  props.onRetry();
                }
                reset();
              }}
            >
              Retry Loading
            </button>
            <button 
              class="dirnav-error-fallback-btn"
              onClick={() => {
                if (props.onFallback) {
                  props.onFallback();
                }
                reset();
              }}
            >
              Use Fallback
            </button>
            <button 
              class="dirnav-error-back-btn"
              onClick={() => {
                // Go back to previous directory
                try {
                  if (props.onFallback) {
                    props.onFallback();
                  }
                  reset();
                } catch (e) {
                  console.error('Failed to go back:', e);
                }
              }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary
      fallback={virtualDirectoryErrorFallback}
      onError={handleVirtualDirectoryError}
    >
      {props.children}
    </ErrorBoundary>
  );
};

export default VirtualDirectoryErrorBoundary;