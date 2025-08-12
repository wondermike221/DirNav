# Design Document

## Overview

DirNav is a comprehensive directory navigation UI component built as a React component that can be embedded in any web application or userscript. The component provides an OS-like window interface with advanced navigation capabilities, keyboard shortcuts, and support for multiple node types. The design emphasizes user experience through intuitive controls, efficient navigation patterns, and customizable theming.

## Architecture

### Component Structure

The DirNav component follows a modular React architecture with the following key components:

- **DirnavUI**: Main container component managing state and orchestrating child components
- **Window**: Draggable, resizable window wrapper with title bar controls
- **NavigationView**: Displays directory contents with breadcrumbs and pagination
- **CommandPalette**: Fuzzy search interface for quick navigation
- **TitleBar**: Contains navigation controls, title display, and window controls
  - Displays back button (←) when not at root directory
  - Shows command palette button (>) when at root directory
  - Centers current directory name in title area
  - Includes window controls (resize-to-default □, close X) on the right

### Keyboard Shortcut System

The component implements a global keyboard event system that manages:

- **Global Toggle**: Ctrl+` for show/hide/focus behavior
- **Navigation Shortcuts**: Numbers 1-9 for item selection
- **Quick Actions**: Backspace for back navigation, Esc for hide, ` for command palette
- **Command Palette Navigation**: Arrow keys and Enter for search result selection

**Design Decision:** Global event listeners are attached to the document to ensure shortcuts work regardless of focus state, with proper cleanup on component unmount.

### State Management

The component uses React's built-in state management with the following key state objects:

- **Navigation State**: Current directory path, breadcrumbs, pagination state
- **Window State**: Position, size, visibility, focus state
- **Command Palette State**: Search term, filtered results, selected index
- **Theme State**: Current theme selection (Light/Dark/System)
- **Input State**: Active input editing, temporary values

### Data Flow

1. **Initialization**: Component receives directory tree structure as props
2. **Navigation**: User interactions trigger state updates that cascade through child components
3. **Persistence**: Critical state (window position, theme, input values) persists to localStorage
4. **Event Handling**: Global keyboard listeners manage shortcuts and focus

## Components and Interfaces

### DirnavUI Component

**Props Interface:**
```typescript
interface DirnavUIProps {
  directoryTree: DirectoryNode;
  onClose?: () => void;
}
```

**Key Responsibilities:**
- Manages global component state
- Handles keyboard shortcuts and focus management
- Coordinates between navigation and command palette modes
- Persists and restores user preferences

### Window Component

**Props Interface:**
```typescript
interface WindowProps {
  title: string;
  onClose: () => void;
  onResize: (width: number, height: number) => void;
  onMove: (x: number, y: number) => void;
  children: React.ReactNode;
}
```

**Design Decisions:**
- Uses CSS transforms for smooth dragging performance
- Implements resize handles only in bottom-right corner for simplicity
- Stores position/size in viewport units for responsive behavior
- Default size of 25vw × 25vh provides good balance of visibility and screen real estate

### NavigationView Component

**Props Interface:**
```typescript
interface NavigationViewProps {
  currentDirectory: DirectoryNode;
  currentPath: string[];
  onNavigate: (path: string[]) => void;
  onSelectItem: (item: DirectoryItem) => void;
}
```

**Pagination Strategy:**
- Maximum 9 items per page to align with keyboard shortcuts (1-9)
- Maximum 3 pages (23 total items) to prevent overwhelming navigation
- Uses circular navigation: option 1 = previous page, option 9 = next page
- Pagination dots provide visual feedback for current page

**Breadcrumb Strategy:**
- Shows full path for depths ≤ 4 levels
- Truncates to "... > parent > current" for deeper paths
- Clickable breadcrumbs enable quick navigation to any level

### CommandPalette Component

**Props Interface:**
```typescript
interface CommandPaletteProps {
  allItems: DirectoryItem[];
  onSelect: (item: DirectoryItem) => void;
  onExit: () => void;
}
```

**Fuzzy Search Implementation:**
- Searches across all leaf nodes (actions, inputs, virtual directories)
- Implements relevance scoring based on character matching and position
- Sorts results by relevance score for optimal user experience
- Supports keyboard navigation through results

