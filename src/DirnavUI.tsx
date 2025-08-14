import { Component, createSignal, For, Show, onMount, onCleanup, createEffect, createMemo } from 'solid-js';
import Window from './Window';
import { DirNode, DirTree, FlatDirNode } from './types';
import { fuzzySearch } from './utils/fuzzySearch';
import { TitleContext } from './TitleContext';
import CommandPalette from './components/CommandPalette';
import MainNav from './components/MainNav';
import { validateDirectoryTreeStrict } from './validation';
import { 
  createShadowDOMEventManager, 
  focusElementInShadowDOM, 
  blurElementInShadowDOM,
  handleShadowDOMKeyboardEvent,
  focusInputInShadowDOM
} from './utils/shadowDOMUtils';
import ErrorBoundary from './components/ErrorBoundary';
import NavigationErrorBoundary from './components/NavigationErrorBoundary';
import CommandPaletteErrorBoundary from './components/CommandPaletteErrorBoundary';
import VirtualDirectoryErrorBoundary from './components/VirtualDirectoryErrorBoundary';
import { defaultVirtualDirectoryHandler } from './utils/virtualDirectoryHandler';
import { 
  createDebouncedSignal, 
  createMemoizedFunction, 
  createThrottledFunction,
  performanceMonitor 
} from './utils/performance';

/**
 * Props interface for the DirnavUI component
 */
interface DirnavUIProps {
  /** The initial directory tree structure to display */
  initialTree: DirTree;
}

/**
 * Memoized function to flatten the directory tree for fuzzy searching
 * Recursively traverses the tree and creates a flat array of nodes with full paths
 * @param tree - The directory tree to flatten
 * @param currentPath - Current path segments (used for recursion)
 * @returns Array of flattened directory nodes with full paths
 */
const memoizedFlattenTree = createMemoizedFunction(
  (tree: DirTree, currentPath: string[] = []): FlatDirNode[] => {
    let flatNodes: FlatDirNode[] = [];
    for (const key in tree) {
      const node = tree[key];
      const newPath = [...currentPath, node.name];
      const fullPath = newPath.join('/');

      flatNodes.push({ ...node, fullPath });

      if (node.type === 'directory' && node.children) {
        flatNodes = flatNodes.concat(memoizedFlattenTree(node.children, newPath));
      }
    }
    return flatNodes;
  },
  (tree, currentPath) => `${JSON.stringify(Object.keys(tree))}_${currentPath?.join('/')}`
);

const flattenTree = memoizedFlattenTree;

/**
 * Helper function to find a node and its parent content/path given its full path
 * Used for command palette navigation to locate nodes in the tree
 * @param tree - The directory tree to search in
 * @param targetFullPath - The full path of the target node
 * @param currentPath - Current path segments (used for recursion)
 * @returns Object containing the found node, its parent content, and parent path
 */
const findNodeAndParent = (tree: DirTree, targetFullPath: string, currentPath: string[] = []): { 
  node: DirNode | undefined; 
  parentContent: DirTree | undefined; 
  parentPath: string[] 
} => {
  for (const key in tree) {
    const node = tree[key];
    const newPath = [...currentPath, node.name];
    const nodeFullPath = newPath.join('/');

    if (nodeFullPath === targetFullPath) {
      return { node, parentContent: tree, parentPath: currentPath };
    }

    if (node.type === 'directory' && node.children) {
      const result = findNodeAndParent(node.children, targetFullPath, newPath);
      if (result.node) {
        return result;
      }
    }
  }
  return { node: undefined, parentContent: undefined, parentPath: [] };
};

/**
 * Creates a properly structured directory tree from raw data
 * Recursively processes the data and validates the resulting tree structure
 * @param data - Raw directory data to convert
 * @returns Validated DirTree structure
 * @throws Error if the resulting tree structure is invalid
 */
const createDirTree = (data: any): DirTree => {
  const tree: DirTree = {};
  for (const key in data) {
    const item = data[key];
    if (typeof item === 'object' && !Array.isArray(item) && item !== null) {
      if (item.type === 'directory') {
        tree[key] = { name: key, ...item, children: createDirTree(item.children) };
      } else {
        tree[key] = { name: key, ...item };
      }
    } else {
      // Default to action type if not specified
      tree[key] = { name: key, type: 'action', action: item };
    }
  }
  
  // Validate the created tree structure
  validateDirectoryTreeStrict(tree);
  
  return tree;
};

/**
 * DirnavUI - Main directory navigation component
 * 
 * Provides a comprehensive directory navigation interface with:
 * - Draggable, resizable window with persistence
 * - Keyboard shortcuts for efficient navigation
 * - Command palette with fuzzy search
 * - Support for multiple node types (directory, action, input, virtual-directory)
 * - Theme switching and accessibility features
 * - Error boundaries for graceful error handling
 * - Performance optimizations with memoization and debouncing
 * 
 * @param props - Component props containing the initial directory tree
 * @returns JSX element representing the complete navigation interface
 */
