import { Component, createSignal, onMount, onCleanup, JSX, createEffect } from 'solid-js';
import { render } from 'solid-js/web';
import styles from '../style.css?inline';

interface ShadowDOMContainerProps {
  children: JSX.Element;
  hostId?: string;
  attachToBody?: boolean;
  onMount?: (shadowRoot: ShadowRoot, host: HTMLElement) => void;
  onCleanup?: () => void;
}

/**
 * ShadowDOMContainer component that provides complete style isolation
 * by rendering children inside a shadow DOM with injected CSS
 */
const ShadowDOMContainer: Component<ShadowDOMContainerProps> = (props) => {
  const [isReady, setIsReady] = createSignal(false);
  let shadowHost: HTMLDivElement | undefined;
  let shadowRoot: ShadowRoot | undefined;
  let mountPoint: HTMLDivElement | undefined;
  let dispose: (() => void) | undefined;

  onMount(() => {
    // Create the shadow DOM host element
    shadowHost = document.createElement('div');
    shadowHost.id = props.hostId || 'dirnav-shadow-host';
    
    // Attach shadow root with open mode for accessibility and debugging
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    // Create mount point for the component inside shadow DOM
    mountPoint = document.createElement('div');
    mountPoint.id = 'dirnav-shadow-root';
    
    // Inject CSS styles into shadow DOM for complete isolation
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    
    // Append style and mount point to shadow root
    shadowRoot.appendChild(styleElement);
    shadowRoot.appendChild(mountPoint);
    
    // Attach to document body or specified parent
    if (props.attachToBody !== false) {
      document.body.appendChild(shadowHost);
    }
    
    // Call onMount callback if provided
    if (props.onMount) {
      props.onMount(shadowRoot, shadowHost);
    }
    
    // Render children inside the shadow DOM mount point
    dispose = render(() => props.children, mountPoint);
    
    setIsReady(true);
  });

  onCleanup(() => {
    // Dispose of the SolidJS render
    if (dispose) {
      dispose();
    }
    
    // Remove shadow host from DOM
    if (shadowHost && shadowHost.parentNode) {
      shadowHost.parentNode.removeChild(shadowHost);
    }
    
    // Call cleanup callback if provided
    if (props.onCleanup) {
      props.onCleanup();
    }
  });

  // This component doesn't render anything in the normal DOM tree
  // Everything is rendered inside the shadow DOM
  return null;
};

export default ShadowDOMContainer;