**Meta Settings Integration:**
- Theme switching options (Light, Dark, System) accessible only through command palette
- Settings are kept separate from user directories to avoid clutter
- Immediate theme application with localStorage persistence

## Data Models

### Directory Tree Structure

```typescript
interface DirectoryNode {
  [key: string]: DirectoryItem;
}

type DirectoryItem = 
  | { type: 'directory'; children: DirectoryNode }
  | { type: 'action'; callback: () => void }
  | { type: 'input'; key: string; defaultValue?: string }
  | { type: 'virtual'; action: () => Promise<DirectoryNode> };
```

**Design Rationale:**
- Flexible structure supports nested hierarchies of arbitrary depth
- Type discrimination enables different behaviors per node type
- Virtual directories enable dynamic content loading
- Input nodes use keys for localStorage persistence

### State Models

```typescript
interface NavigationState {
  currentPath: string[];
  currentDirectory: DirectoryNode;
  currentPage: number;
  totalPages: number;
}

interface WindowState {
  x: number;
  y: number;
  width: string;
  height: string;
  isVisible: boolean;
  isFocused: boolean;
}

interface CommandPaletteState {
  isActive: boolean;
  searchTerm: string;
  filteredResults: DirectoryItem[];
  selectedIndex: number;
}
```

## Error Handling

### Validation Strategy

**Initialization Validation:**
- Validates directory tree structure on component mount
- Throws descriptive errors for invalid node types
- Enforces 23-item limit per directory to prevent pagination overflow
- Validates required properties for each node type

**Shadow DOM Integration:**
- Component initializes within shadow DOM for style isolation
- Attaches to document body automatically upon creation
- Prevents conflicts with host page styling and scripts

**Runtime Error Handling:**
- Graceful fallbacks for localStorage access failures
- Error boundaries prevent component crashes from propagating
- Virtual directory loading errors display user-friendly messages
- Invalid navigation attempts reset to safe state (root directory)

### Error Recovery

- Failed virtual directory loads maintain previous directory state
- Corrupted localStorage data triggers reset to defaults
- Invalid keyboard shortcuts are ignored rather than causing errors
- Component maintains functional state even with partial failures

## Testing Strategy

### Unit Testing Approach

**Component Testing:**
- Test each component in isolation with mock props
- Verify state transitions for all user interactions
- Test keyboard shortcut handling and focus management
- Validate localStorage persistence and restoration

**Integration Testing:**
- Test complete user workflows (navigation, search, input editing)
- Verify component interactions and data flow
- Test error scenarios and recovery mechanisms
- Validate accessibility features and keyboard navigation

### Test Categories

1. **Navigation Tests:**
   - Directory traversal and breadcrumb updates
   - Pagination behavior with various item counts
   - Back button and keyboard navigation

2. **Command Palette Tests:**
   - Fuzzy search accuracy and result ordering
   - Keyboard navigation through search results
   - Search term clearing and exit behavior

3. **Window Management Tests:**
   - Drag and resize functionality
   - Position and size persistence
   - Show/hide behavior and focus management

4. **Node Type Tests:**
   - Action execution and callback handling
   - Input editing and value persistence
   - Virtual directory loading and error handling

5. **Theme and Settings Tests:**
   - Theme switching and persistence
   - Settings access through command palette
   - System theme detection and application

### Performance Considerations

**Optimization Strategies:**
- Memoization of expensive computations (fuzzy search, pagination)
- Lazy loading of virtual directory contents
- Efficient re-rendering through proper React key usage
- Debounced search input to prevent excessive filtering

**Memory Management:**
- Cleanup of event listeners on component unmount
- Proper disposal of async operations for virtual directories
- Efficient data structures for large directory trees
- Minimal DOM manipulation through React's virtual DOM

## Shadow DOM Integration

**Isolation Strategy:**
- Component renders within shadow DOM to prevent style conflicts
- Custom CSS properties enable theme customization from host page
- Event handling respects shadow DOM boundaries
- Focus management works correctly across shadow DOM boundary

**Styling Approach:**
- Self-contained CSS with no external dependencies
- CSS custom properties for theme variables
- Responsive design using viewport units and flexbox
- High contrast support for accessibility compliance

This design provides a robust foundation for implementing all requirements while maintaining code quality, performance, and user experience standards.