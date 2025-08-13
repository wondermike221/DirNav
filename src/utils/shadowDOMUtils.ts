import { render } from 'solid-js/web';
import { JSX } from 'solid-js';
import styles from '../style.css?inline';

export interface ShadowDOMWrapperOptions {
  hostId?: string;
  attachToBody?: boolean;
  hostElement?: HTMLElement;
  injectStyles?: boolean;
  customStyles?: string;
}

export interface ShadowDOMWrapper {
  host: HTMLElement;
  shadowRoot: ShadowRoot;
  mountPoint: HTMLElement;
  dispose: () => void;
  destroy: () => void;
  attachTo: (parent: Element) => void;
}

/**
 * Creates a shadow DOM wrapper for a SolidJS component with complete style isolation
 * @param component The SolidJS component function to render
 * @param options Configuration options for the shadow DOM wrapper
 * @returns ShadowDOMWrapper object with control methods
 */
export function createShadowDOMWrapper(
  component: () => JSX.Element,
  options: ShadowDOMWrapperOptions = {}
): ShadowDOMWrapper {
  const {
    hostId = 'dirnav-shadow-host',
    attachToBody = true,
    hostElement,
    injectStyles = true,
    customStyles = ''
  } = options;
  
  // Use provided host element or create new one
  const host = hostElement || document.createElement('div');
  if (!hostElement) {
    host.id = hostId;
  }
  
  // Create shadow root with open mode for accessibility
  const shadowRoot = host.attachShadow({ mode: 'open' });
  
  // Create mount point for the SolidJS component
  const mountPoint = document.createElement('div');
  mountPoint.id = 'dirnav-shadow-root';
  
  // Inject CSS styles if requested
  if (injectStyles) {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles + (customStyles ? '\n' + customStyles : '');
    shadowRoot.appendChild(styleElement);
  }
  
  // Append mount point to shadow root
  shadowRoot.appendChild(mountPoint);
  
  // Attach to document body if requested and not already attached
  if (attachToBody && !host.parentNode) {
    document.body.appendChild(host);
  }
  
  // Render the SolidJS component inside the shadow DOM
  const dispose = render(component, mountPoint);
  
  return {
    host,
    shadowRoot,
    mountPoint,
    dispose,
    
    /**
     * Removes the shadow DOM host from the document and disposes the SolidJS app
     */
    destroy() {
      dispose();
      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
    },
    
    /**
     * Attaches the host to a specific parent element
     */
    attachTo(parent: Element) {
      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
      parent.appendChild(host);
    }
  };
}

/**
 * Utility function to check if an element is within a shadow DOM
 */
export function isInShadowDOM(element: Element): boolean {
  return element.getRootNode() instanceof ShadowRoot;
}

/**
 * Utility function to get the shadow root containing an element
 */
export function getShadowRoot(element: Element): ShadowRoot | null {
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root : null;
}

/**
 * Utility function to find the shadow host for a given element
 */
export function getShadowHost(element: Element): Element | null {
  const shadowRoot = getShadowRoot(element);
  return shadowRoot ? shadowRoot.host : null;
}

/**
 * Enhanced focus detection that works across shadow DOM boundaries
 */
export function isElementFocused(element: Element): boolean {
  // Check if element is directly focused
  if (document.activeElement === element) {
    return true;
  }
  
  // Check if element contains the focused element
  if (element.contains(document.activeElement)) {
    return true;
  }
  
  // Check shadow DOM scenarios
  const shadowHost = getShadowHost(element);
  if (shadowHost) {
    // If we're in a shadow DOM, check if the shadow host is focused
    if (document.activeElement === shadowHost) {
      return true;
    }
    
    // Check if the active element within the shadow DOM is our element or contained by it
    const shadowRoot = getShadowRoot(element);
    if (shadowRoot && shadowRoot.activeElement) {
      return element === shadowRoot.activeElement || element.contains(shadowRoot.activeElement);
    }
  }
  
  return false;
}

/**
 * Enhanced event listener management for shadow DOM contexts
 */
export class ShadowDOMEventManager {
  private listeners: Map<string, { element: Element | Document, handler: EventListener, options?: AddEventListenerOptions }> = new Map();
  
