# DirNav UI Component

A comprehensive directory navigation UI component built with SolidJS, featuring keyboard shortcuts, command palette functionality, and shadow DOM isolation for seamless integration into any web application.

## 🚀 Quick Start

### Installation

```bash
npm install solid-dirnav-ui
```

### Basic Usage

```typescript
import { DirnavUI, createDirTree } from 'solid-dirnav-ui';

const directoryTree = createDirTree({
  "documents": {
    type: 'directory',
    children: {
      "report.pdf": { 
        type: 'action', 
        action: () => console.log('Opening report') 
      },
      "settings": {
        type: 'input',
        localStorageKey: 'user-settings',
        defaultValue: 'default value'
      }
    }
  },
  "api_data": {
    type: 'virtual-directory',
    onSelect: async () => {
      const response = await fetch('/api/data');
      const data = await response.json();
      return createDirTree(data);
    }
  }
});

// Render the component
<DirnavUI initialTree={directoryTree} />
```

## ✨ Features

### Core Navigation
- **Hierarchical Directory Structure**: Navigate through nested directories with breadcrumb support
- **Keyboard Shortcuts**: Efficient navigation using numbers 1-9, backspace, escape, and backtick
- **Pagination**: Automatic pagination for directories with more than 9 items (max 23 items per directory)
- **Command Palette**: Fuzzy search across all directories and actions with keyboard navigation

### Advanced Features
- **Multiple Node Types**: Support for directories, actions, inputs, and virtual directories
- **Virtual Directories**: Async loading of directory content with retry logic and fallback support
- **Theme System**: Light/Dark/System theme switching with localStorage persistence
- **Shadow DOM Isolation**: Complete style isolation to prevent conflicts with host page
- **Draggable & Resizable Window**: Persistent window position and size

### User Experience
- **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- **Responsive Design**: Optimized for mobile, tablet, and desktop with touch support
- **Error Boundaries**: Graceful error handling with recovery options
- **Performance Optimized**: Memoization, debouncing, and lazy loading

## 📖 Documentation

