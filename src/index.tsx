/**
 * DirNav UI - Directory Navigation Component Library
 * 
 * A comprehensive directory navigation UI component built with SolidJS,
 * featuring keyboard shortcuts, command palette, and shadow DOM isolation.
 * 
 * @example
 * ```typescript
 * import { DirnavUI, createDirTree } from 'solid-dirnav-ui';
 * 
 * const tree = createDirTree({
 *   "documents": {
 *     type: 'directory',
 *     children: {
 *       "report.pdf": { type: 'action', action: () => console.log('Open report') }
 *     }
 *   }
 * });
 * 
 * <DirnavUI initialTree={tree} />
 * ```
 * 
 * @version 1.0.0
 * @author DirNav Contributors
 * @license ISC
 */

// Core Components
export { default as Window } from './Window';
export { default as DirnavUI, createDirTree } from './DirnavUI';
export { default as DirnavShadowWrapper } from './DirnavShadowWrapper';
export { default as ShadowDOMContainer } from './components/ShadowDOMContainer';

// Utility Functions
export { 
  createShadowDOMWrapper, 
  isElementFocused, 
  getShadowRoot, 
  getShadowHost 
} from './utils/shadowDOMUtils';

// Type Exports
export type { DirNode, DirTree, FlatDirNode } from './types';
export type { SearchResult, SearchOptions } from './utils/fuzzySearch';
export type { ShadowDOMWrapper, ShadowDOMWrapperOptions } from './utils/shadowDOMUtils';