  /**
   * Add an event listener that works across shadow DOM boundaries
   */
  addEventListener(
    target: Element | Document | 'document',
    type: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): string {
    const actualTarget = target === 'document' ? document : target;
    const listenerId = `${type}_${Date.now()}_${Math.random()}`;
    
    // For shadow DOM elements, we might need to listen on both the element and document
    actualTarget.addEventListener(type, handler, options);
    
    this.listeners.set(listenerId, {
      element: actualTarget,
      handler,
      options
    });
    
    return listenerId;
  }
  
  /**
   * Remove a specific event listener
   */
  removeEventListener(listenerId: string): void {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener.element.removeEventListener(listener.handler as any, listener.options);
      this.listeners.delete(listenerId);
    }
  }
  
  /**
   * Remove all event listeners managed by this instance
   */
  removeAllEventListeners(): void {
    for (const [id, listener] of this.listeners) {
      listener.element.removeEventListener(listener.handler as any, listener.options);
    }
    this.listeners.clear();
  }
  
  /**
   * Get the appropriate event target for shadow DOM context
   */
  getEventTarget(element: Element): Element | Document {
    const shadowRoot = getShadowRoot(element);
    if (shadowRoot) {
      // For elements in shadow DOM, we often want to listen on the shadow root or document
      return document; // Global events should still be on document
    }
    return element;
  }
}

/**
 * Create a shadow DOM-aware event manager instance
 */
export function createShadowDOMEventManager(): ShadowDOMEventManager {
  return new ShadowDOMEventManager();
}

/**
 * Enhanced keyboard event handling for shadow DOM
 */
export function handleShadowDOMKeyboardEvent(
  event: KeyboardEvent,
  targetElement: Element,
  handler: (event: KeyboardEvent, isTargetFocused: boolean) => void
): void {
  const isTargetFocused = isElementFocused(targetElement);
  handler(event, isTargetFocused);
}

/**
 * Focus an element within shadow DOM context
 */
export function focusElementInShadowDOM(element: HTMLElement): void {
  // First try to focus the element directly
  element.focus();
  
  // If the element is in a shadow DOM, we might need additional steps
  const shadowRoot = getShadowRoot(element);
  if (shadowRoot) {
    // Ensure the shadow host is also focused if needed
    const shadowHost = shadowRoot.host as HTMLElement;
    if (shadowHost && shadowHost.tabIndex >= 0) {
      shadowHost.focus();
    }
  }
}

/**
 * Blur an element within shadow DOM context
 */
export function blurElementInShadowDOM(element: HTMLElement): void {
  element.blur();
  
  // If the element is in a shadow DOM, also blur the shadow host if appropriate
  const shadowRoot = getShadowRoot(element);
  if (shadowRoot) {
    const shadowHost = shadowRoot.host as HTMLElement;
    if (shadowHost && document.activeElement === shadowHost) {
      shadowHost.blur();
    }
  }
}

/**
 * Enhanced input element focus management for shadow DOM
 */
export function focusInputInShadowDOM(inputElement: HTMLInputElement): void {
  // For input elements, we need to ensure they can receive keyboard input
  focusElementInShadowDOM(inputElement);
  
  // Additional steps for input elements
  if (inputElement.type === 'text' || inputElement.tagName.toLowerCase() === 'input') {
    // Ensure the input is ready to receive text
    setTimeout(() => {
      inputElement.focus();
      // Move cursor to end of input if it has content
      if (inputElement.value) {
        inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
      }
    }, 0);
  }
}

/**
 * Create a focus trap within a shadow DOM container
 */
export function createShadowDOMFocusTrap(container: Element): {
  activate: () => void;
  deactivate: () => void;
} {
  let isActive = false;
  let previousActiveElement: Element | null = null;
  
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive || event.key !== 'Tab') return;
    
    const focusableElements = Array.from(container.querySelectorAll(focusableSelector)) as HTMLElement[];
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    }
  };
  
  return {
    activate() {
      if (isActive) return;
      
      isActive = true;
      previousActiveElement = document.activeElement;
      
      // Focus first focusable element
      const firstFocusable = container.querySelector(focusableSelector) as HTMLElement;
      if (firstFocusable) {
        focusElementInShadowDOM(firstFocusable);
      }
      
      // Add event listener
      document.addEventListener('keydown', handleKeyDown);
    },
    
    deactivate() {
      if (!isActive) return;
      
      isActive = false;
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore previous focus
      if (previousActiveElement && previousActiveElement instanceof HTMLElement) {
        focusElementInShadowDOM(previousActiveElement);
      }
    }
  };
}