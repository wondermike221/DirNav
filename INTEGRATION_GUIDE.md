# DirNav UI - Integration Guide

This guide provides detailed instructions for integrating DirNav UI into various frameworks and environments.

## Table of Contents

- [Framework Integrations](#framework-integrations)
  - [React](#react-integration)
  - [Vue 3](#vue-3-integration)
  - [Angular](#angular-integration)
  - [Svelte](#svelte-integration)
  - [Vanilla JavaScript](#vanilla-javascript)
- [Specialized Integrations](#specialized-integrations)
  - [Userscripts](#userscript-integration)
  - [Browser Extensions](#browser-extension-integration)
  - [Electron Apps](#electron-integration)
  - [Web Components](#web-components-integration)
- [Advanced Configuration](#advanced-configuration)
- [Best Practices](#best-practices)

## Framework Integrations

### React Integration

#### Basic Integration

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

interface DirnavWrapperProps {
  directoryData: any;
  onClose?: () => void;
}

const DirnavWrapper: React.FC<DirnavWrapperProps> = ({ directoryData, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (containerRef.current && directoryData && !wrapperRef.current) {
      try {
        const tree = createDirTree(directoryData);
        
        wrapperRef.current = createShadowDOMWrapper(
          () => <DirnavUI initialTree={tree} />,
          { 
            hostElement: containerRef.current,
            injectStyles: true
          }
        );
        
        setIsReady(true);
      } catch (error) {
        console.error('Failed to create DirNav component:', error);
      }
    }
    
    return () => {
      if (wrapperRef.current) {
        wrapperRef.current.destroy();
        wrapperRef.current = null;
        setIsReady(false);
      }
    };
  }, [directoryData]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative',
        minHeight: isReady ? 'auto' : '200px'
      }}
    />
  );
};

export default DirnavWrapper;
```

#### React Hook for DirNav

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

interface UseDirnavOptions {
  directoryData: any;
  hostElement?: HTMLElement;
  onError?: (error: Error) => void;
}

export const useDirnav = ({ directoryData, hostElement, onError }: UseDirnavOptions) => {
  const wrapperRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const initialize = useCallback(() => {
    const target = hostElement || containerRef.current;
    
    if (target && directoryData && !wrapperRef.current) {
      try {
        const tree = createDirTree(directoryData);
        
        wrapperRef.current = createShadowDOMWrapper(
          () => <DirnavUI initialTree={tree} />,
          { 
            hostElement: target,
            injectStyles: true
          }
        );
      } catch (error) {
        onError?.(error as Error);
      }
    }
  }, [directoryData, hostElement, onError]);
  
  const destroy = useCallback(() => {
    if (wrapperRef.current) {
      wrapperRef.current.destroy();
      wrapperRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    initialize();
    return destroy;
  }, [initialize, destroy]);
  
  return {
    containerRef,
    destroy,
    isInitialized: !!wrapperRef.current
  };
};
```

### Vue 3 Integration

#### Composition API

```vue
<template>
  <div ref="container" class="dirnav-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

interface Props {
  directoryData: any;
  autoMount?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoMount: true
});

const emit = defineEmits<{
  ready: [];
  error: [error: Error];
}>();

const container = ref<HTMLDivElement>();
let wrapper: any = null;

const initializeComponent = async () => {
  if (!container.value || !props.directoryData) return;
  
  try {
    await nextTick();
    
    const tree = createDirTree(props.directoryData);
    
    wrapper = createShadowDOMWrapper(
      () => <DirnavUI initialTree={tree} />,
      { 
        hostElement: container.value,
        injectStyles: true
      }
    );
    
    emit('ready');
  } catch (error) {
    emit('error', error as Error);
  }
};

const destroyComponent = () => {
  if (wrapper) {
    wrapper.destroy();
    wrapper = null;
  }
};

watch(() => props.directoryData, async (newData) => {
  if (newData) {
    destroyComponent();
    await initializeComponent();
  }
}, { deep: true });

onMounted(() => {
  if (props.autoMount) {
    initializeComponent();
  }
});

onUnmounted(() => {
  destroyComponent();
});

// Expose methods for parent component
defineExpose({
  initialize: initializeComponent,
  destroy: destroyComponent
});
</script>

<style scoped>
.dirnav-container {
  position: relative;
  min-height: 200px;
}
</style>
```

#### Options API

```vue
<template>
  <div ref="container" class="dirnav-container" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

export default defineComponent({
  name: 'DirnavComponent',
  props: {
    directoryData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      wrapper: null as any
    };
  },
  watch: {
    directoryData: {
      handler(newData) {
        if (newData) {
          this.destroyComponent();
          this.$nextTick(() => {
            this.initializeComponent();
          });
        }
      },
      deep: true
    }
  },
  mounted() {
    this.initializeComponent();
  },
  beforeUnmount() {
    this.destroyComponent();
  },
  methods: {
    initializeComponent() {
      if (!this.$refs.container || !this.directoryData) return;
      
      try {
        const tree = createDirTree(this.directoryData);
        
        this.wrapper = createShadowDOMWrapper(
          () => <DirnavUI initialTree={tree} />,
          { 
            hostElement: this.$refs.container as HTMLElement,
            injectStyles: true
          }
        );
        
        this.$emit('ready');
      } catch (error) {
        this.$emit('error', error);
      }
    },
    destroyComponent() {
      if (this.wrapper) {
        this.wrapper.destroy();
        this.wrapper = null;
      }
    }
  }
});
</script>
```

### Angular Integration

#### Component Implementation

```typescript
import { 
  Component, 
  ElementRef, 
  Input, 
  OnDestroy, 
  OnInit, 
  ViewChild,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

@Component({
  selector: 'app-dirnav',
  template: `
    <div #container class="dirnav-container"></div>
  `,
  styles: [`
    .dirnav-container {
      position: relative;
      min-height: 200px;
    }
  `]
})
export class DirnavComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;
  @Input() directoryData: any;
  @Input() autoMount: boolean = true;
  @Output() ready = new EventEmitter<void>();
  @Output() error = new EventEmitter<Error>();

  private wrapper: any = null;

  ngOnInit() {
    if (this.autoMount && this.directoryData) {
      this.initializeComponent();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['directoryData'] && !changes['directoryData'].firstChange) {
      this.destroyComponent();
      if (this.directoryData) {
        setTimeout(() => this.initializeComponent(), 0);
      }
    }
  }

  ngOnDestroy() {
    this.destroyComponent();
  }

  private initializeComponent() {
    if (!this.container?.nativeElement || !this.directoryData) return;

    try {
      const tree = createDirTree(this.directoryData);

      this.wrapper = createShadowDOMWrapper(
        () => <DirnavUI initialTree={tree} />,
        { 
          hostElement: this.container.nativeElement,
          injectStyles: true
        }
      );

      this.ready.emit();
    } catch (err) {
      this.error.emit(err as Error);
    }
  }

  private destroyComponent() {
    if (this.wrapper) {
      this.wrapper.destroy();
      this.wrapper = null;
    }
  }

  public initialize() {
    this.initializeComponent();
  }

  public destroy() {
    this.destroyComponent();
  }
}
```

#### Angular Service

```typescript
import { Injectable } from '@angular/core';
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

@Injectable({
  providedIn: 'root'
})
export class DirnavService {
  private instances = new Map<string, any>();

  createInstance(
    id: string, 
    directoryData: any, 
    hostElement: HTMLElement
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.instances.has(id)) {
          this.destroyInstance(id);
        }

        const tree = createDirTree(directoryData);
        
        const wrapper = createShadowDOMWrapper(
          () => <DirnavUI initialTree={tree} />,
          { 
            hostElement,
            injectStyles: true
          }
        );

        this.instances.set(id, wrapper);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  destroyInstance(id: string): void {
    const wrapper = this.instances.get(id);
    if (wrapper) {
      wrapper.destroy();
      this.instances.delete(id);
    }
  }

  destroyAllInstances(): void {
    this.instances.forEach((wrapper, id) => {
      wrapper.destroy();
    });
    this.instances.clear();
  }
}
```

### Svelte Integration

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

  export let directoryData: any;
  export let autoMount: boolean = true;

  let container: HTMLDivElement;
  let wrapper: any = null;
  let isReady: boolean = false;

  const initializeComponent = async () => {
    if (!container || !directoryData) return;

    try {
      const tree = createDirTree(directoryData);
      
      wrapper = createShadowDOMWrapper(
        () => <DirnavUI initialTree={tree} />,
        { 
          hostElement: container,
          injectStyles: true
        }
      );

      isReady = true;
    } catch (error) {
      console.error('Failed to initialize DirNav:', error);
    }
  };

  const destroyComponent = () => {
    if (wrapper) {
      wrapper.destroy();
      wrapper = null;
      isReady = false;
    }
  };

  $: if (directoryData) {
    destroyComponent();
    if (container) {
      setTimeout(initializeComponent, 0);
    }
  }

  onMount(() => {
    if (autoMount) {
      initializeComponent();
    }
  });

  onDestroy(() => {
    destroyComponent();
  });

  // Export functions for parent component
  export const initialize = initializeComponent;
  export const destroy = destroyComponent;
</script>

<div bind:this={container} class="dirnav-container" class:ready={isReady} />

<style>
  .dirnav-container {
    position: relative;
    min-height: 200px;
  }
  
  .dirnav-container.ready {
    min-height: auto;
  }
</style>
```

### Vanilla JavaScript

#### ES Modules

```javascript
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

class DirnavManager {
  constructor() {
    this.instances = new Map();
  }

  create(id, directoryData, options = {}) {
    try {
      // Destroy existing instance if it exists
      if (this.instances.has(id)) {
        this.destroy(id);
      }

      const tree = createDirTree(directoryData);
      
      const wrapper = createShadowDOMWrapper(
        () => <DirnavUI initialTree={tree} />,
        {
          hostId: options.hostId || `dirnav-${id}`,
          attachToBody: options.attachToBody !== false,
          injectStyles: options.injectStyles !== false,
          ...options
        }
      );

      this.instances.set(id, wrapper);
      return wrapper;
    } catch (error) {
      console.error(`Failed to create DirNav instance "${id}":`, error);
      throw error;
    }
  }

  destroy(id) {
    const wrapper = this.instances.get(id);
    if (wrapper) {
      wrapper.destroy();
      this.instances.delete(id);
      return true;
    }
    return false;
  }

  destroyAll() {
    this.instances.forEach((wrapper, id) => {
      wrapper.destroy();
    });
    this.instances.clear();
  }

  get(id) {
    return this.instances.get(id);
  }

  has(id) {
    return this.instances.has(id);
  }

  list() {
    return Array.from(this.instances.keys());
  }
}

// Usage
const dirnavManager = new DirnavManager();

const directoryData = {
  "home": {
    type: 'directory',
    children: {
      "documents": {
        type: 'directory',
        children: {
          "file1.txt": { 
            type: 'action', 
            action: () => console.log('Opening file1.txt') 
          }
        }
      }
    }
  }
};

// Create instance
const wrapper = dirnavManager.create('main', directoryData, {
  attachToBody: true,
  hostId: 'my-dirnav'
});

// Later, destroy instance
// dirnavManager.destroy('main');
```

#### UMD/Script Tag

```html
<!DOCTYPE html>
<html>
<head>
  <title>DirNav Integration</title>
</head>
<body>
  <div id="dirnav-container"></div>
  
  <script src="https://unpkg.com/solid-dirnav-ui@latest/dist/solid-dirnav-ui.umd.js"></script>
  <script>
    const { createShadowDOMWrapper, DirnavUI, createDirTree } = SolidDirnavUI;
    
    const directoryData = {
      "home": {
        type: 'directory',
        children: {
          "documents": {
            type: 'action',
            action: () => alert('Documents clicked!')
          }
        }
      }
    };

    try {
      const tree = createDirTree(directoryData);
      const container = document.getElementById('dirnav-container');
      
      const wrapper = createShadowDOMWrapper(
        () => DirnavUI({ initialTree: tree }),
        { 
          hostElement: container,
          injectStyles: true
        }
      );
      
      console.log('DirNav initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DirNav:', error);
    }
  </script>
</body>
</html>
```

## Specialized Integrations

### Userscript Integration

#### Tampermonkey/Greasemonkey

```javascript
// ==UserScript==
// @name         DirNav Userscript
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add directory navigation to any page
// @author       You
// @match        https://example.com/*
// @grant        none
// @require      https://unpkg.com/solid-dirnav-ui@latest/dist/solid-dirnav-ui.umd.js
// ==/UserScript==

(function() {
    'use strict';
    
    const { createShadowDOMWrapper, DirnavUI, createDirTree } = window.SolidDirnavUI;
    
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDirnav);
    } else {
        initDirnav();
    }
    
    function initDirnav() {
        const directoryData = {
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
            "page_tools": {
                type: 'directory',
                children: {
                    "scroll_to_top": { 
                        type: 'action', 
                        action: () => window.scrollTo(0, 0) 
                    },
                    "print_page": { 
                        type: 'action', 
                        action: () => window.print() 
                    }
                }
            },
            "settings": {
                type: 'directory',
                children: {
                    "auto_scroll": {
                        type: 'input',
                        localStorageKey: 'userscript-auto-scroll',
                        defaultValue: 'false'
                    }
                }
            }
        };

        try {
            const tree = createDirTree(directoryData);
            
            createShadowDOMWrapper(
                () => DirnavUI({ initialTree: tree }),
                {
                    hostId: 'userscript-dirnav',
                    attachToBody: true,
                    injectStyles: true
                }
            );
            
            console.log('DirNav userscript loaded successfully');
        } catch (error) {
            console.error('Failed to load DirNav userscript:', error);
        }
    }
})();
```

### Browser Extension Integration

#### Manifest V3 Content Script

```javascript
// content-script.js
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';

class ExtensionDirnav {
  constructor() {
    this.wrapper = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Get directory data from extension storage
      const result = await chrome.storage.sync.get(['dirnavData']);
      const directoryData = result.dirnavData || this.getDefaultData();

      const tree = createDirTree(directoryData);
      
      this.wrapper = createShadowDOMWrapper(
        () => <DirnavUI initialTree={tree} />,
        {
          hostId: 'extension-dirnav',
          attachToBody: true,
          injectStyles: true
        }
      );

      this.isInitialized = true;
      
      // Listen for messages from popup/background
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
      
    } catch (error) {
      console.error('Failed to initialize extension DirNav:', error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'toggle':
        // Toggle visibility logic here
        break;
      case 'updateData':
        this.updateDirectoryData(request.data);
        break;
    }
  }

  updateDirectoryData(newData) {
    if (this.wrapper) {
      this.wrapper.destroy();
      this.isInitialized = false;
    }
    
    // Reinitialize with new data
    setTimeout(() => this.initialize(), 100);
  }

  getDefaultData() {
    return {
      "extension_tools": {
        type: 'directory',
        children: {
          "open_options": {
            type: 'action',
            action: () => chrome.runtime.openOptionsPage()
          }
        }
      }
    };
  }

  destroy() {
    if (this.wrapper) {
      this.wrapper.destroy();
      this.wrapper = null;
      this.isInitialized = false;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const extensionDirnav = new ExtensionDirnav();
    extensionDirnav.initialize();
  });
} else {
  const extensionDirnav = new ExtensionDirnav();
  extensionDirnav.initialize();
}
```

### Electron Integration

```typescript
// renderer.ts
import { createShadowDOMWrapper, DirnavUI, createDirTree } from 'solid-dirnav-ui';
import { ipcRenderer } from 'electron';

class ElectronDirnav {
  private wrapper: any = null;

  async initialize() {
    try {
      // Get directory data from main process
      const directoryData = await ipcRenderer.invoke('get-dirnav-data');
      
      const tree = createDirTree(directoryData);
      
      this.wrapper = createShadowDOMWrapper(
        () => <DirnavUI initialTree={tree} />,
        {
          hostId: 'electron-dirnav',
          attachToBody: true,
          injectStyles: true
        }
      );

      // Listen for updates from main process
      ipcRenderer.on('dirnav-data-updated', (event, newData) => {
        this.updateData(newData);
      });

    } catch (error) {
      console.error('Failed to initialize Electron DirNav:', error);
    }
  }

  updateData(newData: any) {
    if (this.wrapper) {
      this.wrapper.destroy();
    }
    
    setTimeout(() => {
      const tree = createDirTree(newData);
      this.wrapper = createShadowDOMWrapper(
        () => <DirnavUI initialTree={tree} />,
        {
          hostId: 'electron-dirnav',
          attachToBody: true,
          injectStyles: true
        }
      );
    }, 100);
  }

  destroy() {
    if (this.wrapper) {
      this.wrapper.destroy();
      this.wrapper = null;
    }
  }
}

// Initialize
const electronDirnav = new ElectronDirnav();
electronDirnav.initialize();
```

### Web Components Integration

```typescript
class DirnavWebComponent extends HTMLElement {
  private wrapper: any = null;
  private directoryData: any = null;

  static get observedAttributes() {
    return ['directory-data'];
  }

  connectedCallback() {
    this.initialize();
  }

  disconnectedCallback() {
    this.destroy();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'directory-data' && newValue !== oldValue) {
      try {
        this.directoryData = JSON.parse(newValue);
        this.reinitialize();
      } catch (error) {
        console.error('Invalid directory data:', error);
      }
    }
  }

  private async initialize() {
    if (!this.directoryData) {
      // Try to get data from attribute
      const dataAttr = this.getAttribute('directory-data');
      if (dataAttr) {
        try {
          this.directoryData = JSON.parse(dataAttr);
        } catch (error) {
          console.error('Invalid directory data in attribute:', error);
          return;
        }
      } else {
        return;
      }
    }

    try {
      const tree = createDirTree(this.directoryData);
      
      this.wrapper = createShadowDOMWrapper(
        () => <DirnavUI initialTree={tree} />,
        {
          hostElement: this,
          injectStyles: true
        }
      );

      this.dispatchEvent(new CustomEvent('dirnav-ready'));
    } catch (error) {
      console.error('Failed to initialize DirNav web component:', error);
      this.dispatchEvent(new CustomEvent('dirnav-error', { detail: error }));
    }
  }

  private reinitialize() {
    this.destroy();
    setTimeout(() => this.initialize(), 0);
  }

  private destroy() {
    if (this.wrapper) {
      this.wrapper.destroy();
      this.wrapper = null;
    }
  }

  // Public API
  public updateData(newData: any) {
    this.directoryData = newData;
    this.reinitialize();
  }
}

// Register the web component
customElements.define('dirnav-ui', DirnavWebComponent);
```

## Advanced Configuration

### Custom Shadow DOM Options

```typescript
const advancedOptions = {
  hostId: 'my-dirnav',
  attachToBody: false,
  hostElement: document.getElementById('custom-container'),
  injectStyles: true,
  customStyles: `
    :host {
      --bg-color: #f0f0f0;
      --text-color: #333;
    }
  `
};

const wrapper = createShadowDOMWrapper(
  () => <DirnavUI initialTree={tree} />,
  advancedOptions
);
```

### Performance Optimization

```typescript
// Configure fuzzy search for better performance
const optimizedTree = createDirTree(directoryData, {
  fuzzySearchConfig: {
    maxResults: 20,
    minScore: 0.1,
    pathWeight: 0.3,
    nameWeight: 0.7
  }
});

// Use lazy loading for large datasets
const lazyDirectoryData = {
  "large_dataset": {
    type: 'virtual-directory',
    onSelect: async () => {
      // Load data on demand
      const response = await fetch('/api/large-dataset');
      return createDirTree(await response.json());
    }
  }
};
```

## Best Practices

### 1. Error Handling

Always wrap initialization in try-catch blocks:

```typescript
try {
  const tree = createDirTree(directoryData);
  const wrapper = createShadowDOMWrapper(
    () => <DirnavUI initialTree={tree} />,
    options
  );
} catch (error) {
  console.error('DirNav initialization failed:', error);
  // Handle error appropriately
}
```

### 2. Memory Management

Always clean up when components are destroyed:

```typescript
// In component cleanup/unmount
if (wrapper) {
  wrapper.destroy();
  wrapper = null;
}
```

### 3. Data Validation

Validate directory data before creating trees:

```typescript
import { validateDirectoryTree } from 'solid-dirnav-ui';

const validation = validateDirectoryTree(directoryData);
if (!validation.isValid) {
  console.error('Invalid directory structure:', validation.errors);
  return;
}
```

### 4. Performance Considerations

- Limit directory sizes to 23 items per level
- Use virtual directories for large datasets
- Implement proper error boundaries
- Clean up resources properly

### 5. Accessibility

- Ensure proper focus management
- Test with screen readers
- Verify keyboard navigation works
- Check high contrast mode compatibility

### 6. Testing

Test your integration across different:
- Browsers and versions
- Screen sizes and orientations
- Input methods (mouse, keyboard, touch)
- Accessibility tools

This integration guide should help you successfully implement DirNav UI in your specific environment. For additional help, refer to the main documentation and API reference.