- [API Documentation](./API.md) - Complete API reference
- [Integration Guide](#integration-guide) - Framework-specific integration examples
- [Troubleshooting Guide](#troubleshooting) - Common issues and solutions

## 🎯 Integration Guide

### React Integration

```typescript
import React, { useEffect, useRef } from 'react';
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

function MyReactComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<any>(null);
  
  useEffect(() => {
    if (containerRef.current && !wrapperRef.current) {
      const tree = createDirTree({
        // your directory structure
      });
      
      wrapperRef.current = createShadowDOMWrapper(
        () => <DirnavUI initialTree={tree} />,
        { 
          hostElement: containerRef.current,
          injectStyles: true
        }
      );
    }
    
    return () => {
      if (wrapperRef.current) {
        wrapperRef.current.destroy();
        wrapperRef.current = null;
      }
    };
  }, []);
  
  return <div ref={containerRef} />;
}

export default MyReactComponent;
```

### Vue 3 Integration

```vue
<template>
  <div ref="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

const container = ref<HTMLDivElement>();
let wrapper: any = null;

const tree = createDirTree({
  // your directory structure
});

onMounted(() => {
  if (container.value) {
    wrapper = createShadowDOMWrapper(
      () => <DirnavUI initialTree={tree} />,
      { 
        hostElement: container.value,
        injectStyles: true
      }
    );
  }
});

onUnmounted(() => {
  wrapper?.destroy();
});
</script>
```

### Angular Integration

```typescript
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

@Component({
  selector: 'app-dirnav',
  template: '<div #container></div>'
})
export class DirnavComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;
  private wrapper: any = null;

  ngOnInit() {
    const tree = createDirTree({
      // your directory structure
    });

    this.wrapper = createShadowDOMWrapper(
      () => <DirnavUI initialTree={tree} />,
      { 
        hostElement: this.container.nativeElement,
        injectStyles: true
      }
    );
  }

  ngOnDestroy() {
    this.wrapper?.destroy();
  }
}
```

### Vanilla JavaScript Integration

```javascript
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

// Create directory tree
const tree = createDirTree({
  "home": {
    type: 'directory',
    children: {
      "documents": {
        type: 'directory',
        children: {
          "file1.txt": { 
            type: 'action', 
            action: () => alert('Opening file1.txt') 
          }
        }
      },
      "settings": {
        type: 'input',
        localStorageKey: 'app-settings'
      }
    }
  }
});

// Create and mount component
const wrapper = createShadowDOMWrapper(
  () => <DirnavUI initialTree={tree} />,
  {
    hostId: 'my-dirnav',
    attachToBody: true,
    injectStyles: true
  }
);

// Cleanup when needed
// wrapper.destroy();
```

### Userscript Integration

```javascript
// ==UserScript==
// @name         My Directory Navigator
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add directory navigation to any page
// @author       You
// @match        https://example.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Import the component (adjust path as needed)
    import('https://unpkg.com/solid-dirnav-ui@latest/dist/solid-dirnav-ui.es.js')
        .then(({ createShadowDOMWrapper, DirnavUI, createDirTree }) => {
            const tree = createDirTree({
                "bookmarks": {
                    type: 'directory',
                    children: {
                        "google": { 
                            type: 'action', 
                            action: () => window.open('https://google.com', '_blank') 
                        },
                        "github": { 
                            type: 'action', 
                            action: () => window.open('https://github.com', '_blank') 
                        }
                    }
                },
                "tools": {
                    type: 'directory',
                    children: {
                        "console": { 
                            type: 'action', 
                            action: () => console.log('Developer tools opened') 
                        }
                    }
                }
            });

            createShadowDOMWrapper(
                () => <DirnavUI initialTree={tree} />,
                {
                    hostId: 'userscript-dirnav',
                    attachToBody: true,
                    injectStyles: true
                }
            );
        });
})();
```

## 🎮 Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `Ctrl + `` | Toggle window visibility/focus | Global |
| `1-9` | Select directory item | Navigation |
| `Backspace` | Go back / Exit input mode | Navigation |
| `Escape` | Hide window / Cancel input | Global |
| `` ` `` | Open command palette | Navigation |
| `Arrow Up/Down` | Navigate search results | Command Palette |
| `Enter` | Select item / Save input | Command Palette/Input |

## 🏗️ Node Types

### Directory Node
Navigate to subdirectories with nested structure support.

```typescript
{
  type: 'directory',
  children: {
    "subdirectory": { /* nested structure */ }
  }
}
```

### Action Node
Execute custom functions when selected.

```typescript
{
  type: 'action',
  action: () => {
    console.log('Action executed!');
    // Your custom logic here
  }
}
```

### Input Node
Editable values with localStorage persistence.

```typescript
{
  type: 'input',
  localStorageKey: 'unique-storage-key',
  defaultValue: 'Initial value' // optional
}
```

### Virtual Directory Node
Dynamically load directory content from async sources.

```typescript
{
  type: 'virtual-directory',
  onSelect: async () => {
    try {
      const response = await fetch('/api/dynamic-content');
      const data = await response.json();
      return createDirTree(data);
    } catch (error) {
      console.error('Failed to load virtual directory:', error);
      // Return fallback content
      return createDirTree({
        "error": {
          type: 'action',
          action: () => alert('Failed to load content')
        }
      });
    }
  }
}
```

## 🎨 Theming

The component supports three theme modes accessible through the command palette:

- **Light Theme**: Explicit light theme
- **Dark Theme**: Explicit dark theme  
- **System Theme**: Follows system preference (default)

Access themes via command palette: `meta/theme/[light|dark|system]`

### Custom Styling

The component uses CSS custom properties for theming:

```css
/* Light theme variables */
:root {
  --bg-color: hsla(220, 13%, 95%, 1);
  --window-bg: hsla(0, 0%, 100%, 1);
  --window-border: hsla(0, 0%, 80%, 1);
  --text-color: hsla(0, 0%, 20%, 1);
  --focus-ring-color: hsla(210, 100%, 56%, 1);
}

/* Dark theme variables */
.dirnav-dark-mode {
  --window-bg: hsla(0, 0%, 17%, 1);
  --window-border: hsla(0, 0%, 33%, 1);
  --text-color: hsla(0, 0%, 93%, 1);
  --focus-ring-color: hsla(210, 100%, 56%, 1);
}
```

## 🔧 Configuration Options

### Shadow DOM Wrapper Options

```typescript
interface ShadowDOMWrapperOptions {
  hostId?: string;           // ID for the host element
  attachToBody?: boolean;    // Attach to document.body
  hostElement?: HTMLElement; // Specific host element
  injectStyles?: boolean;    // Inject component styles
  customStyles?: string;     // Additional custom styles
}
```

### Fuzzy Search Configuration

```typescript
const FUZZY_SEARCH_CONFIG = {
  maxResults: 50,           // Maximum search results
  minScore: 0.01,          // Minimum relevance score
  pathWeight: 0.4,         // Weight for path matching
  nameWeight: 0.6,         // Weight for name matching
  sequenceWeight: 2.0,     // Weight for sequence matching
  exactMatchBonus: 100,    // Bonus for exact matches
  prefixMatchBonus: 50,    // Bonus for prefix matches
};
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Component Not Appearing

**Problem**: The component doesn't show up after integration.

**Solutions**:
1. **Check Shadow DOM Support**: Ensure your browser supports Shadow DOM
   ```javascript
   if (!document.createElement('div').attachShadow) {
     console.error('Shadow DOM not supported');
   }
   ```

2. **Verify Container Element**: Ensure the host element exists
   ```javascript
   const container = document.getElementById('my-container');
   if (!container) {
     console.error('Container element not found');
   }
   ```

3. **Check Console for Errors**: Look for JavaScript errors in browser console

#### Keyboard Shortcuts Not Working

**Problem**: Global keyboard shortcuts (Ctrl+`) don't respond.

**Solutions**:
1. **Check Event Listener Conflicts**: Other scripts might be preventing event propagation
   ```javascript
   // Ensure events aren't being stopped
   document.addEventListener('keydown', (e) => {
     if (e.ctrlKey && e.key === '`') {
       e.stopPropagation(); // Remove this if present
     }
   });
   ```

2. **Verify Focus Management**: Component needs to be properly focused
3. **Check Browser Extensions**: Some extensions may interfere with keyboard events

#### Styling Conflicts

**Problem**: Component styling conflicts with host page styles.

**Solutions**:
1. **Use Shadow DOM**: Always use the shadow DOM wrapper for style isolation
   ```javascript
   // Correct approach
   createShadowDOMWrapper(component, { injectStyles: true });
   ```

2. **Check CSS Specificity**: Ensure host page styles aren't overriding component styles
3. **Custom CSS Properties**: Use CSS custom properties for theme customization

#### Virtual Directory Loading Issues

**Problem**: Virtual directories fail to load or show errors.

**Solutions**:
1. **Add Error Handling**: Always include try-catch in virtual directory loaders
   ```javascript
   {
     type: 'virtual-directory',
     onSelect: async () => {
       try {
         const data = await fetchData();
         return createDirTree(data);
       } catch (error) {
         console.error('Virtual directory error:', error);
         return createDirTree({
           "error": {
             type: 'action',
             action: () => alert('Failed to load: ' + error.message)
           }
         });
       }
     }
   }
   ```

2. **Check Network Requests**: Verify API endpoints are accessible
3. **Validate Response Format**: Ensure API responses match expected directory structure

#### Performance Issues

**Problem**: Component feels slow or unresponsive with large directory trees.

**Solutions**:
1. **Limit Directory Size**: Keep directories under 23 items per level
2. **Use Virtual Directories**: Load large datasets dynamically
3. **Optimize Search**: Reduce search scope for better performance
   ```javascript
   // Limit search results
   const searchConfig = {
     maxResults: 20,
     minScore: 0.1
   };
   ```

#### Memory Leaks

**Problem**: Component continues to consume memory after removal.

**Solutions**:
1. **Proper Cleanup**: Always call destroy() method
   ```javascript
   const wrapper = createShadowDOMWrapper(component);
   
   // Later, when component is no longer needed
   wrapper.destroy();
   ```

2. **Remove Event Listeners**: Ensure all event listeners are cleaned up
3. **Clear Timers**: Cancel any pending timeouts or intervals

#### Accessibility Issues

**Problem**: Screen readers or keyboard navigation not working properly.

**Solutions**:
1. **Check ARIA Labels**: Ensure proper ARIA attributes are present
2. **Test Tab Order**: Verify logical tab navigation
3. **Screen Reader Testing**: Test with actual screen reader software
4. **High Contrast Mode**: Verify component works in high contrast mode

#### Mobile/Touch Issues

**Problem**: Component doesn't work well on mobile devices.

**Solutions**:
1. **Touch Target Size**: Ensure touch targets are at least 44px
2. **Viewport Meta Tag**: Include proper viewport meta tag
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1">
   ```
3. **Touch Events**: Component should handle both mouse and touch events

### Debug Mode

Enable debug mode for additional logging:

```javascript
// Set debug flag before creating component
window.DIRNAV_DEBUG = true;

const wrapper = createShadowDOMWrapper(component);
```

### Getting Help

1. **Check Browser Console**: Look for error messages and warnings
2. **Verify Integration**: Ensure you're following the integration guide for your framework
3. **Test with Minimal Example**: Create a simple test case to isolate issues
4. **Check Browser Compatibility**: Verify your browser supports required features

## 📊 Performance Considerations

### Optimizations Implemented
- **Memoized Computations**: Directory flattening, pagination, breadcrumbs
- **Debounced Search**: 150ms delay to prevent excessive filtering
- **Throttled Navigation**: 100ms throttle to prevent rapid navigation issues
- **Lazy Loading**: Virtual directories loaded on demand
- **LRU Caching**: Search results and computed values cached

### Best Practices
1. **Limit Directory Size**: Keep directories under 23 items per level
2. **Use Virtual Directories**: For large or dynamic datasets
3. **Implement Proper Error Handling**: Always handle async operations
4. **Clean Up Resources**: Call destroy() when component is no longer needed

## 🌐 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Required Features**: Shadow DOM, CSS Custom Properties, ES2020+

## 📄 License

ISC License - see [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Add comprehensive JSDoc comments
3. Include unit tests for new features
4. Ensure accessibility compliance
5. Test across different browsers and devices

---

For detailed API documentation, see [API.md](./API.md).