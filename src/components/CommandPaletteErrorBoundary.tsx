import { Component, JSX } from 'solid-js';
import ErrorBoundary from './ErrorBoundary';

interface CommandPaletteErrorBoundaryProps {
  children: JSX.Element;
  onSearchError?: (error: Error) => void;
  onReset?: () => void;
}

/**
 * Specialized error boundary for command palette and search-related errors
 * Handles fuzzy search failures and command execution errors gracefully
 */
const CommandPaletteErrorBoundary: Component<CommandPaletteErrorBoundaryProps> = (props) => {
  const handleSearchError = (error: Error, errorInfo: any) => {
    // Log search-specific error context
    console.error('Command palette error occurred:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      timestamp: new Date().toISOString()
    });

    // Call custom search error handler if provided
    if (props.onSearchError) {
      props.onSearchError(error);
    }
  };

  const searchErrorFallback = (error: Error, reset: () => void) => {
    const isSearchError = error.message.includes('search') || 
                          error.message.includes('fuzzy') ||
                          error.message.includes('filter');
    
    const isCommandError = error.message.includes('command') ||
                           error.message.includes('action') ||
                           error.message.includes('execute');

    return (
      <div class="dirnav-command-palette-error">
        <div class="dirnav-error-content">
          <h3>Command Palette Error</h3>
          {isSearchError && (
            <div class="dirnav-error-specific">
              <p>Search functionality encountered an error:</p>
              <ul>
                <li>Try clearing your search term</li>
                <li>Check if the directory tree is valid</li>
                <li>Some search results may be corrupted</li>
              </ul>
            </div>
          )}
          {isCommandError && !isSearchError && (
            <div class="dirnav-error-specific">
              <p>Command execution failed:</p>
              <ul>
                <li>The selected command may be invalid</li>
                <li>Required resources might be unavailable</li>
                <li>Try selecting a different command</li>
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
              Reset Search
            </button>
            <button 
              class="dirnav-error-close-btn"
              onClick={() => {
                // Close command palette and return to navigation
                try {
                  if (props.onReset) {
                    props.onReset();
                  }
                  reset();
                } catch (e) {
                  console.error('Failed to close command palette:', e);
                }
              }}
            >
              Close Command Palette
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary
      fallback={searchErrorFallback}
      onError={handleSearchError}
    >
      {props.children}
    </ErrorBoundary>
  );
};

export default CommandPaletteErrorBoundary;