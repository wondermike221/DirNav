import { createContext, useContext } from 'solid-js';
import { Accessor } from 'solid-js';

/**
 * Type definition for breadcrumb segments
 */
interface BreadcrumbSegment {
  name: string;
  path: string;
  isClickable: boolean;
}

/**
 * Context type for title/breadcrumb management
 */
interface TitleContextType {
  /** Accessor for current breadcrumb segments */
  title: Accessor<BreadcrumbSegment[]>;
  /** Function to handle breadcrumb navigation */
  setTitle: (path: string) => void;
}

/**
 * Context for managing window title and breadcrumb navigation
 */
export const TitleContext = createContext<TitleContextType>();

/**
 * Hook to access title context
 * @returns Title context with breadcrumb data and navigation handler
 * @throws Error if used outside of TitleContext.Provider
 */
export const useTitle = () => {
  const context = useContext(TitleContext);
  if (!context) {
    throw new Error('useTitle must be used within a TitleProvider');
  }
  return context;
};
