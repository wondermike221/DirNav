export interface DirNode {
  name: string;
  type: 'directory' | 'action' | 'input' | 'virtual-directory';
  children?: DirTree;
  action?: () => void;
  onSelect?: () => Promise<DirTree> | DirTree; // For virtual directory, can be async
  localStorageKey?: string; // For input type
}

export interface DirTree {
  [key: string]: DirNode;
}

export interface FlatDirNode extends DirNode {
  fullPath: string;
}
