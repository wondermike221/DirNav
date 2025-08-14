# DirNav UI Component

A comprehensive directory navigation UI component built with SolidJS, featuring keyboard shortcuts, command palette functionality, and shadow DOM isolation.

## Features

### Core Navigation
- **Hierarchical Directory Structure**: Navigate through nested directories with breadcrumb support
- **Keyboard Shortcuts**: Efficient navigation using numbers 1-9, backspace, escape, and backtick
- **Pagination**: Automatic pagination for directories with more than 9 items (max 23 items per directory)
- **Back Navigation**: Full history support with breadcrumb navigation

### Advanced Features
- **Command Palette**: Fuzzy search across all directories and actions with keyboard navigation
- **Multiple Node Types**: Support for directories, actions, inputs, and virtual directories
- **Virtual Directories**: Async loading of directory content with retry logic and fallback support
- **Theme System**: Light/Dark/System theme switching with localStorage persistence
- **Shadow DOM Isolation**: Complete style isolation to prevent conflicts with host page

### User Experience
- **Draggable & Resizable Window**: Persistent window position and size
- **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- **Responsive Design**: Optimized for mobile, tablet, and desktop with touch support
- **Error Boundaries**: Graceful error handling with recovery options
- **Performance Optimized**: Memoization, debouncing, and lazy loading

## Component Architecture

### Main Components

#### `DirnavUI`
The main component that orchestrates all functionality:
- State management for navigation, search, and UI
- Keyboard event handling
- Theme management
- Error boundary coordination

#### `Window`
Draggable, resizable window container:
- Position and size persistence
- Title bar with navigation controls
- Responsive sizing based on viewport

#### `MainNav`
Directory content display with pagination:
- Item listing with keyboard shortcuts
- Pagination controls and indicators
- Accessibility enhancements

#### `CommandPalette`
Fuzzy search interface:
- Real-time search with debouncing
- Keyboard navigation through results
- Result highlighting and selection

### Utility Modules

#### `fuzzySearch.ts`
Advanced fuzzy search implementation:
- Relevance scoring with multiple factors
- Path and name matching
- Performance optimizations with caching

#### `performance.ts`
Performance optimization utilities:
- Memoization with LRU cache
- Debounced and throttled functions
- Lazy loading for virtual directories
- Performance monitoring

#### `shadowDOMUtils.ts`
Shadow DOM integration utilities:
- Component wrapper creation
- Cross-boundary event handling
- Focus management
- Style isolation

#### `virtualDirectoryHandler.ts`
Virtual directory loading with error handling:
- Retry logic with exponential backoff
- Timeout handling
- Fallback content
- Cache management

#### `validation.ts`
Directory tree structure validation:
- 23-item limit enforcement
- Node type validation
- Recursive structure checking

## Usage Examples

### Basic Usage

```typescript
import { DirnavUI, createDirTree } from './DirnavUI';

const directoryTree = createDirTree({
  "documents": {
    type: 'directory',
    children: {
      "report.pdf": { 
        type: 'action', 
        action: () => console.log('Opening report') 
      }
    }
  },
  "settings": {
    type: 'input',
    localStorageKey: 'app-settings'
  }
});

// Render component
<DirnavUI initialTree={directoryTree} />
```

### Shadow DOM Integration

```typescript
import { createShadowDOMWrapper } from './utils/shadowDOMUtils';

const wrapper = createShadowDOMWrapper(
  () => <DirnavUI initialTree={tree} />,
  {
    hostId: 'my-dirnav',
    attachToBody: true
  }
);
```

### Virtual Directory Example

```typescript
const treeWithVirtual = createDirTree({
  "api_data": {
    type: 'virtual-directory',
    onSelect: async () => {
      const response = await fetch('/api/data');
      const data = await response.json();
      return createDirTree(data);
    }
  }
});
```

## Node Types

### Directory
```typescript
{
  type: 'directory',
  children: { /* nested structure */ }
}
```

### Action
```typescript
{
  type: 'action',
  action: () => void
}
```

### Input
```typescript
{
  type: 'input',
  localStorageKey: string,
  defaultValue?: string
}
```

### Virtual Directory
```typescript
{
  type: 'virtual-directory',
  onSelect: () => Promise<DirTree> | DirTree
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl + `` | Toggle window visibility/focus |
| `1-9` | Select directory item |
| `Backspace` | Go back / Exit input mode |
| `Escape` | Hide window / Cancel input |
| `` ` `` | Open command palette |
| `Arrow Keys` | Navigate search results |
| `Enter` | Select item / Save input |

## Theming

The component supports three theme modes:
- **Light**: Explicit light theme
- **Dark**: Explicit dark theme  
- **System**: Follows system preference

Themes are accessible through the command palette under "meta/theme/".

## Performance Considerations

### Optimizations Implemented
- **Memoized Computations**: Directory flattening, pagination, breadcrumbs
- **Debounced Search**: 150ms delay to prevent excessive filtering
- **Throttled Navigation**: 100ms throttle to prevent rapid navigation issues
- **Lazy Loading**: Virtual directories loaded on demand
- **LRU Caching**: Search results and computed values cached

### Memory Management
- Automatic cleanup of event listeners
- Proper disposal of async operations
- Efficient data structures for large trees
- Minimal DOM manipulation through SolidJS

## Error Handling

### Error Boundaries
- **NavigationErrorBoundary**: Handles navigation and tree validation errors
- **CommandPaletteErrorBoundary**: Handles search and command execution errors
- **VirtualDirectoryErrorBoundary**: Handles async loading errors with retry options

### Recovery Mechanisms
- Automatic fallback to safe states
- Retry functionality for failed operations
- User-friendly error messages with action buttons
- Graceful degradation for missing features

## Accessibility Features

### Keyboard Navigation
- Full keyboard accessibility
- Logical tab order
- Keyboard shortcuts with visual indicators

### Screen Reader Support
- Comprehensive ARIA labels
- Live regions for dynamic content
- Semantic HTML structure
- Screen reader only content where appropriate

### Visual Accessibility
- High contrast mode support
- Reduced motion support
- Scalable touch targets (44px minimum)
- Clear focus indicators

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features**: Shadow DOM, CSS Custom Properties, ES2020+

## Development

### Building
```bash
npm run build
```

### Testing
```bash
npm run test          # Run all tests
npm run test:ui       # Run with UI
npm run test:debug    # Debug mode
```

### Development Server
```bash
npm run dev
```

## Contributing

1. Follow TypeScript strict mode
2. Add comprehensive JSDoc comments
3. Include unit tests for new features
4. Ensure accessibility compliance
5. Test across different browsers and devices

## License

ISC License - see LICENSE file for details.