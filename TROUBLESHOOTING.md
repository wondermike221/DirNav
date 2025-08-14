# DirNav UI - Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using DirNav UI.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Installation Issues](#installation-issues)
- [Component Not Appearing](#component-not-appearing)
- [Keyboard Shortcuts Not Working](#keyboard-shortcuts-not-working)
- [Styling and Layout Issues](#styling-and-layout-issues)
- [Virtual Directory Problems](#virtual-directory-problems)
- [Performance Issues](#performance-issues)
- [Memory Leaks](#memory-leaks)
- [Accessibility Issues](#accessibility-issues)
- [Mobile and Touch Issues](#mobile-and-touch-issues)
- [Framework-Specific Issues](#framework-specific-issues)
- [Browser Compatibility](#browser-compatibility)
- [Debug Mode](#debug-mode)
- [Getting Help](#getting-help)

## Quick Diagnostics

### Basic Health Check

Run this diagnostic script in your browser console:

```javascript
// DirNav Health Check
function dirnavHealthCheck() {
  const results = {
    shadowDOMSupport: !!document.createElement('div').attachShadow,
    solidJSLoaded: typeof window.SolidJS !== 'undefined',
    dirnavLoaded: typeof window.SolidDirnavUI !== 'undefined',
    activeInstances: document.querySelectorAll('[id*="dirnav"]').length,
    errors: []
  };
  
  // Check for common issues
  if (!results.shadowDOMSupport) {
    results.errors.push('Shadow DOM not supported in this browser');
  }
  
  if (!results.dirnavLoaded) {
    results.errors.push('DirNav UI library not loaded');
  }
  
  // Check for conflicting styles
  const conflictingStyles = Array.from(document.styleSheets).some(sheet => {
    try {
      return Array.from(sheet.cssRules).some(rule => 
        rule.selectorText && rule.selectorText.includes('dirnav')
      );
    } catch (e) {
      return false;
    }
  });
  
  if (conflictingStyles) {
    results.errors.push('Potential CSS conflicts detected');
  }
  
  console.log('DirNav Health Check Results:', results);
  return results;
}

dirnavHealthCheck();
```

### Environment Check

```javascript
// Environment compatibility check
function checkEnvironment() {
  const features = {
    shadowDOM: 'attachShadow' in Element.prototype,
    customElements: 'customElements' in window,
    es6Modules: 'noModule' in HTMLScriptElement.prototype,
    cssCustomProperties: CSS.supports('color', 'var(--test)'),
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window
  };
  
  const missing = Object.entries(features)
    .filter(([key, supported]) => !supported)
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.warn('Missing browser features:', missing);
  } else {
    console.log('All required browser features supported');
  }
  
  return features;
}

checkEnvironment();
```

## Installation Issues

### NPM Installation Problems

**Problem**: Package installation fails or shows version conflicts.

**Solutions**:

1. **Clear NPM Cache**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node Version**:
   ```bash
   node --version  # Should be 16+ for best compatibility
   npm --version   # Should be 8+
   ```

3. **Use Specific Version**:
   ```bash
   npm install solid-dirnav-ui@latest
   ```

4. **Peer Dependency Issues**:
   ```bash
   npm install solid-js@^1.9.0  # Install required peer dependency
   ```

### CDN Loading Issues

**Problem**: Component doesn't load from CDN.

**Solutions**:

1. **Check Network Tab**: Verify the CDN URL is accessible
2. **Use Alternative CDNs**:
   ```html
   <!-- Try different CDNs -->
   <script src="https://unpkg.com/solid-dirnav-ui@latest/dist/solid-dirnav-ui.umd.js"></script>
   <script src="https://cdn.jsdelivr.net/npm/solid-dirnav-ui@latest/dist/solid-dirnav-ui.umd.js"></script>
   ```

3. **CORS Issues**: Host the files locally if CDN is blocked

## Component Not Appearing

### Shadow DOM Issues

**Problem**: Component initializes but doesn't appear visually.

**Diagnostic Steps**:

```javascript
// Check if shadow DOM was created
function checkShadowDOM() {
  const hosts = document.querySelectorAll('[id*="dirnav"]');
  hosts.forEach(host => {
    console.log('Host element:', host);
    console.log('Has shadow root:', !!host.shadowRoot);
    if (host.shadowRoot) {
      console.log('Shadow root children:', host.shadowRoot.children.length);
      console.log('Shadow root HTML:', host.shadowRoot.innerHTML.substring(0, 200));
    }
  });
}

checkShadowDOM();
```

**Solutions**:

1. **Verify Container Element**:
   ```javascript
   const container = document.getElementById('my-container');
   if (!container) {
     console.error('Container element not found');
   }
   ```

2. **Check Shadow DOM Support**:
   ```javascript
   if (!document.createElement('div').attachShadow) {
     console.error('Shadow DOM not supported');
     // Use polyfill or fallback
   }
   ```

3. **Ensure Styles Are Injected**:
   ```javascript
   const wrapper = createShadowDOMWrapper(component, {
     injectStyles: true  // Make sure this is true
   });
   ```

### CSS Display Issues

**Problem**: Component exists in DOM but has no visual presence.

**Solutions**:

1. **Check CSS Display Properties**:
   ```javascript
   // Check computed styles
   const host = document.querySelector('[id*="dirnav"]');
   if (host) {
     const styles = getComputedStyle(host);
     console.log('Display:', styles.display);
     console.log('Visibility:', styles.visibility);
     console.log('Opacity:', styles.opacity);
     console.log('Z-index:', styles.zIndex);
   }
   ```

2. **Force Visibility**:
   ```css
   [id*="dirnav"] {
     display: block !important;
     visibility: visible !important;
     opacity: 1 !important;
     z-index: 9999 !important;
   }
   ```

3. **Check Parent Container**:
   ```javascript
   // Ensure parent has proper dimensions
   const container = document.getElementById('container');
   container.style.minHeight = '200px';
   container.style.position = 'relative';
   ```

### Timing Issues

**Problem**: Component initializes before DOM is ready.

**Solutions**:

1. **Wait for DOM Ready**:
   ```javascript
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', initDirnav);
   } else {
     initDirnav();
   }
   ```

2. **Use MutationObserver**:
   ```javascript
   const observer = new MutationObserver((mutations) => {
     const target = document.getElementById('target');
     if (target) {
       initDirnav();
       observer.disconnect();
     }
   });
   
   observer.observe(document.body, { childList: true, subtree: true });
   ```

## Keyboard Shortcuts Not Working

### Global Event Conflicts

**Problem**: Ctrl+` or other shortcuts don't respond.

**Diagnostic**:

```javascript
// Test keyboard event handling
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === '`') {
    console.log('Ctrl+` detected, prevented:', e.defaultPrevented);
    console.log('Event target:', e.target);
    console.log('Active element:', document.activeElement);
  }
});
```

**Solutions**:

1. **Check Event Propagation**:
   ```javascript
   // Remove event stoppers
   document.addEventListener('keydown', (e) => {
     if (e.ctrlKey && e.key === '`') {
       // Don't call e.stopPropagation() or e.preventDefault()
     }
   });
   ```

2. **Verify Focus State**:
   ```javascript
   // Ensure component can receive focus
   const host = document.querySelector('[id*="dirnav"]');
   if (host && host.shadowRoot) {
     const focusable = host.shadowRoot.querySelector('[tabindex]');
     if (focusable) {
       focusable.focus();
     }
   }
   ```

3. **Browser Extension Conflicts**:
   - Disable browser extensions temporarily
   - Check for extensions that might intercept keyboard events

### Shadow DOM Event Issues

**Problem**: Events don't cross shadow DOM boundaries properly.

**Solutions**:

1. **Use Composed Events**:
   ```javascript
   // Ensure events are composed
   const event = new KeyboardEvent('keydown', {
     key: '`',
     ctrlKey: true,
     bubbles: true,
     composed: true  // Important for shadow DOM
   });
   ```

2. **Manual Event Forwarding**:
   ```javascript
   // Forward events from document to shadow DOM
   document.addEventListener('keydown', (e) => {
     const host = document.querySelector('[id*="dirnav"]');
     if (host && host.shadowRoot) {
       const event = new KeyboardEvent(e.type, e);
       host.shadowRoot.dispatchEvent(event);
     }
   });
   ```

## Styling and Layout Issues

### CSS Conflicts

**Problem**: Host page styles interfere with component styling.

**Diagnostic**:

```javascript
// Check for style conflicts
function checkStyleConflicts() {
  const host = document.querySelector('[id*="dirnav"]');
  if (host && host.shadowRoot) {
    const styles = getComputedStyle(host);
    console.log('Host styles:', {
      position: styles.position,
      zIndex: styles.zIndex,
      display: styles.display
    });
    
    const inner = host.shadowRoot.querySelector('.dirnav-window');
    if (inner) {
      const innerStyles = getComputedStyle(inner);
      console.log('Inner styles:', {
        position: innerStyles.position,
        zIndex: innerStyles.zIndex,
        display: innerStyles.display
      });
    }
  }
}

checkStyleConflicts();
```

**Solutions**:

1. **Ensure Shadow DOM Isolation**:
   ```javascript
   const wrapper = createShadowDOMWrapper(component, {
     injectStyles: true,  // Inject component styles
     customStyles: `
       :host {
         all: initial;  /* Reset all inherited styles */
         display: block;
       }
     `
   });
   ```

2. **Override Conflicting Styles**:
   ```css
   [id*="dirnav"] {
     all: unset !important;
     display: block !important;
     position: fixed !important;
     z-index: 999999 !important;
   }
   ```

### Theme Issues

**Problem**: Dark/light theme not applying correctly.

**Solutions**:

1. **Check Theme Detection**:
   ```javascript
   // Test theme detection
   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
   console.log('System prefers dark:', prefersDark);
   
   const stored = localStorage.getItem('dirnav-component-theme-preference');
   console.log('Stored theme:', stored);
   ```

2. **Force Theme Application**:
   ```javascript
   // Manually apply theme
   const host = document.querySelector('[id*="dirnav"]');
   if (host) {
     host.classList.add('dirnav-dark-mode');  // or remove for light
   }
   ```

### Responsive Issues

**Problem**: Component doesn't resize properly on mobile.

**Solutions**:

1. **Check Viewport Meta Tag**:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1">
   ```

2. **Test Responsive Behavior**:
   ```javascript
   // Test different viewport sizes
   function testResponsive() {
     const sizes = [
       { width: 320, height: 568 },  // iPhone SE
       { width: 768, height: 1024 }, // iPad
       { width: 1920, height: 1080 } // Desktop
     ];
     
     sizes.forEach(size => {
       window.resizeTo(size.width, size.height);
       setTimeout(() => {
         const host = document.querySelector('[id*="dirnav"]');
         if (host) {
           const rect = host.getBoundingClientRect();
           console.log(`${size.width}x${size.height}:`, rect);
         }
       }, 100);
     });
   }
   ```

## Virtual Directory Problems

### Loading Failures

**Problem**: Virtual directories fail to load or show errors.

**Diagnostic**:

```javascript
// Test virtual directory loading
async function testVirtualDirectory() {
  const testLoader = async () => {
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      console.log('Virtual directory data:', data);
      return createDirTree(data);
    } catch (error) {
      console.error('Virtual directory error:', error);
      throw error;
    }
  };
  
  try {
    const result = await testLoader();
    console.log('Virtual directory loaded successfully:', result);
  } catch (error) {
    console.error('Virtual directory test failed:', error);
  }
}

testVirtualDirectory();
```

**Solutions**:

1. **Add Comprehensive Error Handling**:
   ```javascript
   {
     type: 'virtual-directory',
     onSelect: async () => {
       try {
         const response = await fetch('/api/data', {
           timeout: 10000,  // 10 second timeout
           headers: {
             'Content-Type': 'application/json'
           }
         });
         
         if (!response.ok) {
           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
         }
         
         const data = await response.json();
         
         // Validate data structure
         if (!data || typeof data !== 'object') {
           throw new Error('Invalid data format received');
         }
         
         return createDirTree(data);
       } catch (error) {
         console.error('Virtual directory loading failed:', error);
         
         // Return fallback content
         return createDirTree({
           "error": {
             type: 'action',
             action: () => alert(`Failed to load: ${error.message}`)
           },
           "retry": {
             type: 'virtual-directory',
             onSelect: async () => {
               // Retry logic here
               return this.onSelect();
             }
           }
         });
       }
     }
   }
   ```

2. **Implement Retry Logic**:
   ```javascript
   async function withRetry(fn, maxRetries = 3, delay = 1000) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
       }
     }
   }
   ```

### CORS Issues

**Problem**: Virtual directories fail due to CORS restrictions.

**Solutions**:

1. **Check CORS Headers**:
   ```javascript
   // Test CORS
   fetch('/api/test', { method: 'OPTIONS' })
     .then(response => {
       console.log('CORS headers:', {
         'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
         'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods')
       });
     });
   ```

2. **Use Proxy or JSONP**:
   ```javascript
   // Proxy approach
   const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
   const response = await fetch(proxyUrl + targetUrl);
   ```

## Performance Issues

### Slow Rendering

**Problem**: Component takes too long to render or respond.

**Diagnostic**:

```javascript
// Performance monitoring
function monitorPerformance() {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('dirnav')) {
        console.log('Performance entry:', entry);
      }
    });
  });
  
  observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
  
  // Measure component initialization
  performance.mark('dirnav-start');
  // ... initialize component ...
  performance.mark('dirnav-end');
  performance.measure('dirnav-init', 'dirnav-start', 'dirnav-end');
}
```

**Solutions**:

1. **Optimize Directory Structure**:
   ```javascript
   // Limit directory sizes
   function validateDirectorySize(tree, path = '') {
     Object.entries(tree).forEach(([key, node]) => {
       const currentPath = path ? `${path}/${key}` : key;
       
       if (node.type === 'directory' && node.children) {
         const childCount = Object.keys(node.children).length;
         if (childCount > 23) {
           console.warn(`Directory ${currentPath} has ${childCount} items (max 23)`);
         }
         validateDirectorySize(node.children, currentPath);
       }
     });
   }
   ```

2. **Use Virtual Directories for Large Datasets**:
   ```javascript
   // Convert large directories to virtual ones
   const largeDirectory = {
     type: 'virtual-directory',
     onSelect: async () => {
       // Load subset of data
       const page = 0;
       const pageSize = 20;
       const response = await fetch(`/api/data?page=${page}&size=${pageSize}`);
       return createDirTree(await response.json());
     }
   };
   ```

### Memory Usage

**Problem**: High memory consumption or memory leaks.

**Diagnostic**:

```javascript
// Monitor memory usage
function monitorMemory() {
  if (performance.memory) {
    const memory = performance.memory;
    console.log('Memory usage:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
    });
  }
}

// Check periodically
setInterval(monitorMemory, 5000);
```

**Solutions**:

1. **Proper Cleanup**:
   ```javascript
   // Always clean up
   class ComponentManager {
     constructor() {
       this.instances = new Map();
     }
     
     create(id, data) {
       // Clean up existing instance
       if (this.instances.has(id)) {
         this.destroy(id);
       }
       
       const wrapper = createShadowDOMWrapper(/* ... */);
       this.instances.set(id, wrapper);
       return wrapper;
     }
     
     destroy(id) {
       const wrapper = this.instances.get(id);
       if (wrapper) {
         wrapper.destroy();
         this.instances.delete(id);
       }
     }
     
     destroyAll() {
       this.instances.forEach((wrapper, id) => {
         wrapper.destroy();
       });
       this.instances.clear();
     }
   }
   ```

## Memory Leaks

### Event Listener Leaks

**Problem**: Event listeners not being removed properly.

**Diagnostic**:

```javascript
// Monitor event listeners
function countEventListeners() {
  const elements = document.querySelectorAll('*');
  let count = 0;
  
  elements.forEach(el => {
    const listeners = getEventListeners(el);  // Chrome DevTools only
    if (listeners) {
      Object.keys(listeners).forEach(type => {
        count += listeners[type].length;
      });
    }
  });
  
  console.log('Total event listeners:', count);
}
```

**Solutions**:

1. **Use AbortController**:
   ```javascript
   class EventManager {
     constructor() {
       this.controller = new AbortController();
     }
     
     addEventListener(target, type, handler, options = {}) {
       target.addEventListener(type, handler, {
         ...options,
         signal: this.controller.signal
       });
     }
     
     destroy() {
       this.controller.abort();
     }
   }
   ```

2. **Manual Cleanup**:
   ```javascript
   class ComponentWithCleanup {
     constructor() {
       this.eventListeners = [];
     }
     
     addEventListener(target, type, handler, options) {
       target.addEventListener(type, handler, options);
       this.eventListeners.push({ target, type, handler, options });
     }
     
     destroy() {
       this.eventListeners.forEach(({ target, type, handler, options }) => {
         target.removeEventListener(type, handler, options);
       });
       this.eventListeners = [];
     }
   }
   ```

## Accessibility Issues

### Screen Reader Problems

**Problem**: Screen readers can't navigate the component properly.

**Diagnostic**:

```javascript
// Check ARIA attributes
function checkAccessibility() {
  const host = document.querySelector('[id*="dirnav"]');
  if (host && host.shadowRoot) {
    const elements = host.shadowRoot.querySelectorAll('*');
    elements.forEach(el => {
      const aria = Array.from(el.attributes)
        .filter(attr => attr.name.startsWith('aria-'))
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');
      
      if (aria) {
        console.log(el.tagName, aria);
      }
    });
  }
}
```

**Solutions**:

1. **Add Missing ARIA Labels**:
   ```javascript
   // Ensure proper ARIA attributes
   const elements = shadowRoot.querySelectorAll('[role], button, input');
   elements.forEach(el => {
     if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
       console.warn('Missing aria-label:', el);
     }
   });
   ```

2. **Test with Screen Reader**:
   - Use NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
   - Test keyboard navigation
   - Verify announcements are clear

### Keyboard Navigation Issues

**Problem**: Tab order is incorrect or elements aren't focusable.

**Solutions**:

1. **Check Tab Order**:
   ```javascript
   // Test tab order
   function testTabOrder() {
     const focusable = Array.from(document.querySelectorAll(
       'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
     ));
     
     focusable.forEach((el, index) => {
       console.log(`Tab ${index}:`, el, 'tabindex:', el.tabIndex);
     });
   }
   ```

2. **Fix Focus Management**:
   ```javascript
   // Ensure proper focus management
   const focusableElements = shadowRoot.querySelectorAll(
     'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
   );
   
   focusableElements.forEach((el, index) => {
     el.tabIndex = index;
   });
   ```

## Mobile and Touch Issues

### Touch Events Not Working

**Problem**: Component doesn't respond to touch events on mobile.

**Solutions**:

1. **Add Touch Event Handlers**:
   ```javascript
   // Ensure touch events are handled
   element.addEventListener('touchstart', handleTouchStart, { passive: false });
   element.addEventListener('touchmove', handleTouchMove, { passive: false });
   element.addEventListener('touchend', handleTouchEnd, { passive: false });
   ```

2. **Test Touch Targets**:
   ```javascript
   // Verify touch target sizes
   function checkTouchTargets() {
     const buttons = document.querySelectorAll('button');
     buttons.forEach(button => {
       const rect = button.getBoundingClientRect();
       const size = Math.min(rect.width, rect.height);
       if (size < 44) {
         console.warn('Touch target too small:', button, `${size}px`);
       }
     });
   }
   ```

### Viewport Issues

**Problem**: Component doesn't scale properly on mobile devices.

**Solutions**:

1. **Check Viewport Meta Tag**:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
   ```

2. **Use Responsive Units**:
   ```css
   .dirnav-window {
     width: min(90vw, 400px);
     height: min(70vh, 500px);
   }
   ```

## Framework-Specific Issues

### React Issues

**Problem**: Component doesn't update when props change.

**Solutions**:

1. **Use useEffect Dependencies**:
   ```javascript
   useEffect(() => {
     // Reinitialize when data changes
     if (wrapper) {
       wrapper.destroy();
     }
     initializeComponent();
   }, [directoryData]); // Add dependency
   ```

2. **Handle React Strict Mode**:
   ```javascript
   useEffect(() => {
     let mounted = true;
     
     if (mounted) {
       initializeComponent();
     }
     
     return () => {
       mounted = false;
       if (wrapper) {
         wrapper.destroy();
       }
     };
   }, []);
   ```

### Vue Issues

**Problem**: Component doesn't clean up properly in Vue.

**Solutions**:

1. **Use Proper Lifecycle Hooks**:
   ```javascript
   // Vue 3 Composition API
   onBeforeUnmount(() => {
     if (wrapper) {
       wrapper.destroy();
       wrapper = null;
     }
   });
   
   // Vue 2 Options API
   beforeDestroy() {
     if (this.wrapper) {
       this.wrapper.destroy();
       this.wrapper = null;
     }
   }
   ```

### Angular Issues

**Problem**: Change detection doesn't work with shadow DOM.

**Solutions**:

1. **Use NgZone**:
   ```typescript
   constructor(private ngZone: NgZone) {}
   
   initializeComponent() {
     this.ngZone.runOutsideAngular(() => {
       // Initialize component outside Angular's change detection
       this.wrapper = createShadowDOMWrapper(/* ... */);
     });
   }
   ```

## Browser Compatibility

### Safari Issues

**Problem**: Component doesn't work properly in Safari.

**Solutions**:

1. **Check Safari-Specific Features**:
   ```javascript
   // Test Safari compatibility
   const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
   if (isSafari) {
     console.log('Safari detected, applying workarounds');
     // Apply Safari-specific fixes
   }
   ```

2. **Polyfills for Older Browsers**:
   ```html
   <script src="https://polyfill.io/v3/polyfill.min.js?features=es6,Array.prototype.includes,CustomEvent"></script>
   ```

### Internet Explorer Issues

**Problem**: Component doesn't work in IE11.

**Note**: DirNav UI requires modern browser features and doesn't support IE11. Consider using a polyfill or alternative solution.

## Debug Mode

### Enable Debug Logging

```javascript
// Enable debug mode
window.DIRNAV_DEBUG = true;

// Or set via localStorage
localStorage.setItem('dirnav-debug', 'true');

// Custom debug function
function debugDirnav(message, data) {
  if (window.DIRNAV_DEBUG || localStorage.getItem('dirnav-debug')) {
    console.log(`[DirNav Debug] ${message}`, data);
  }
}
```

### Debug Information Collection

```javascript
// Collect debug information
function collectDebugInfo() {
  const info = {
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    features: {
      shadowDOM: 'attachShadow' in Element.prototype,
      customElements: 'customElements' in window,
      intersectionObserver: 'IntersectionObserver' in window
    },
    dirnavInstances: document.querySelectorAll('[id*="dirnav"]').length,
    errors: [],
    performance: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1048576),
      total: Math.round(performance.memory.totalJSHeapSize / 1048576)
    } : null
  };
  
  console.log('Debug Info:', info);
  return info;
}
```

## Getting Help

### Before Asking for Help

1. **Check Browser Console**: Look for error messages
2. **Run Diagnostics**: Use the health check scripts above
3. **Test Minimal Example**: Create a simple reproduction case
4. **Check Documentation**: Review API docs and integration guide
5. **Search Issues**: Look for similar problems in project issues

### Creating a Bug Report

Include this information:

```javascript
// Bug report template
const bugReport = {
  version: '1.0.0', // DirNav version
  browser: navigator.userAgent,
  environment: 'development', // or production
  framework: 'React 18.2.0', // if applicable
  reproduction: {
    steps: [
      '1. Initialize component with...',
      '2. Click on...',
      '3. Observe error...'
    ],
    expected: 'Component should...',
    actual: 'Component does...'
  },
  debugInfo: collectDebugInfo(),
  codeExample: `
    // Minimal reproduction code
    const tree = createDirTree({...});
    const wrapper = createShadowDOMWrapper(...);
  `
};

console.log('Bug Report:', JSON.stringify(bugReport, null, 2));
```

### Performance Issues

If experiencing performance problems:

1. **Profile with DevTools**: Use Chrome DevTools Performance tab
2. **Monitor Memory**: Check for memory leaks
3. **Optimize Data**: Reduce directory sizes
4. **Use Virtual Directories**: For large datasets

### Getting Community Help

1. **GitHub Issues**: For bugs and feature requests
2. **Stack Overflow**: Tag questions with `solid-dirnav-ui`
3. **Discord/Slack**: Join community channels if available

Remember to always provide:
- Clear reproduction steps
- Browser and version information
- Code examples
- Error messages and console output
- Expected vs actual behavior

This troubleshooting guide should help you resolve most common issues. If you're still experiencing problems after trying these solutions, don't hesitate to reach out for help with detailed information about your specific situation.