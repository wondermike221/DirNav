// Type definitions for solid-dirnav-ui
// Project: https://github.com/username/solid-dirnav-ui
// Definitions by: DirNav Contributors

import { Component } from 'solid-js';

// Core Types
export interface DirNode {
  [key: string]: DirNodeItem;
}

export type DirTree = DirNode;

export type DirNodeItem = 
  | { type: 'directory'; children: DirNode }
  | { type: 'action'; action: () => void }
  | { type: 'input'; localStorageKey: string; defaultValue?: string }
  | { type: 'virtual-directory'; onSelect: () => Promise<DirTree> };

export interface FlatDirNode {
  name: string;
  path: string[];
  type: DirNodeItem['type'];
  onSelect?: () => void | Promise<DirTree>;
}

// Search Types
export interface SearchResult {
  item: FlatDirNode;
  score: number;
  matches: number[];
}

export interface SearchOptions {
  caseSensitive?: boolean;
  threshold?: number;
  maxResults?: number;
}

// Shadow DOM Types
export interface ShadowDOMWrapperOptions {
  mode?: 'open' | 'closed';
  delegatesFocus?: boolean;
}

export interface ShadowDOMWrapper {
  shadowRoot: ShadowRoot;
  host: HTMLElement;
  mount: (component: Component) => void;
  unmount: () => void;
}

// Component Props
export interface DirnavUIProps {
  initialTree: DirTree;
  onClose?: () => void;
}

// Main Components
export const DirnavUI: Component<DirnavUIProps>;
export const Window: Component<any>;
export const DirnavShadowWrapper: Component<DirnavUIProps>;
export const ShadowDOMContainer: Component<any>;

// Utility Functions
export function createDirTree(tree: DirNode): DirTree;
export function createShadowDOMWrapper(options?: ShadowDOMWrapperOptions): ShadowDOMWrapper;
export function isElementFocused(element: Element): boolean;
export function getShadowRoot(element: Element): ShadowRoot | null;
export function getShadowHost(shadowRoot: ShadowRoot): Element | null;

// Default export
declare const _default: {
  DirnavUI: typeof DirnavUI;
  Window: typeof Window;
  DirnavShadowWrapper: typeof DirnavShadowWrapper;
  ShadowDOMContainer: typeof ShadowDOMContainer;
  createDirTree: typeof createDirTree;
  createShadowDOMWrapper: typeof createShadowDOMWrapper;
  isElementFocused: typeof isElementFocused;
  getShadowRoot: typeof getShadowRoot;
  getShadowHost: typeof getShadowHost;
};

export default _default;