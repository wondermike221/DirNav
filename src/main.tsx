import DirnavUI, { createDirTree } from './DirnavUI';
import { validateDirectoryTree, validateDirectoryTreeStrict } from './validation';
import { createShadowDOMWrapper } from './utils/shadowDOMUtils';

// Function to apply theme based on preference
const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  const body = document.body;
  if (theme === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
    }
  } else if (theme === 'dark') {
    body.classList.add('dark-mode');
  } else {
    body.classList.remove('dark-mode');
  }
  localStorage.setItem('dirnav-theme-preference', theme);
};

// Apply theme on initial load
const savedTheme = localStorage.getItem('dirnav-theme-preference') as 'light' | 'dark' | 'system' || 'system';
applyTheme(savedTheme);

// Listen for system theme changes if preference is 'system'
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (localStorage.getItem('dirnav-theme-preference') === 'system') {
    applyTheme('system');
  }
});

const initDirnav = () => {

  const sampleTree = createDirTree({
    "home": {
      type: 'directory',
      children: {
        "documents": {
          type: 'directory',
          children: {
            "report.pdf": { type: 'action', action: () => alert('Opening report.pdf') },
            "notes.txt": { type: 'action', action: () => alert('Opening notes.txt') },
          },
        },
        "pictures": {
          type: 'directory',
          children: {
            "vacation": { type: 'action', action: () => alert('Viewing vacation pictures') },
          },
        },
        "settings": {
          type: 'input', // Example of an input type
          localStorageKey: 'dirnav-settings-input',
        },
        "large_directory": {
          type: 'directory',
          children: {
            "item1": { type: 'action', action: () => alert('Item 1') },
            "item2": { type: 'action', action: () => alert('Item 2') },
            "item3": { type: 'action', action: () => alert('Item 3') },
            "item4": { type: 'action', action: () => alert('Item 4') },
            "item5": { type: 'action', action: () => alert('Item 5') },
            "item6": { type: 'action', action: () => alert('Item 6') },
            "item7": { type: 'action', action: () => alert('Item 7') },
            "item8": { type: 'action', action: () => alert('Item 8') },
            "item9": { type: 'action', action: () => alert('Item 9') },
            "item10": { type: 'action', action: () => alert('Item 10') },
          },
        },
        "virtual_data": {
          type: 'virtual-directory',
          onSelect: async () => {
            // Simulate an async fetch request
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(createDirTree({
                  "fetched_item1": { type: 'action', action: () => alert('Fetched Item 1') },
                  "fetched_item2": { type: 'action', action: () => alert('Fetched Item 2') },
                  "sub_virtual": {
                    type: 'virtual-directory',
                    onSelect: () => createDirTree({
                      "nested_fetched_item": { type: 'action', action: () => alert('Nested Fetched Item') },
                    }),
                  },
                }));
              }, 1000);
            });
          },
        },
      },
    },
    "about": { type: 'action', action: () => alert('About this application') },
    "exit": { type: 'action', action: () => alert('Exiting application') },
    "NT": { type: 'input', localStorageKey: 'dirnav-note-input' }, // New NT input leaf node
  });

  // Create shadow DOM wrapper with automatic mounting to document body
  const shadowWrapper = createShadowDOMWrapper(
    () => (
      <>
        <button onClick={() => applyTheme('light')}>Light mode</button>
        <button onClick={() => applyTheme('dark')}>Dark mode</button>
        <button onClick={() => applyTheme('system')}>System Default</button>
        <DirnavUI initialTree={sampleTree} />
      </>
    ),
    {
      hostId: 'dirnav-host',
      attachToBody: true
    }
  );

  // Store reference for potential cleanup
  (window as any).dirnavShadowWrapper = shadowWrapper;
};

// Expose validation functions globally for testing
if (typeof window !== 'undefined') {
  (window as any).validateDirectoryTree = validateDirectoryTree;
  (window as any).validateDirectoryTreeStrict = validateDirectoryTreeStrict;
  (window as any).createDirTree = createDirTree;
}

// Initialize the app
initDirnav();