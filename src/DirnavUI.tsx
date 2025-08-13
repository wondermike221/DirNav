import { Component, createSignal, For, Show, onMount, onCleanup, createEffect } from 'solid-js';
import Window from './Window';
import { DirNode, DirTree, FlatDirNode } from './types';
import { fuzzySearch, SearchResult } from './utils/fuzzySearch';
import { TitleContext } from './TitleContext';
import CommandPalette from './components/CommandPalette';
import MainNav from './components/MainNav';
import { validateDirectoryTreeStrict } from './validation';
import { 
  isElementFocused, 
  createShadowDOMEventManager, 
  focusElementInShadowDOM, 
  blurElementInShadowDOM,
  handleShadowDOMKeyboardEvent,
  focusInputInShadowDOM
} from './utils/shadowDOMUtils';

interface DirnavUIProps {
  initialTree: DirTree;
}

// Helper to flatten the directory tree for fuzzy searching

const flattenTree = (tree: DirTree, currentPath: string[] = []): FlatDirNode[] => {
  let flatNodes: FlatDirNode[] = [];
  for (const key in tree) {
    const node = tree[key];
    const newPath = [...currentPath, node.name];
    const fullPath = newPath.join('/');

    flatNodes.push({ ...node, fullPath });

    if (node.type === 'directory' && node.children) {
      flatNodes = flatNodes.concat(flattenTree(node.children, newPath));
    }
  }
  return flatNodes;
};