const DirnavUI: Component<DirnavUIProps> = (props) => {
  // Validate the initial tree on component initialization
  validateDirectoryTreeStrict(props.initialTree);
  
  // Navigation state
  /** Current directory path as array of directory names */
  const [currentPath, setCurrentPath] = createSignal<string[]>([]);
  /** Current page index for pagination (0-based) */
  const [currentPage, setCurrentPage] = createSignal(0);
  /** Content of the currently displayed directory */
  const [currentDirContent, setCurrentDirContent] = createSignal<DirTree>(props.initialTree);
  /** Navigation history stack to enable back navigation */
  const [history, setHistory] = createSignal<DirTree[]>([]);
  
  // UI state
  /** Loading state for async operations (virtual directories) */
  const [isLoading, setIsLoading] = createSignal(false);
  /** Window visibility state */
  const [isVisible, setIsVisible] = createSignal(true);
  
  // Input mode state
  /** Whether input editing mode is active */
  const [inputMode, setInputMode] = createSignal(false);
  /** Name of the input node currently being edited */
  const [inputNodeName, setInputNodeName] = createSignal<string | null>(null);
  /** Current value of the input field */
  const [inputValue, setInputValue] = createSignal('');
  
  // Command palette state
  /** Whether command palette mode is active */
  const [commandPaletteMode, setCommandPaletteMode] = createSignal(false);
  /** Current search term in command palette */
  const [searchTerm, setSearchTerm] = createSignal('');
  /** Debounced search term to optimize search performance */
  const [debouncedSearchTerm, setDebouncedSearchTerm] = createDebouncedSignal('', 150);
  /** Filtered search results from fuzzy search */
  const [searchResults, setSearchResults] = createSignal<FlatDirNode[]>([]);
  /** Index of currently selected search result */
  const [selectedSearchResultIndex, setSelectedSearchResultIndex] = createSignal(0);
  
  // Theme and UI preferences
  /** Component theme preference (light/dark/system) */
  const [componentThemePreference, setComponentThemePreference] = createSignal<'light' | 'dark' | 'system'>(
    localStorage.getItem('dirnav-component-theme-preference') as 'light' | 'dark' | 'system' || 'system'
  );
  /** Title breadcrumbs for the window header */
  const [title, setTitle] = createSignal<any[]>([{ name: '~', path: '/', isClickable: true }]);
  
  // Virtual directory error handling state
  /** Current virtual directory error, if any */
  const [virtualDirectoryError, setVirtualDirectoryError] = createSignal<Error | null>(null);
  /** Number of retry attempts for failed virtual directory */
  const [virtualDirectoryRetryCount, setVirtualDirectoryRetryCount] = createSignal(0);
  /** Information about the last failed virtual directory for retry */
  const [lastFailedVirtualDirectory, setLastFailedVirtualDirectory] = createSignal<{ 
    name: string; 
    loader: () => Promise<DirTree> 
  } | null>(null);

  // Component references
  /** Reference to the main window element for focus management */
  let dirnavWindowRef: HTMLDivElement | undefined;
  /** Reference to the input element in input mode */
  let inputRef: HTMLInputElement | undefined;
  /** Reference to the command palette input element */
  let commandPaletteInputRef: HTMLInputElement | undefined;
  
  /** Shadow DOM-aware event manager for handling global events */
  const eventManager = createShadowDOMEventManager();

  // Constants
  const THEME_STORAGE_KEY = 'dirnav-component-theme-preference';
  const DARK_MODE_CLASS = 'dirnav-dark-mode';
  const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';

  /**
   * Applies the specified theme to the component
   * @param theme - Theme to apply ('light', 'dark', or 'system')
   */
  const applyComponentTheme = (theme: 'light' | 'dark' | 'system') => {
    setComponentThemePreference(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  };

  /**
   * Gets the appropriate CSS class for the current theme
   * @returns CSS class name for dark mode, or empty string for light mode
   */
  const getComponentThemeClass = () => {
    const preference = componentThemePreference();
    if (preference === 'system') {
      return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? DARK_MODE_CLASS : '';
    } else if (preference === 'dark') {
      return DARK_MODE_CLASS;
    } else {
      return '';
    }
  };

  /**
   * Memoized computation for all nodes including meta nodes
   * Combines the base directory tree with meta settings nodes for command palette
   * @returns Array of all available nodes for searching
   */
  const allNodes = createMemo(() => {
    const endMeasurement = performanceMonitor.start('flatten-tree');
    const baseNodes = flattenTree(props.initialTree);
    
    // Meta nodes for theme switching and settings
    const metaNodes: FlatDirNode[] = [
      { name: 'meta', type: 'directory', fullPath: 'meta' },
      { name: 'theme', type: 'directory', fullPath: 'meta/theme' },
      { name: 'Light', type: 'action', fullPath: 'meta/theme/Light', action: () => applyComponentTheme('light') },
      { name: 'Dark', type: 'action', fullPath: 'meta/theme/Dark', action: () => applyComponentTheme('dark') },
      { name: 'System', type: 'action', fullPath: 'meta/theme/System', action: () => applyComponentTheme('system') },
    ];
    
    endMeasurement();
    return [...baseNodes, ...metaNodes];
  });

  // Fuzzy search configuration
  const FUZZY_SEARCH_CONFIG = {
    maxResults: 50,
    minScore: 0.01, // Lower threshold for better compatibility
    pathWeight: 0.4,
    nameWeight: 0.6,
    sequenceWeight: 2.0,
    exactMatchBonus: 100,
    prefixMatchBonus: 50,
  };

  /**
   * Memoized fuzzy search function for performance optimization
   * Searches through all nodes and returns matching results
   */
  const memoizedFuzzySearch = createMemoizedFunction(
    (nodes: FlatDirNode[], term: string): FlatDirNode[] => {
      if (!term) return [];
      
      const searchResults = fuzzySearch(nodes, term, FUZZY_SEARCH_CONFIG);
      return searchResults.map(result => result.node);
    },
    (nodes, term) => `${nodes.length}_${term}`
  );

  /**
   * Performs fuzzy search on all available nodes
   * @param term - Search term to match against
   * @returns Array of matching nodes
   */
  const performFuzzySearch = (term: string): FlatDirNode[] => {
    return memoizedFuzzySearch(allNodes(), term);
  };

  /**
   * Updates the search term with debouncing for performance
   * @param term - New search term
   */
  const updateSearchTerm = (term: string) => {
    setSearchTerm(term);
    setDebouncedSearchTerm(term);
  };

  /**
   * Effect that performs debounced search when command palette is active
   * Automatically updates search results and resets selection index
   */
  createEffect(() => {
    if (commandPaletteMode()) {
      const term = debouncedSearchTerm();
      setSearchResults(performFuzzySearch(term));
      setSelectedSearchResultIndex(0);
    }
  });

  // Pagination constants
  const MAX_ITEMS_PER_PAGE = 9;
  const MAX_ITEMS_FIRST_PAGE = 8; // When pagination is needed
  const MAX_ITEMS_MIDDLE_PAGE = 7; // Middle page has prev/next buttons
  const MAX_ITEMS_LAST_PAGE = 8;
  const MAX_TOTAL_ITEMS = 23; // Requirement 8.2

  /**
   * Memoized computation for directory items as key-value pairs
   */
  const directoryItems = createMemo(() => Object.entries(currentDirContent()));
  
  /**
   * Memoized computation for total number of items in current directory
   */
  const totalItems = createMemo(() => directoryItems().length);

  /**
   * Memoized computation for total number of pages needed for pagination
   * Based on the 23-item limit and pagination strategy
   */
  const totalPages = createMemo(() => {
    const items = totalItems();
    if (items <= MAX_ITEMS_PER_PAGE) return 1;
    if (items <= 17) return 2; // 8 (page1) + 9 (page2) or 9 (page1) + 8 (page2)
    return 3; // Max 23 items (8 + 7 + 8)
  });

  /**
   * Memoized computation for paginated items with navigation controls
   * Implements the pagination strategy:
   * - Page 1: Up to 8 items + Next Page button (if needed)
   * - Page 2: Previous Page + up to 7 items + Next Page (if needed)
   * - Page 3: Previous Page + up to 8 items
   * This ensures keyboard shortcuts 1-9 work correctly with pagination controls
   */
  const paginatedItems = createMemo(() => {
    const endMeasurement = performanceMonitor.start('pagination');
    const items = directoryItems();
    const currentPageValue = currentPage();
    const totalItemsValue = totalItems();
    let start = 0;
    let end = 0;
    let displayedItems: [string, DirNode][] = [];

    if (currentPageValue === 0) { // First page
      start = 0;
      if (totalItemsValue <= MAX_ITEMS_PER_PAGE) {
        end = totalItemsValue;
      } else {
        end = MAX_ITEMS_FIRST_PAGE; // 8 items + Next Page
      }
      displayedItems = items.slice(start, end);
      if (totalItemsValue > MAX_ITEMS_PER_PAGE) {
        displayedItems.push(['next_page', { 
          name: 'Next Page', 
          type: 'action', 
          action: () => setCurrentPage(currentPageValue + 1) 
        }]);
      }
    } else if (currentPageValue === 1) { // Second page
      start = MAX_ITEMS_FIRST_PAGE; // After first page's 8 items
      end = start + MAX_ITEMS_MIDDLE_PAGE; // Previous Page + 7 items + Next Page
      displayedItems = items.slice(start, end);
      displayedItems.unshift(['prev_page', { 
        name: 'Previous Page', 
        type: 'action', 
        action: () => setCurrentPage(currentPageValue - 1) 
      }]);
      if (totalItemsValue > 15) { // If there's a third page
        displayedItems.push(['next_page', { 
          name: 'Next Page', 
          type: 'action', 
          action: () => setCurrentPage(currentPageValue + 1) 
        }]);
      }
    } else if (currentPageValue === 2) { // Third page
      start = 15; // After first 8 + second 7 items
      end = start + MAX_ITEMS_LAST_PAGE; // Previous Page + 8 items
      displayedItems = items.slice(start, end);
      displayedItems.unshift(['prev_page', { 
        name: 'Previous Page', 
        type: 'action', 
        action: () => setCurrentPage(currentPageValue - 1) 
      }]);
    }

    endMeasurement();
    return displayedItems;
  });

  // Navigation constants
  const NAVIGATION_THROTTLE_MS = 100;
  const PAGINATION_CONTROLS = {
    PREV_PAGE: 'prev_page',
    NEXT_PAGE: 'next_page'
  };

  /**
   * Throttled navigation handler to prevent rapid navigation issues
   * Handles different node types: directory, action, input, virtual-directory
   * Also handles pagination controls (prev_page, next_page)
   * @param name - Name of the node or pagination control
   * @param type - Type of the node being navigated to
   */
  const handleNavigate = createThrottledFunction(async (name: string, type: DirNode['type']) => {
    // Handle pagination controls
    if (name === PAGINATION_CONTROLS.PREV_PAGE) {
      setCurrentPage(p => p - 1);
      return;
    }
    if (name === PAGINATION_CONTROLS.NEXT_PAGE) {
      setCurrentPage(p => p + 1);
      return;
    }

    const node = currentDirContent()[name];
    if (!node) return;

    switch (type) {
      case 'directory':
        // Navigate to subdirectory
        setHistory([...history(), currentDirContent()]);
        setCurrentPath([...currentPath(), name]);
        setCurrentDirContent(node.children || {});
        setCurrentPage(0);
        break;

      case 'action':
        // Execute action callback
        if (node.action) {
          node.action();
        }
        break;

      case 'input':
        // Enter input editing mode
        setInputMode(true);
        setInputNodeName(name);
        setInputValue(localStorage.getItem(node.localStorageKey || '') || '');
        break;

      case 'virtual-directory':
        // Load virtual directory content asynchronously
        if (node.onSelect) {
          setIsLoading(true);
          setVirtualDirectoryError(null);
          
          try {
            // Store info for potential retry
            setLastFailedVirtualDirectory({ name, loader: node.onSelect });
            
            // Use optimized virtual directory handler with lazy loading
            const result = await defaultVirtualDirectoryHandler.loadVirtualDirectory(
              node.onSelect,
              { 
                key: `${currentPath().join('/')}_${name}`,
                forceReload: false
              }
            );
            
            if (result.success && result.data) {
              // Success: navigate to loaded content
              setHistory([...history(), currentDirContent()]);
              setCurrentDirContent(result.data);
              setCurrentPath([...currentPath(), name]);
              setCurrentPage(0);
              setVirtualDirectoryRetryCount(0);
              setLastFailedVirtualDirectory(null);
            } else {
              // Failure: use fallback content
              const fallbackContent = defaultVirtualDirectoryHandler.getFallbackContent();
              setHistory([...history(), currentDirContent()]);
              setCurrentDirContent(fallbackContent);
              setCurrentPath([...currentPath(), `${name} (Fallback)`]);
              setCurrentPage(0);
              setVirtualDirectoryError(result.error || new Error('Unknown virtual directory error'));
              setVirtualDirectoryRetryCount(result.retryCount);
            }
          } catch (error) {
            console.error("Error loading virtual directory:", error);
            setVirtualDirectoryError(error as Error);
            setIsLoading(false);
            throw error; // Re-throw to be caught by error boundary
          } finally {
            setIsLoading(false);
          }
        }
        break;
    }
  }, NAVIGATION_THROTTLE_MS);

  /**
   * Handles back navigation with different behaviors based on current mode
   * - In input mode: exits input mode and returns to navigation
   * - In navigation: goes back to previous directory or root
   */
  const goBack = () => {
    // Exit input mode if active
    if (inputMode()) {
      setInputMode(false);
      setInputValue('');
      setInputNodeName(null);
      dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
      return;
    }

    // Navigate back through history
    const prevHistory = history();
    if (prevHistory.length > 0) {
      // Restore previous directory from history
      const lastContent = prevHistory[prevHistory.length - 1];
      setHistory(prevHistory.slice(0, -1));
      setCurrentDirContent(lastContent);
      setCurrentPath(currentPath().slice(0, -1));
      setCurrentPage(0);
    } else {
      // No history: return to root directory
      setCurrentPath([]);
      setCurrentDirContent(props.initialTree);
      setCurrentPage(0);
    }
  };

  /**
   * Handles breadcrumb navigation clicks
   * Navigates directly to the clicked directory level by reconstructing the path
   * @param path - Full path string of the target directory
   */
  const handleBreadcrumbClick = (path: string) => {
    const pathSegments = path.split('/').slice(1); // Remove '~' root indicator
    let targetDirContent = props.initialTree;
    let newHistory: DirTree[] = [];

    // Reconstruct path and history for direct navigation
    if (pathSegments.length > 0) {
      let current = props.initialTree;
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        if (current[segment] && current[segment].type === 'directory') {
          newHistory.push(current);
          current = current[segment].children || {};
        } else {
          // Invalid path - should not happen with valid breadcrumbs
          console.warn(`Invalid breadcrumb path: ${path}`);
          return;
        }
      }
      targetDirContent = current;
    }

    // Update navigation state
    setCurrentPath(pathSegments);
    setHistory(newHistory);
    setCurrentDirContent(targetDirContent);
    setCurrentPage(0);
  };

  // Breadcrumb constants
  const ROOT_INDICATOR = '~';
  const MAX_BREADCRUMB_SEGMENTS = 4;
  const BREADCRUMB_TRUNCATION_INDICATOR = '...';

  /**
   * Memoized breadcrumbs computation with path truncation
   * Shows full path for <= 4 segments, truncates longer paths to "... > parent > current"
   * Each breadcrumb includes name, full path, and clickability
   */
  const breadcrumbs = createMemo(() => {
    const path = currentPath();
    const segments = [ROOT_INDICATOR, ...path];
    
    // Truncate long paths for better UI
    const displayedSegments = segments.length > MAX_BREADCRUMB_SEGMENTS 
      ? [BREADCRUMB_TRUNCATION_INDICATOR, ...segments.slice(-3)] 
      : segments;
    
    return displayedSegments.map((name, index) => ({
      name,
      path: segments.slice(0, index + 1).join('/'),
      isClickable: true
    }));
  });

  createEffect(() => {
    setTitle(breadcrumbs());
  });

  // Handle input focus when entering input mode
  createEffect(() => {
    if (inputMode() && inputRef) {
      setTimeout(() => inputRef && focusInputInShadowDOM(inputRef), 0);
    }
  });

  // Handle command palette input focus
  createEffect(() => {
    if (commandPaletteMode() && commandPaletteInputRef) {
      // Use a slightly longer timeout to ensure the DOM is fully rendered
      setTimeout(() => {
        if (commandPaletteInputRef) {
          focusInputInShadowDOM(commandPaletteInputRef);
          // Clear any existing search term when opening
          if (searchTerm() === '') {
            commandPaletteInputRef.value = '';
          }
        }
      }, 10);
    }
  });

  /**
   * Saves the current input value to localStorage and exits input mode
   * Uses the node's localStorageKey to persist the value
   */
  const handleSaveInput = () => {
    const node = currentDirContent()[inputNodeName()!];
    if (node && node.localStorageKey) {
      localStorage.setItem(node.localStorageKey, inputValue());
    }
    exitInputMode();
  };

  /**
   * Cancels input editing without saving and exits input mode
   */
  const handleCancelInput = () => {
    exitInputMode();
  };

  /**
   * Common function to exit input mode and restore focus
   */
  const exitInputMode = () => {
    setInputMode(false);
    setInputValue('');
    setInputNodeName(null);
    dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Use shadow DOM-aware keyboard event handling
    if (!dirnavWindowRef) return;
    
    handleShadowDOMKeyboardEvent(event, dirnavWindowRef, (event, isCurrentlyFocused) => {
      if (event.ctrlKey && event.key === '`') {
        event.preventDefault();
        if (!isVisible()) {
          setIsVisible(true);
          setTimeout(() => dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef), 0);
        } else if (isCurrentlyFocused) {
          setIsVisible(false);
          dirnavWindowRef && blurElementInShadowDOM(dirnavWindowRef);
        } else {
          dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
        }
        return;
      }

      if (!isVisible() || !isCurrentlyFocused) return;

    if (commandPaletteMode()) {
      // Only prevent default for keys we explicitly handle in command palette mode
      if (event.key === 'Escape') {
        event.preventDefault();
        if (searchTerm()) {
          updateSearchTerm('');
          setSearchResults([]);
          setSelectedSearchResultIndex(0);
        } else {
          setCommandPaletteMode(false);
          setIsVisible(false); // Hide everything
          dirnavWindowRef && blurElementInShadowDOM(dirnavWindowRef);
        }
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const selectedNode = searchResults()[selectedSearchResultIndex()];
        if (selectedNode) {
          if (selectedNode.fullPath.startsWith('meta/')) {
            if (selectedNode.action) {
              selectedNode.action();
            }
            // After executing a meta action, reset to root
            setCurrentPath([]);
            setCurrentDirContent(props.initialTree);
            setCurrentPage(0);
          } else {
            const { node: foundNode, parentContent, parentPath } = findNodeAndParent(props.initialTree, selectedNode.fullPath);

            if (foundNode && parentContent) {
              setHistory([]); // Clear history to start fresh from root
              setCurrentPath(parentPath);
              setCurrentDirContent(parentContent);
              setCurrentPage(0);

              // If the selected node is an action, execute it
              if (foundNode.type === 'action' && foundNode.action) {
                foundNode.action();
              }

              // If the selected node is an input, activate input mode
              if (foundNode.type === 'input') {
                setInputMode(true);
                setInputNodeName(foundNode.name);
                setInputValue(localStorage.getItem(foundNode.localStorageKey || '') || '');
              }

              setTimeout(() => {
                // After executing a command palette action, return to the root directory
                // unless it's an input node, in which case we stay in input mode
                if (!inputMode()) { // Only reset if not entering input mode
                  setCurrentPath([]);
                  setCurrentDirContent(props.initialTree);
                  setCurrentPage(0);
                  dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
                }
              }, 0); // Small delay to allow UI to render the new directory

            } else {
              console.error("Could not find selected node in tree:", selectedNode);
            }
          }

          setCommandPaletteMode(false);
          updateSearchTerm('');
          setSearchResults([]);
          setSelectedSearchResultIndex(0);
          // Focus will be handled by createEffect if inputMode is true, otherwise focus the window
          if (!inputMode()) { // Only focus window if not entering input mode
            dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
          }
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedSearchResultIndex(prev => Math.max(0, prev - 1));
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedSearchResultIndex(prev => Math.min(searchResults().length - 1, prev + 1));
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        updateSearchTerm(searchTerm().slice(0, -1));
      }
      // Character input is handled by onInput on the <input> element, so no need to handle here.
      return;
    }

    if (inputMode()) {
      // Only prevent default for keys we explicitly handle in input mode
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSaveInput();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancelInput();
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        setInputValue(inputValue().slice(0, -1));
      }
      // Character input is handled by onInput on the <input> element, so no need to handle here.
      return;
    }

    // General navigation keys (only if not in input or command palette mode)
    if (event.key === 'Backspace') {
      event.preventDefault();
      goBack();
    } else if (event.key === '`') { // Handle backtick to enter command palette mode
      // This is already handled by the initial check for event.key === '`'
      // and the Ctrl+` combination. This block is for when only ` is pressed.
      event.preventDefault();
      setCommandPaletteMode(true);
      updateSearchTerm('');
      setSearchResults([]);
      setSelectedSearchResultIndex(0);
      // Focus will be handled by the createEffect above
    } else if (event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      const index = parseInt(event.key) - 1;
      const items = paginatedItems();

      if (index === 0 && items[0] && items[0][0] === 'prev_page') {
        setCurrentPage(p => p - 1);
      } else if (index === 8 && items[items.length - 1] && items[items.length - 1][0] === 'next_page') {
        setCurrentPage(p => p + 1);
      } else if (items[index]) {
        handleNavigate(items[index][0], items[index][1].type);
      }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setIsVisible(false);
        dirnavWindowRef && blurElementInShadowDOM(dirnavWindowRef);
      }
    });
  };

  

  onMount(() => {
    // Use shadow DOM-aware event management
    eventManager.addEventListener('document', 'keydown', handleKeyDown);
  });

  onCleanup(() => {
    // Clean up all event listeners
    eventManager.removeAllEventListeners();
  });

  /**
   * Resets the component to its initial root state
   * Clears all navigation history, search state, and input state
   */
  const resetToRoot = () => {
    setCurrentPath([]);
    setCurrentDirContent(props.initialTree);
    setCurrentPage(0);
    setHistory([]);
    setCommandPaletteMode(false);
    setInputMode(false);
    updateSearchTerm('');
    setSearchResults([]);
    setSelectedSearchResultIndex(0);
    setInputValue('');
    setInputNodeName(null);
  };

  /**
   * Handles navigation-related errors by resetting to a safe state
   * @param error - The navigation error that occurred
   */
  const handleNavigationError = (error: Error) => {
    console.error('Navigation error in DirnavUI:', error);
    resetToRoot();
  };

  /**
   * Handles command palette errors by closing the palette and clearing search state
   * @param error - The command palette error that occurred
   */
  const handleCommandPaletteError = (error: Error) => {
    console.error('Command palette error in DirnavUI:', error);
    setCommandPaletteMode(false);
    updateSearchTerm('');
    setSearchResults([]);
    setSelectedSearchResultIndex(0);
  };

  /**
   * Handles virtual directory errors by stopping loading and navigating back
   * @param error - The virtual directory error that occurred
   */
  const handleVirtualDirectoryError = (error: Error) => {
    console.error('Virtual directory error in DirnavUI:', error);
    setIsLoading(false);
    setVirtualDirectoryError(error);
    goBack();
  };

  /**
   * Retries loading a failed virtual directory with force reload
   * Uses the stored failed directory information to attempt reload
   */
  const retryVirtualDirectory = async () => {
    const failedDirectory = lastFailedVirtualDirectory();
    if (!failedDirectory) {
      console.warn('No failed virtual directory to retry');
      return;
    }

    setIsLoading(true);
    setVirtualDirectoryError(null);
    
    try {
      const result = await defaultVirtualDirectoryHandler.loadVirtualDirectory(
        failedDirectory.loader,
        { 
          key: `retry_${failedDirectory.name}_${Date.now()}`,
          forceReload: true // Force reload on retry
        }
      );
      
      if (result.success && result.data) {
        setCurrentDirContent(result.data);
        setVirtualDirectoryRetryCount(0);
        setLastFailedVirtualDirectory(null);
        console.log('Virtual directory retry successful');
      } else {
        setVirtualDirectoryError(result.error || new Error('Retry failed'));
        setVirtualDirectoryRetryCount(result.retryCount);
      }
    } catch (error) {
      console.error('Virtual directory retry failed:', error);
      setVirtualDirectoryError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Uses fallback content when virtual directory loading fails
   * Clears error state and provides basic fallback functionality
   */
  const useFallbackContent = () => {
    const fallbackContent = defaultVirtualDirectoryHandler.getFallbackContent();
    setCurrentDirContent(fallbackContent);
    setVirtualDirectoryError(null);
    setLastFailedVirtualDirectory(null);
    console.log('Using fallback content for virtual directory');
  };

  return (
    <ErrorBoundary
      onError={(error) => console.error('Top-level DirnavUI error:', error)}
    >
      <TitleContext.Provider value={{ title, setTitle: handleBreadcrumbClick }}>
        <Show when={isVisible()}>
          <NavigationErrorBoundary
            onNavigationError={handleNavigationError}
            onReset={resetToRoot}
          >
            <Window
              onBack={goBack}
              backButtonDisabled={currentPath().length === 0}
              commandPaletteMode={commandPaletteMode()}
              onCommandPalette={() => {
                if (commandPaletteMode()) {
                  // If command palette is already open, close it
                  setCommandPaletteMode(false);
                  updateSearchTerm('');
                  setSearchResults([]);
                  setSelectedSearchResultIndex(0);
                  dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
                } else {
                  // If command palette is closed, open it
                  setCommandPaletteMode(true);
                  updateSearchTerm('');
                  setSearchResults([]);
                  setSelectedSearchResultIndex(0);
                  // Focus will be handled by the createEffect above
                }
              }}
              ref={el => dirnavWindowRef = el} // Assign ref to the Window component
              onClose={() => setIsVisible(false)} // Pass the close handler
              componentThemeClass={getComponentThemeClass()} // Pass the theme class
            >
              <VirtualDirectoryErrorBoundary
                onVirtualDirectoryError={handleVirtualDirectoryError}
                onRetry={retryVirtualDirectory}
                onFallback={useFallbackContent}
              >
                <Show when={isLoading()}>
                  <div class="dirnav-error-loading">
                    <span>Loading virtual directory...</span>
                    <Show when={virtualDirectoryRetryCount() > 0}>
                      <small>Retry attempt {virtualDirectoryRetryCount()}</small>
                    </Show>
                    <Show when={virtualDirectoryError()}>
                      <div class="dirnav-loading-error">
                        <small>Previous attempt failed: {virtualDirectoryError()?.message}</small>
                      </div>
                    </Show>
                  </div>
                </Show>
              </VirtualDirectoryErrorBoundary>
              
              <Show when={commandPaletteMode()}>
                <CommandPaletteErrorBoundary
                  onSearchError={handleCommandPaletteError}
                  onReset={() => {
                    setCommandPaletteMode(false);
                    updateSearchTerm('');
                    setSearchResults([]);
                    setSelectedSearchResultIndex(0);
                    dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
                  }}
                >
                  <CommandPalette
                    searchTerm={searchTerm}
                    setSearchTerm={updateSearchTerm}
                    searchResults={searchResults}
                    selectedSearchResultIndex={selectedSearchResultIndex}
                    onSelect={async (item) => {
                      const selectedNode = item;
                      if (selectedNode) {
                        if (selectedNode.fullPath.startsWith('meta/')) {
                          // Handle meta actions (theme, etc.)
                          if (selectedNode.action) {
                            selectedNode.action();
                          }
                          // After executing a meta action, reset to root
                          setCurrentPath([]);
                          setCurrentDirContent(props.initialTree);
                          setCurrentPage(0);
                        } else {
                          const { node: foundNode, parentContent, parentPath } = findNodeAndParent(props.initialTree, selectedNode.fullPath);

                          if (foundNode && parentContent) {
                            // Clear history to start fresh navigation
                            setHistory([]);
                            
                            if (foundNode.type === 'directory') {
                              // Navigate TO the directory (not just to its parent)
                              const fullPath = selectedNode.fullPath.split('/');
                              setCurrentPath(fullPath);
                              setCurrentDirContent(foundNode.children || {});
                              setCurrentPage(0);
                            } else if (foundNode.type === 'virtual-directory') {
                              // Handle virtual directories
                              if (foundNode.onSelect) {
                                setIsLoading(true);
                                setVirtualDirectoryError(null);
                                setLastFailedVirtualDirectory({ name: foundNode.name, loader: foundNode.onSelect });
                                
                                try {
                                  const result = await defaultVirtualDirectoryHandler.loadVirtualDirectory(
                                    foundNode.onSelect,
                                    { 
                                      key: `command_palette_${selectedNode.fullPath}`,
                                      forceReload: false
                                    }
                                  );
                                  
                                  if (result.success && result.data) {
                                    const fullPath = selectedNode.fullPath.split('/');
                                    setCurrentPath(fullPath);
                                    setCurrentDirContent(result.data);
                                    setCurrentPage(0);
                                    setVirtualDirectoryRetryCount(0);
                                    setLastFailedVirtualDirectory(null);
                                  } else {
                                    // Use fallback content
                                    const fallbackContent = defaultVirtualDirectoryHandler.getFallbackContent();
                                    const fullPath = selectedNode.fullPath.split('/');
                                    setCurrentPath([...fullPath, '(Fallback)']);
                                    setCurrentDirContent(fallbackContent);
                                    setCurrentPage(0);
                                    setVirtualDirectoryError(result.error || new Error('Unknown virtual directory error'));
                                    setVirtualDirectoryRetryCount(result.retryCount);
                                  }
                                } catch (error) {
                                  console.error('Error loading virtual directory:', error);
                                  setVirtualDirectoryError(error as Error);
                                  throw error; // Re-throw to be caught by error boundary
                                } finally {
                                  setIsLoading(false);
                                }
                              }
                            } else if (foundNode.type === 'action') {
                              // Navigate to parent directory and execute action
                              setCurrentPath(parentPath);
                              setCurrentDirContent(parentContent);
                              setCurrentPage(0);
                              if (foundNode.action) {
                                foundNode.action();
                              }
                            } else if (foundNode.type === 'input') {
                              // Navigate to parent directory and activate input mode
                              setCurrentPath(parentPath);
                              setCurrentDirContent(parentContent);
                              setCurrentPage(0);
                              setInputMode(true);
                              setInputNodeName(foundNode.name);
                              setInputValue(localStorage.getItem(foundNode.localStorageKey || '') || '');
                            }
                          } else {
                            console.error("Could not find selected node in tree:", selectedNode);
                            throw new Error(`Could not find selected node: ${selectedNode.fullPath}`);
                          }
                        }

                        // Close command palette
                        setCommandPaletteMode(false);
                        updateSearchTerm('');
                        setSearchResults([]);
                        setSelectedSearchResultIndex(0);
                        
                        // Focus the window unless we're entering input mode
                        if (!inputMode()) {
                          setTimeout(() => {
                            dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
                          }, 0);
                        }
                      }
                    }}
                  />
                </CommandPaletteErrorBoundary>
              </Show>
              
              <Show when={inputMode()}>
                <div id="input-mode-container" role="dialog" aria-labelledby="input-mode-label" aria-describedby="input-mode-instructions">
                  <label id="input-mode-label" for="input-mode-input">
                    Enter value for {inputNodeName()}:
                  </label>
                  <div id="input-mode-instructions" class="sr-only">
                    Type your value and press Enter to save, or Escape to cancel
                  </div>
                  <input
                    id="input-mode-input"
                    ref={inputRef}
                    type="text"
                    value={inputValue()}
                    onInput={(e) => setInputValue(e.currentTarget.value)}
                    aria-required="false"
                    aria-describedby="input-mode-instructions"
                  />
                  <div id="input-mode-controls" role="group" aria-label="Input actions">
                    <button 
                      id="input-mode-cancel-button" 
                      onClick={handleCancelInput}
                      aria-label="Cancel input and return to navigation"
                    >
                      Cancel
                    </button>
                    <button 
                      id="input-mode-save-button" 
                      onClick={handleSaveInput}
                      aria-label="Save input value"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </Show>
              
              <Show when={!isLoading() && !inputMode() && !commandPaletteMode()}>
                <MainNav
                  paginatedItems={paginatedItems}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  handleNavigate={handleNavigate}
                />
              </Show>
            </Window>
          </NavigationErrorBoundary>
        </Show>
      </TitleContext.Provider>
    </ErrorBoundary>
  );
};

export default DirnavUI;
export { createDirTree };