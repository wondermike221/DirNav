import { Component, createSignal, onMount, onCleanup, Accessor, For } from 'solid-js';
import Breadcrumbs from './components/Breadcrumbs';
import { useTitle } from './TitleContext';
import { createShadowDOMEventManager } from './utils/shadowDOMUtils';

interface WindowProps {
  children?: any;
  onBack?: () => void;
  backButtonDisabled?: boolean;
  onCommandPalette?: () => void; // New prop for command palette action
  commandPaletteMode?: boolean; // New prop to indicate if command palette is open
  ref?: (el: HTMLDivElement) => void; // Add ref prop
  onClose?: () => void; // New prop for close action
  componentThemeClass?: string; // New prop for component-specific theme class
}

const Window: Component<WindowProps> = (props) => {
  const { title } = useTitle();

  const getResponsiveDefaults = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 768;
    const isTablet = vw >= 768 && vw <= 1024;
    
    if (isMobile) {
      return {
        position: { x: vw * 0.025, y: vh * 0.075 }, // 2.5% from left, 7.5% from top
        size: { width: vw * 0.9, height: vh * 0.7 } // 90% width, 70% height
      };
    } else if (isTablet) {
      return {
        position: { x: vw * 0.15, y: vh * 0.1 }, // 15% from left, 10% from top
        size: { width: vw * 0.5, height: vh * 0.5 } // 50% width, 50% height
      };
    } else {
      return {
        position: { x: vw * 0.375, y: vh * 0.375 }, // 37.5% from left and top (centered for 25% size)
        size: { width: vw * 0.25, height: vh * 0.25 } // 25% width and height
      };
    }
  };

  const initialPosition = () => {
    try {
      const storedPosition = localStorage.getItem('dirnav-window-position');
      if (storedPosition) {
        const parsed = JSON.parse(storedPosition);
        // Validate stored position is within viewport bounds
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (parsed.x >= 0 && parsed.x < vw * 0.9 && parsed.y >= 0 && parsed.y < vh * 0.9) {
          return parsed;
        }
      }
      return getResponsiveDefaults().position;
    } catch (e) {
      console.error("Failed to parse stored position, using default:", e);
      return getResponsiveDefaults().position;
    }
  };

  const initialSize = () => {
    try {
      const storedSize = localStorage.getItem('dirnav-window-size');
      if (storedSize) {
        const parsed = JSON.parse(storedSize);
        // Validate stored size is reasonable
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const minWidth = Math.min(vw * 0.2, 200);
        const minHeight = Math.min(vh * 0.2, 150);
        if (parsed.width >= minWidth && parsed.height >= minHeight && 
            parsed.width <= vw * 0.95 && parsed.height <= vh * 0.95) {
          return parsed;
        }
      }
      return getResponsiveDefaults().size;
    } catch (e) {
      console.error("Failed to parse stored size, using default:", e);
      return getResponsiveDefaults().size;
    }
  };

  const [position, setPosition] = createSignal(initialPosition());
  const [size, setSize] = createSignal(initialSize());
  const [isDragging, setIsDragging] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(false);
  const [offset, setOffset] = createSignal({ x: 0, y: 0 });

  let windowRef: HTMLDivElement | undefined;
  
  // Shadow DOM-aware event manager
  const eventManager = createShadowDOMEventManager();

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Only left click for mouse
    const target = e.target as HTMLElement;
    if (target.classList.contains('title-bar') || target.closest('.title-bar')) {
      setIsDragging(true);
      setOffset({
        x: e.clientX - position().x,
        y: e.clientY - position().y,
      });
      e.preventDefault(); // Prevent text selection on touch
    } else if (target.classList.contains('resize-handle')) {
      setIsResizing(true);
      setOffset({
        x: e.clientX,
        y: e.clientY,
      });
      e.preventDefault(); // Prevent scrolling on touch
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    const target = e.target as HTMLElement;
    if (target.classList.contains('title-bar') || target.closest('.title-bar')) {
      setIsDragging(true);
      setOffset({
        x: e.clientX - position().x,
        y: e.clientY - position().y,
      });
    } else if (target.classList.contains('resize-handle')) {
      setIsResizing(true);
      setOffset({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging()) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const newPosition = {
        x: Math.max(0, Math.min(vw - 100, e.clientX - offset().x)), // Keep within viewport bounds
        y: Math.max(0, Math.min(vh - 50, e.clientY - offset().y)), // Keep title bar visible
      };
      setPosition(newPosition);
      localStorage.setItem('dirnav-window-position', JSON.stringify(newPosition));
    } else if (isResizing()) {
      const titleBar = windowRef?.querySelector('.title-bar') as HTMLElement;
      const breadcrumbs = windowRef?.querySelector('#breadcrumbs') as HTMLElement;
      const minHeight = (titleBar?.offsetHeight || 40) + (breadcrumbs?.offsetHeight || 30) + 100;
      
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 768;
      
      // Responsive minimum sizes
      const minWidth = isMobile ? Math.min(vw * 0.8, 300) : Math.min(vw * 0.2, 200);
      const maxWidth = isMobile ? vw * 0.95 : vw * 0.9;
      const maxHeight = isMobile ? vh * 0.9 : vh * 0.85;

      const newSize = {
        width: Math.max(minWidth, Math.min(maxWidth, size().width + (e.clientX - offset().x))),
        height: Math.max(minHeight, Math.min(maxHeight, size().height + (e.clientY - offset().y))),
      };
      setSize(newSize);
      localStorage.setItem('dirnav-window-size', JSON.stringify(newSize));
      setOffset({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  onMount(() => {
    // Use shadow DOM-aware event management for global mouse and touch events
    eventManager.addEventListener('document', 'mousemove', handleMouseMove);
    eventManager.addEventListener('document', 'mouseup', handleMouseUp);
    eventManager.addEventListener('document', 'touchmove', handleMouseMove as any);
    eventManager.addEventListener('document', 'touchend', handleMouseUp);
    eventManager.addEventListener('document', 'pointermove', handleMouseMove as any);
    eventManager.addEventListener('document', 'pointerup', handleMouseUp);
    
    // Handle window resize to adjust component positioning
    const handleWindowResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const currentPos = position();
      const currentSize = size();
      
      // Ensure window stays within viewport bounds after resize
      const maxX = vw - Math.min(currentSize.width, 100);
      const maxY = vh - 50; // Keep title bar visible
      
      if (currentPos.x > maxX || currentPos.y > maxY) {
        const newPosition = {
          x: Math.max(0, Math.min(maxX, currentPos.x)),
          y: Math.max(0, Math.min(maxY, currentPos.y))
        };
        setPosition(newPosition);
        localStorage.setItem('dirnav-window-position', JSON.stringify(newPosition));
      }
      
      // Ensure window size is reasonable for new viewport
      const maxWidth = vw * 0.95;
      const maxHeight = vh * 0.9;
      
      if (currentSize.width > maxWidth || currentSize.height > maxHeight) {
        const newSize = {
          width: Math.min(currentSize.width, maxWidth),
          height: Math.min(currentSize.height, maxHeight)
        };
        setSize(newSize);
        localStorage.setItem('dirnav-window-size', JSON.stringify(newSize));
      }
    };
    
    eventManager.addEventListener('window', 'resize', handleWindowResize);
  });

  onCleanup(() => {
    // Clean up all event listeners
    eventManager.removeAllEventListeners();
  });

  const handleClose = () => {
    if (props.onClose) {
      props.onClose();
    }
  };

  const handleResizeToDefault = () => {
    const defaults = getResponsiveDefaults();
    setPosition(defaults.position);
    setSize(defaults.size);
    localStorage.setItem('dirnav-window-position', JSON.stringify(defaults.position));
    localStorage.setItem('dirnav-window-size', JSON.stringify(defaults.size));
  };

  

  return (
    <div
      id="dirnav-window"
      ref={(el) => {
        windowRef = el;
        if (props.ref) props.ref(el);
      }}
      class={`dirnav-window ${props.componentThemeClass || ''}`}
      tabindex="-1"
      role="dialog"
      aria-label="Directory Navigation Window"
      aria-modal="false"
      style={{
        position: 'fixed',
        left: `${position().x}px`,
        top: `${position().y}px`,
        width: `${size().width}px`,
        height: `${size().height}px`,
        'z-index': 1000,
        display: 'flex',
        'flex-direction': 'column',
      }}
      onMouseDown={handleMouseDown}
      onPointerDown={handlePointerDown}
    >
      <header class="title-bar" role="banner">
        <div class="title-bar-controls">
          {props.backButtonDisabled ? (
            <button
              id="command-palette-button"
              onClick={props.onCommandPalette}
              tabindex="-1"
              aria-label={props.commandPaletteMode ? "Close command palette" : "Open command palette"}
              aria-expanded={props.commandPaletteMode}
              onMouseDown={(e) => e.preventDefault()}
            >
              {props.commandPaletteMode ? '×' : '>'}
            </button>
          ) : (
            <button
              id="back-button"
              onClick={props.onBack}
              tabindex="-1"
              aria-label="Go back to parent directory"
              onMouseDown={(e) => e.preventDefault()}
            >
              &#8592;
            </button>
          )}
        </div>
        <div id="window-title" class="title-bar-title" role="heading" aria-level="1">
          {title()[title().length - 1].name}
        </div>
        <div class="window-controls">
          <button
            id="resize-button"
            onClick={handleResizeToDefault}
            tabindex="-1"
            aria-label="Reset window to default size and position"
            onMouseDown={(e) => e.preventDefault()}
          >
            &#9723;
          </button>
          <button
            id="close-button"
            onClick={handleClose}
            tabindex="-1"
            aria-label="Close directory navigation window"
            onMouseDown={(e) => e.preventDefault()}
          >
            X
          </button>
        </div>
      </header>
      <Breadcrumbs />
      <main id="window-content" class="window-content" role="main" aria-live="polite">
        {props.children}
      </main>
      <div id="resize-handle" class="resize-handle" aria-label="Resize window" role="button" tabindex="-1" />
    </div>
  );
};

export default Window;