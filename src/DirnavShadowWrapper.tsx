import { Component, onMount, onCleanup } from 'solid-js';
import DirnavUI, { createDirTree } from './DirnavUI';
import { createShadowDOMWrapper, ShadowDOMWrapper } from './utils/shadowDOMUtils';
import { DirTree } from './types';

interface DirnavShadowWrapperProps {
  initialTree: DirTree;
  hostId?: string;
  attachToBody?: boolean;
  onMount?: (wrapper: ShadowDOMWrapper) => void;
  onDestroy?: () => void;
}

/**
 * DirnavShadowWrapper component that automatically creates a shadow DOM
 * wrapper for the DirnavUI component with complete style isolation
 */
const DirnavShadowWrapper: Component<DirnavShadowWrapperProps> = (props) => {
  let shadowWrapper: ShadowDOMWrapper | undefined;

  onMount(() => {
    // Create shadow DOM wrapper with DirnavUI component
    shadowWrapper = createShadowDOMWrapper(
      () => <DirnavUI initialTree={props.initialTree} />,
      {
        hostId: props.hostId || 'dirnav-shadow-host',
        attachToBody: props.attachToBody !== false,
        injectStyles: true
      }
    );

    // Call onMount callback if provided
    if (props.onMount && shadowWrapper) {
      props.onMount(shadowWrapper);
    }
  });

  onCleanup(() => {
    // Clean up shadow DOM wrapper
    if (shadowWrapper) {
      shadowWrapper.destroy();
    }
    
    // Call destroy callback if provided
    if (props.onDestroy) {
      props.onDestroy();
    }
  });

  // This component doesn't render anything in the normal DOM tree
  // Everything is rendered inside the shadow DOM
  return null;
};

export default DirnavShadowWrapper;