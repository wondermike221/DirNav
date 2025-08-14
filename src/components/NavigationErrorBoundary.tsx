import { Component, JSX } from 'solid-js';
import ErrorBoundary from './ErrorBoundary';

interface NavigationErrorBoundaryProps {
  children: JSX.Element;
  onNavigationError?: (error: Error) => void;
  onReset?: () => void;
}

/**
 * Specialized error boundary for navigation-related errors
 * Provides context-specific error handling and recovery options
 */
const NavigationErrorBoundary: Component<NavigationErrorBoundaryProps> = (props) => {
  const handleNavigationError = (error: Error, errorInfo: any) => {
    // Log navigation-specific error context
    console.error('Navigation error occurred:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString()
    });

    // Call custom navigation error handler if provided
    if (props.onNavigationError) {
      props.onNavigationError(error);
    }
  };

  const navigationErrorFallback = (error: Error, reset: () => void) => {
    const isTreeValidationError = error.message.includes('directory tree') || 
                                  error.message.includes('validation') ||
                                  error.message.includes('23 items');
    
    const isNavigationError = error.message.includes('navigate') ||
                              error.message.includes('directory') ||
                              error.message.includes('path');

    return (
      <div class="dirnav-navigation-error">
        <div class="dirnav-error-content">
          <h3>Navigation Error</h3>
          {isTreeValidationError && (
            <div class="dirnav-error-specific">
              <p>There's an issue with the directory structure:</p>
              <ul>
                <li>Directories cannot contain more than 23 items</li>
                <li>All nodes must have valid types (directory, action, input, virtual-directory)</li>
                <li>Directory nodes must have a 'children' property</li>
              </ul>
            </div>
          )}
          {isNavigationError && !isTreeValidationError && (
            <div class="dirnav-error-specific">
              <p>Unable to navigate to the requested location. This could be due to:</p>
              <ul>
                <li>Invalid directory path</li>
                <li>Missing directory content</li>
                <li>Corrupted navigation state</li>
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
                if (props.onReset) {
                  props.onReset();
                }
                reset();
              }}
            >
              Reset Navigation
            </button>
            <button 
              class="dirnav-error-home-btn"
              onClick={() => {
                // Try to reset to root directory
                try {
                  if (props.onReset) {
                    props.onReset();
                  }
                  reset();
                } catch (e) {
                  console.error('Failed to reset to home:', e);
                  window.location.reload();
                }
              }}
            >
              Go to Root
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary
      fallback={navigationErrorFallback}
      onError={handleNavigationError}
    >
      {props.children}
    </ErrorBoundary>
  );
};

export default NavigationErrorBoundary;