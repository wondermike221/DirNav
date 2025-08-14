# DirNav UI - API Documentation

## Table of Contents
- [Core Components](#core-components)
- [Utility Functions](#utility-functions)
- [Type Definitions](#type-definitions)
- [Configuration Options](#configuration-options)
- [Event Handling](#event-handling)
- [Performance APIs](#performance-apis)

## Core Components

### DirnavUI

The main directory navigation component.

```typescript
interface DirnavUIProps {
  initialTree: DirTree;
}

const DirnavUI: Component<DirnavUIProps>
```

**Props:**
- `initialTree`: The directory structure to display

**Features:**
- Keyboard navigation with shortcuts
- Command palette with fuzzy search
- Theme switching (light/dark/system)
- Virtual directory support
- Error boundaries with recovery
- Performance optimizations

### Window

Draggable, resizable window container.

```typescript
interface WindowProps {
  children?: any;
  onBack?: () => void;
  backButtonDisabled?: boolean;
  onCommandPalette?: () => void;
  commandPaletteMode?: boolean;
  ref?: (el: HTMLDivElement) => void;
  onClose?: () => void;
  componentThemeClass?: string;
}

const Window: Component<WindowProps>
```

**Props:**
- `children`: Content to render inside the window
- `onBack`: Callback for back button clicks
- `backButtonDisabled`: Whether back button is disabled
- `onCommandPalette`: Callback for command palette toggle
- `commandPaletteMode`: Whether command palette is active
- `ref`: Reference callback for the window element
- `onClose`: Callback for window close
- `componentThemeClass`: CSS class for theming

### MainNav

Directory content display with pagination.

```typescript
interface MainNavProps {
  paginatedItems: () => any[];
  totalPages: () => number;
  currentPage: () => number;
  handleNavigate: (name: string, type: string) => void;
}

const MainNav: Component<MainNavProps>
```

### CommandPalette

Fuzzy search interface for quick navigation.

```typescript
interface CommandPaletteProps {
  searchTerm: Accessor<string>;
  setSearchTerm: Setter<string>;
  searchResults: Accessor<any[]>;
  selectedSearchResultIndex: Accessor<number>;
  onSelect: (item: any) => void;
}

const CommandPalette: Component<CommandPaletteProps>
```

## Utility Functions

### createDirTree

Creates a validated directory tree from raw data.

```typescript
function createDirTree(data: any): DirTree
```

**Parameters:**
- `data`: Raw directory data object

**Returns:**
- Validated `DirTree` structure

**Throws:**
- `Error` if tree structure is invalid

### validateDirectoryTree

Validates directory tree structure.

```typescript
function validateDirectoryTree(
  tree: DirTree, 
  currentPath?: string
): ValidationResult

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  path: string;
  message: string;
}
```

### validateDirectoryTreeStrict

Validates directory tree and throws on error.

```typescript
function validateDirectoryTreeStrict(
  tree: DirTree, 
  throwOnError?: boolean
): ValidationResult
```

### createShadowDOMWrapper

Creates a shadow DOM wrapper for component isolation.

```typescript
function createShadowDOMWrapper(
  component: () => JSX.Element,
  options?: ShadowDOMWrapperOptions
): ShadowDOMWrapper

interface ShadowDOMWrapperOptions {
  hostId?: string;
  attachToBody?: boolean;
  hostElement?: HTMLElement;
  injectStyles?: boolean;
  customStyles?: string;
}

interface ShadowDOMWrapper {
  host: HTMLElement;
  shadowRoot: ShadowRoot;
  mountPoint: HTMLElement;
  dispose: () => void;
  destroy: () => void;
  attachTo: (parent: Element) => void;
}
```

### fuzzySearch

Performs fuzzy search on directory nodes.

```typescript
function fuzzySearch(
  nodes: FlatDirNode[], 
  term: string, 
  options?: SearchOptions
): SearchResult[]

interface SearchOptions {
  maxResults?: number;
  minScore?: number;
  pathWeight?: number;
  nameWeight?: number;
  sequenceWeight?: number;
  exactMatchBonus?: number;
  prefixMatchBonus?: number;
}

interface SearchResult {
  node: FlatDirNode;
  score: number;
  matchedSegments: string[];
}
```

## Type Definitions

### DirNode

Base interface for directory nodes.

```typescript
interface DirNode {
  name: string;
  type: 'directory' | 'action' | 'input' | 'virtual-directory';
  children?: DirTree;
  action?: () => void;
  onSelect?: () => Promise<DirTree> | DirTree;
  localStorageKey?: string;
}
```

### DirTree

Directory tree structure.

```typescript
interface DirTree {
  [key: string]: DirNode;
}
```

### FlatDirNode

Flattened directory node with full path.

```typescript
interface FlatDirNode extends DirNode {
  fullPath: string;
}
```

## Configuration Options

### Fuzzy Search Configuration

```typescript
const FUZZY_SEARCH_CONFIG = {
  maxResults: 50,
  minScore: 0.01,
  pathWeight: 0.4,
  nameWeight: 0.6,
  sequenceWeight: 2.0,
  exactMatchBonus: 100,
  prefixMatchBonus: 50,
};
```

### Pagination Constants

```typescript
const MAX_ITEMS_PER_PAGE = 9;
const MAX_ITEMS_FIRST_PAGE = 8;
const MAX_ITEMS_MIDDLE_PAGE = 7;
const MAX_ITEMS_LAST_PAGE = 8;
const MAX_TOTAL_ITEMS = 23;
```

### Theme Configuration

```typescript
const THEME_STORAGE_KEY = 'dirnav-component-theme-preference';
const DARK_MODE_CLASS = 'dirnav-dark-mode';
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';
```

## Event Handling

### Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl + `` | Toggle visibility/focus | Global |
| `1-9` | Select item | Navigation |
| `Backspace` | Go back | Navigation |
| `Escape` | Hide/Cancel | Global |
| `` ` `` | Open command palette | Navigation |
| `Arrow Up/Down` | Navigate results | Command Palette |
| `Enter` | Select/Confirm | Command Palette/Input |

### Shadow DOM Event Management

```typescript
class ShadowDOMEventManager {
  addEventListener(
    target: Element | Document | 'document' | 'window',
    type: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): string;
  
  removeEventListener(listenerId: string): void;
  removeAllEventListeners(): void;
}
```

## Performance APIs

### Memoization

```typescript
function createMemoizedFunction<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  keyGenerator?: (...args: Args) => string,
  maxCacheSize?: number
): (...args: Args) => Return
```

### Debouncing

```typescript
function createDebouncedSignal<T>(
  initialValue: T,
  delay?: number
): [Accessor<T>, (value: T) => void]
```

### Throttling

```typescript
function createThrottledFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay?: number
): T
```

### Lazy Loading

```typescript
class LazyLoader<T> {
  async load(
    key: string,
    loader: () => Promise<T>,
    options?: {
      forceReload?: boolean;
      timeout?: number;
    }
  ): Promise<{
    data: T | null;
    isLoading: boolean;
    error: Error | null;
  }>
}
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  start(label: string): () => void;
  getStats(label: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } | null;
  clear(): void;
}
```

## Virtual Directory Handler

```typescript
class VirtualDirectoryHandler {
  async loadVirtualDirectory(
    loader: () => Promise<DirTree>,
    options?: Partial<VirtualDirectoryOptions> & {
      key?: string;
      forceReload?: boolean;
    }
  ): Promise<VirtualDirectoryResult>;
  
  getFallbackContent(): DirTree;
  clearCache(): void;
  getCacheStats(): { size: number };
  isLoading(key: string): boolean;
}

interface VirtualDirectoryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  fallbackContent?: DirTree;
}

interface VirtualDirectoryResult {
  success: boolean;
  data?: DirTree;
  error?: Error;
  retryCount: number;
  fromCache?: boolean;
}
```

## Error Boundaries

### NavigationErrorBoundary

Handles navigation and tree validation errors.

```typescript
interface NavigationErrorBoundaryProps {
  children: JSX.Element;
  onNavigationError?: (error: Error) => void;
  onReset?: () => void;
}
```

### CommandPaletteErrorBoundary

Handles search and command execution errors.

```typescript
interface CommandPaletteErrorBoundaryProps {
  children: JSX.Element;
  onSearchError?: (error: Error) => void;
  onReset?: () => void;
}
```

### VirtualDirectoryErrorBoundary

Handles async loading errors with retry options.

```typescript
interface VirtualDirectoryErrorBoundaryProps {
  children: JSX.Element;
  onVirtualDirectoryError?: (error: Error) => void;
  onRetry?: () => void;
  onFallback?: () => void;
}
```

## CSS Custom Properties

### Light Theme Variables
```css
:root {
  --bg-color: hsla(220, 13%, 95%, 1);
  --window-bg: hsla(0, 0%, 100%, 1);
  --window-border: hsla(0, 0%, 80%, 1);
  --text-color: hsla(0, 0%, 20%, 1);
  --focus-ring-color: hsla(210, 100%, 56%, 1);
}
```

### Dark Theme Variables
```css
.dirnav-dark-mode {
  --window-bg: hsla(0, 0%, 17%, 1);
  --window-border: hsla(0, 0%, 33%, 1);
  --text-color: hsla(0, 0%, 93%, 1);
  --focus-ring-color: hsla(210, 100%, 56%, 1);
}
```

## Integration Examples

### React Integration

```typescript
import { useEffect, useRef } from 'react';
import { createShadowDOMWrapper } from 'solid-dirnav-ui';

function MyReactComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      const wrapper = createShadowDOMWrapper(
        () => <DirnavUI initialTree={myTree} />,
        { hostElement: containerRef.current }
      );
      
      return () => wrapper.destroy();
    }
  }, []);
  
  return <div ref={containerRef} />;
}
```

### Vue Integration

```vue
<template>
  <div ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { createShadowDOMWrapper } from 'solid-dirnav-ui';

const container = ref();
let wrapper;

onMounted(() => {
  wrapper = createShadowDOMWrapper(
    () => <DirnavUI initialTree={myTree} />,
    { hostElement: container.value }
  );
});

onUnmounted(() => {
  wrapper?.destroy();
});
</script>
```

### Vanilla JavaScript Integration

```javascript
import { createShadowDOMWrapper, createDirTree } from 'solid-dirnav-ui';

const tree = createDirTree({
  // your directory structure
});

const wrapper = createShadowDOMWrapper(
  () => <DirnavUI initialTree={tree} />,
  {
    hostId: 'my-dirnav',
    attachToBody: true
  }
);

// Cleanup when needed
// wrapper.destroy();
```