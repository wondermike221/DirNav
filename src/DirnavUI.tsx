import { Component, createSignal, For, Show, onMount, onCleanup, createEffect } from 'solid-js';
import Window from './Window';
import { DirNode, DirTree } from './types';
import { TitleContext } from './TitleContext';
import CommandPalette from './components/CommandPalette';
import MainNav from './components/MainNav';

interface DirnavUIProps {
  initialTree: DirTree;
}

// Helper to flatten the directory tree for fuzzy searching
interface FlatDirNode extends DirNode {
  fullPath: string;
}

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
  return tree;
};

const DirnavUI: Component<DirnavUIProps> = (props) => {
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

  const fuzzySearch = (term: string) => {
    if (!term) return [];
    const lowerCaseTerm = term.toLowerCase();
    const resultsWithScore = allNodes().map(node => {
      let score = 0;
      const lowerCaseName = node.name.toLowerCase();
      const lowerCaseFullPath = node.fullPath.toLowerCase();

      // Prioritize matches in name
      if (lowerCaseName === lowerCaseTerm) score += 100; // Exact name match
      else if (lowerCaseName.startsWith(lowerCaseTerm)) score += 50; // Name starts with term
      else if (lowerCaseName.includes(lowerCaseTerm)) score += 10; // Name includes term

      // Prioritize matches in fullPath for disambiguation
      if (lowerCaseFullPath.includes(lowerCaseTerm)) score += 5; // Path includes term

      // More sophisticated fuzzy matching (character by character in order)
      let termIdx = 0;
      for (let i = 0; i < lowerCaseFullPath.length; i++) {
        if (termIdx < lowerCaseTerm.length && lowerCaseFullPath[i] === lowerCaseTerm[termIdx]) {
          score += 1; // Character match
          termIdx++;
        }
      }
      if (termIdx === lowerCaseTerm.length) score += 20; // All characters found in order

      return { node, score };
    }).filter(item => item.score > 0) // Only include nodes with a positive score
      .sort((a, b) => {
        // Primary sort by score, secondary sort by fullPath length (shorter paths first for same score)
        if (b.score === a.score) {
          return a.node.fullPath.length - b.node.fullPath.length;
        }
        return b.score - a.score;
      })
      .map(item => item.node);

    return resultsWithScore;
  };

  createEffect(() => {
    if (commandPaletteMode()) {
      setSearchResults(fuzzySearch(searchTerm()));
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
      dirnavWindowRef?.focus(); // Re-focus the window when exiting input mode via Backspace
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

  const handleSaveInput = () => {
    const node = currentDirContent()[inputNodeName()!];
    if (node && node.localStorageKey) {
      localStorage.setItem(node.localStorageKey, inputValue());
    }
    setInputMode(false);
    setInputValue('');
    setInputNodeName(null);
    dirnavWindowRef?.focus();
  };

  const handleCancelInput = () => {
    setInputMode(false);
    setInputValue('');
    setInputNodeName(null);
    dirnavWindowRef?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const isCurrentlyFocused = dirnavWindowRef && dirnavWindowRef.contains(document.activeElement);

    // Always prevent default for backtick to avoid browser interference
    if (event.key === '`') {
      event.preventDefault();
    }

    if (event.ctrlKey && event.key === '`') {
      if (!isVisible()) {
        setIsVisible(true);
        setTimeout(() => dirnavWindowRef?.focus(), 0);
      } else if (isCurrentlyFocused) {
        setIsVisible(false);
        dirnavWindowRef?.blur();
      } else {
        dirnavWindowRef?.focus();
      }
      return; // Consume the event here to prevent further processing
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
          dirnavWindowRef?.blur();
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
                  dirnavWindowRef?.focus();
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
            dirnavWindowRef?.focus();
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
      setTimeout(() => commandPaletteInputRef?.focus(), 0);
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
      dirnavWindowRef?.blur();
    }
  };

  createEffect(() => {
    if (inputMode() && inputRef) {
      inputRef.focus();
    }
    // No need for else if here, as commandPaletteInputRef is handled by onInput
  });

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <TitleContext.Provider value={{ title, setTitle: handleBreadcrumbClick }}>
      <Show when={isVisible()}>
        <Window
          onBack={goBack}
          backButtonDisabled={currentPath().length === 0}
          ref={dirnavWindowRef} // Assign ref to the Window component
          onClose={() => setIsVisible(false)} // Pass the close handler
          componentThemeClass={getComponentThemeClass()} // Pass the theme class
        >
          <div style={{ padding: '10px' }}>
            <Show when={isLoading()}>
              <p>Loading...</p>
            </Show>
            <Show when={commandPaletteMode()}>
              <CommandPalette
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                searchResults={searchResults}
                selectedSearchResultIndex={selectedSearchResultIndex}
                onSelect={(item) => {
                  // This click handler will need to trigger navigation/action
                  // For now, just log and exit command palette mode
                  const selectedNode = item;
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
                        setHistory([]); // Clear history to start fresh from root for command palette navigation
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
                            dirnavWindowRef?.focus();
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
                      dirnavWindowRef?.focus();
                    }
                  }
                }}
                commandPaletteInputRef={commandPaletteInputRef}
              />
            </Show>
            <Show when={inputMode()}>
              <div>
                <p>Enter value for {inputNodeName()}:</p>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue()}
                  onInput={(e) => setInputValue(e.currentTarget.value)}
                  style={{ width: '100%', padding: '5px' }}
                />
                <div style={{ 'margin-top': '10px', 'text-align': 'right' }}>
                  <button onClick={handleCancelInput} style={{ 'margin-right': '10px' }}>Cancel</button>
                  <button onClick={handleSaveInput}>Save</button>
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
          </div>
        </Window>
      </Show>
    </TitleContext.Provider>
  );
};

export default DirnavUI;
export { createDirTree };