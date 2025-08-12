import { Component, createSignal, onMount, onCleanup, Accessor, For } from 'solid-js';
import Breadcrumbs from './components/Breadcrumbs';
import { useTitle } from './TitleContext';

interface WindowProps {
  children?: any;
  onBack?: () => void;
  backButtonDisabled?: boolean;
  ref?: (el: HTMLDivElement) => void; // Add ref prop
  onClose?: () => void; // New prop for close action
  componentThemeClass?: string; // New prop for component-specific theme class
}

const Window: Component<WindowProps> = (props) => {
  const { title } = useTitle();

  const initialPosition = () => {
    try {
      const storedPosition = localStorage.getItem('dirnav-window-position');
      return storedPosition ? JSON.parse(storedPosition) : { x: window.innerWidth * 0.375, y: window.innerHeight * 0.375 };
    } catch (e) {
      console.error("Failed to parse stored position, using default:", e);
      return { x: window.innerWidth * 0.375, y: window.innerHeight * 0.375 };
    }
  };

  const initialSize = () => {
    try {
      const storedSize = localStorage.getItem('dirnav-window-size');
      return storedSize ? JSON.parse(storedSize) : { width: window.innerWidth * 0.25, height: window.innerHeight * 0.25 };
    } catch (e) {
      console.error("Failed to parse stored size, using default:", e);
      return { width: window.innerWidth * 0.25, height: window.innerHeight * 0.25 };
    }
  };

  const [position, setPosition] = createSignal(initialPosition());
  const [size, setSize] = createSignal(initialSize());
  const [isDragging, setIsDragging] = createSignal(false);
  const [isResizing, setIsResizing] = createSignal(false);
  const [offset, setOffset] = createSignal({ x: 0, y: 0 });

  let windowRef: HTMLDivElement | undefined;

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
      const newPosition = {
        x: e.clientX - offset().x,
        y: e.clientY - offset().y,
      };
      setPosition(newPosition);
      localStorage.setItem('dirnav-window-position', JSON.stringify(newPosition));
    } else if (isResizing()) {
      const titleBar = windowRef?.querySelector('.title-bar') as HTMLElement;
      const breadcrumbs = windowRef?.querySelector('#breadcrumbs') as HTMLElement;
      const minHeight = (titleBar.offsetHeight + breadcrumbs.offsetHeight) * 2;

      const newSize = {
        width: Math.max(100, size().width + (e.clientX - offset().x)), // Minimum width
        height: Math.max(minHeight, size().height + (e.clientY - offset().y)), // Minimum height
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
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  const handleClose = () => {
    if (props.onClose) {
      props.onClose();
    }
  };

  const handleResizeToDefault = () => {
    const defaultPosition = { x: window.innerWidth * 0.375, y: window.innerHeight * 0.375 };
    const defaultSize = { width: window.innerWidth * 0.25, height: window.innerHeight * 0.25 };
    setPosition(defaultPosition);
    setSize(defaultSize);
    localStorage.setItem('dirnav-window-position', JSON.stringify(defaultPosition));
    localStorage.setItem('dirnav-window-size', JSON.stringify(defaultSize));
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
    >
      <header class="title-bar">
        <div class="title-bar-controls">
          <button
            id="back-button"
            onClick={props.onBack}
            disabled={props.backButtonDisabled}
            tabindex="-1"
            onMouseDown={(e) => e.preventDefault()}
          >
            &#8592;
          </button>
        </div>
        <div id="window-title" class="title-bar-title">
          {title()[title().length - 1].name}
        </div>
        <div class="window-controls">
          <button
            id="resize-button"
            onClick={handleResizeToDefault}
            tabindex="-1"
            onMouseDown={(e) => e.preventDefault()}
          >
            &#9723;
          </button>
          <button
            id="close-button"
            onClick={handleClose}
            tabindex="-1"
            onMouseDown={(e) => e.preventDefault()}
          >
            X
          </button>
        </div>
      </header>
      <Breadcrumbs />
      <main id="window-content" class="window-content">
        {props.children}
      </main>
      <div id="resize-handle" class="resize-handle" />
    </div>
  );
};

export default Window;