// Helper to find a node and its parent content/path given its fullPath
const findNodeAndParent = (tree: DirTree, targetFullPath: string, currentPath: string[] = []): { node: DirNode | undefined, parentContent: DirTree | undefined, parentPath: string[] } => {
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

const DirnavUI: Component<DirnavUIProps> = (props) => {
  // Validate the initial tree on component initialization
  validateDirectoryTreeStrict(props.initialTree);
  
  const [currentPath, setCurrentPath] = createSignal<string[]>([]);
  const [currentPage, setCurrentPage] = createSignal(0);
  const [currentDirContent, setCurrentDirContent] = createSignal<DirTree>(props.initialTree); // This holds the content of the currently displayed directory
  const [history, setHistory] = createSignal<DirTree[]>([]); // Stack to store previous directory contents
  const [isLoading, setIsLoading] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(true);
  const [inputMode, setInputMode] = createSignal(false); // New state for input mode
  const [inputNodeName, setInputNodeName] = createSignal<string | null>(null); // Name of the input node being edited
  const [inputValue, setInputValue] = createSignal(''); // Value of the input field
  const [commandPaletteMode, setCommandPaletteMode] = createSignal(false); // New state for command palette mode
  const [searchTerm, setSearchTerm] = createSignal(''); // New state for command palette search term
  const [searchResults, setSearchResults] = createSignal<FlatDirNode[]>([]); // New state for command palette search results
  const [selectedSearchResultIndex, setSelectedSearchResultIndex] = createSignal(0); // New state for selected search result
  const [componentThemePreference, setComponentThemePreference] = createSignal<'light' | 'dark' | 'system'>(localStorage.getItem('dirnav-component-theme-preference') as 'light' | 'dark' | 'system' || 'system');
  const [title, setTitle] = createSignal<any[]>([{ name: '~', path: '/', isClickable: true }]); // New signal for the title

  let dirnavWindowRef: HTMLDivElement | undefined; // Ref for the Window component's root div
  let inputRef: HTMLInputElement | undefined; // Ref for the input element
  let commandPaletteInputRef: HTMLInputElement | undefined; // Ref for the command palette input
  
  // Shadow DOM-aware event manager
  const eventManager = createShadowDOMEventManager();

  const applyComponentTheme = (theme: 'light' | 'dark' | 'system') => {
    setComponentThemePreference(theme);
    localStorage.setItem('dirnav-component-theme-preference', theme);
  };

  const getComponentThemeClass = () => {
    const preference = componentThemePreference();
    if (preference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dirnav-dark-mode' : '';
    } else if (preference === 'dark') {
      return 'dirnav-dark-mode';
    } else {
      return '';
    }
  };

  const allNodes = () => {
    const baseNodes = flattenTree(props.initialTree);
    const metaNodes: FlatDirNode[] = [
      { name: 'meta', type: 'directory', fullPath: 'meta' },
      { name: 'theme', type: 'directory', fullPath: 'meta/theme' },
      { name: 'Light', type: 'action', fullPath: 'meta/theme/Light', action: () => applyComponentTheme('light') },
      { name: 'Dark', type: 'action', fullPath: 'meta/theme/Dark', action: () => applyComponentTheme('dark') },
      { name: 'System', type: 'action', fullPath: 'meta/theme/System', action: () => applyComponentTheme('system') },
    ];
    return [...baseNodes, ...metaNodes];
  };

  const performFuzzySearch = (term: string): FlatDirNode[] => {
    if (!term) return [];
    
    const searchResults = fuzzySearch(allNodes(), term, {
      maxResults: 50,
      minScore: 0.01, // Lower threshold for better compatibility
      pathWeight: 0.4,
      nameWeight: 0.6,
      sequenceWeight: 2.0,
      exactMatchBonus: 100,
      prefixMatchBonus: 50,
    });
    
    return searchResults.map(result => result.node);
  };

  createEffect(() => {
    if (commandPaletteMode()) {
      setSearchResults(performFuzzySearch(searchTerm()));
      setSelectedSearchResultIndex(0);
    }
  });

  const directoryItems = () => Object.entries(currentDirContent()); // Directly use currentDirContent
  const totalItems = () => directoryItems().length;

  const totalPages = () => {
    if (totalItems() <= 9) return 1;
    if (totalItems() <= 17) return 2; // 8 (page1) + 9 (page2) or 9 (page1) + 8 (page2)
    return 3; // Max 23 items (8 + 7 + 8)
  };

  const paginatedItems = () => {
    const items = directoryItems();
    const currentPageValue = currentPage();
    let start = 0;
    let end = 0;
    let displayedItems: [string, DirNode][] = [];

    if (currentPageValue === 0) { // First page
      start = 0;
      if (totalItems() <= 9) {
        end = totalItems();
      } else {
        end = 8; // 8 items + Next Page
      }
      displayedItems = items.slice(start, end);
      if (totalItems() > 9) {
        displayedItems.push(['next_page', { name: 'Next Page', type: 'action', action: () => setCurrentPage(currentPageValue + 1) }]);
      }
    } else if (currentPageValue === 1) { // Second page
      start = 8; // After first page's 8 items
      end = start + 7; // Previous Page + 7 items + Next Page
      displayedItems = items.slice(start, end);
      displayedItems.unshift(['prev_page', { name: 'Previous Page', type: 'action', action: () => setCurrentPage(currentPageValue - 1) }]);
      if (totalItems() > 15) { // If there's a third page
        displayedItems.push(['next_page', { name: 'Next Page', type: 'action', action: () => setCurrentPage(currentPageValue + 1) }]);
      }
    } else if (currentPageValue === 2) { // Third page
      start = 15; // After first 8 + second 7 items
      end = start + 8; // Previous Page + 8 items
      displayedItems = items.slice(start, end);
      displayedItems.unshift(['prev_page', { name: 'Previous Page', type: 'action', action: () => setCurrentPage(currentPageValue - 1) }]);
    }

    return displayedItems;
  };

  const handleNavigate = async (name: string, type: DirNode['type']) => {
    if (name === 'prev_page') {
      setCurrentPage(p => p - 1);
      return;
    }
    if (name === 'next_page') {
      setCurrentPage(p => p + 1);
      return;
    }

    const node = currentDirContent()[name]; // Get node from current content
    if (!node) return;

    if (type === 'directory') {
      setHistory([...history(), currentDirContent()]); // Save current content
      setCurrentPath([...currentPath(), name]);
      setCurrentDirContent(node.children || {}); // Set new content
      setCurrentPage(0);
    } else if (type === 'action') {
      if (node.action) {
        node.action();
      }
    } else if (type === 'input') {
      setInputMode(true);
      setInputNodeName(name);
      setInputValue(localStorage.getItem(node.localStorageKey || '') || '');
    } else if (type === 'virtual-directory') {
      if (node.onSelect) {
        setIsLoading(true);
        try {
          const result = await Promise.resolve(node.onSelect());
          setHistory([...history(), currentDirContent()]); // Save current content
          setCurrentDirContent(result); // Set new content from virtual directory
          setCurrentPath([...currentPath(), name]); // Add virtual directory name to path
          setCurrentPage(0);
        } catch (error) {
          console.error("Error loading virtual directory:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const goBack = () => {
    if (inputMode()) {
      setInputMode(false);
      setInputValue('');
      setInputNodeName(null);
      dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef); // Re-focus the window when exiting input mode via Backspace
      return;
    }

    const prevHistory = history();
    if (prevHistory.length > 0) {
      const lastContent = prevHistory[prevHistory.length - 1];
      setHistory(prevHistory.slice(0, -1));
      setCurrentDirContent(lastContent); // Restore previous content
      setCurrentPath(currentPath().slice(0, -1));
      setCurrentPage(0);
    } else {
      // If history is empty, we are at the root of the initialTree
      setCurrentPath([]);
      setCurrentDirContent(props.initialTree); // Go back to initial root
      setCurrentPage(0);
    }
  };

  const handleBreadcrumbClick = (path: string) => {
    const pathSegments = path.split('/').slice(1); // Remove '~'
    let targetDirContent = props.initialTree;
    let newHistory: DirTree[] = [];

    if (pathSegments.length > 0) {
      let current = props.initialTree;
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        if (current[segment] && current[segment].type === 'directory') {
          newHistory.push(current);
          current = current[segment].children || {};
        } else {
          // This should not happen if the path is correct
          return;
        }
      }
      targetDirContent = current;
    }

    setCurrentPath(pathSegments);
    setHistory(newHistory);
    setCurrentDirContent(targetDirContent);
    setCurrentPage(0);
  };

  const breadcrumbs = () => {
    const path = currentPath();
    const segments = ["~", ...path];
    const displayedSegments = segments.length > 4 ? ["...", ...segments.slice(-3)] : segments;
    return displayedSegments.map((name, index) => ({
      name,
      path: segments.slice(0, index + 1).join('/'),
      isClickable: true
    }));
  };

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

  const handleSaveInput = () => {
    const node = currentDirContent()[inputNodeName()!];
    if (node && node.localStorageKey) {
      localStorage.setItem(node.localStorageKey, inputValue());
    }
    setInputMode(false);
    setInputValue('');
    setInputNodeName(null);
    dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
  };

  const handleCancelInput = () => {
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
          setSearchTerm('');
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
          setSearchTerm('');
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
        setSearchTerm(prev => prev.slice(0, -1));
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
      setSearchTerm('');
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

  return (
    <TitleContext.Provider value={{ title, setTitle: handleBreadcrumbClick }}>
      <Show when={isVisible()}>
        <Window
          onBack={goBack}
          backButtonDisabled={currentPath().length === 0}
          commandPaletteMode={commandPaletteMode()}
          onCommandPalette={() => {
            if (commandPaletteMode()) {
              // If command palette is already open, close it
              setCommandPaletteMode(false);
              setSearchTerm('');
              setSearchResults([]);
              setSelectedSearchResultIndex(0);
              dirnavWindowRef && focusElementInShadowDOM(dirnavWindowRef);
            } else {
              // If command palette is closed, open it
              setCommandPaletteMode(true);
              setSearchTerm('');
              setSearchResults([]);
              setSelectedSearchResultIndex(0);
              // Focus will be handled by the createEffect above
            }
          }}
          ref={el => dirnavWindowRef = el} // Assign ref to the Window component
          onClose={() => setIsVisible(false)} // Pass the close handler
          componentThemeClass={getComponentThemeClass()} // Pass the theme class
        >
          <Show when={isLoading()}>
            <p>Loading...</p>
          </Show>
          <Show when={commandPaletteMode()}>
            <CommandPalette
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
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
                          try {
                            const result = await Promise.resolve(foundNode.onSelect());
                            const fullPath = selectedNode.fullPath.split('/');
                            setCurrentPath(fullPath);
                            setCurrentDirContent(result);
                            setCurrentPage(0);
                          } catch (error) {
                            console.error('Error loading virtual directory:', error);
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
                    }
                  }

                  // Close command palette
                  setCommandPaletteMode(false);
                  setSearchTerm('');
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
              commandPaletteInputRef={commandPaletteInputRef}
            />
          </Show>
          <Show when={inputMode()}>
            <div id="input-mode-container">
              <p>Enter value for {inputNodeName()}:</p>
              <input
                id="input-mode-input"
                ref={inputRef}
                type="text"
                value={inputValue()}
                onInput={(e) => setInputValue(e.currentTarget.value)}
              />
              <div id="input-mode-controls">
                <button id="input-mode-cancel-button" onClick={handleCancelInput}>Cancel</button>
                <button id="input-mode-save-button" onClick={handleSaveInput}>Save</button>
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
      </Show>
    </TitleContext.Provider>
  );
};

export default DirnavUI;
export { createDirTree };