import { render } from 'solid-js/web';
import DirnavUI, { createDirTree } from './DirnavUI';
import styles from './style.css?inline';

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
  // Create a host element for the shadow DOM
  const host = document.createElement('div');
  host.id = 'dirnav-host';
  document.body.appendChild(host);

  // Create a shadow root
  const shadowRoot = host.attachShadow({ mode: 'open' });

  // Create a mount point for the Solid app inside the shadow DOM
  const mountPoint = document.createElement('div');
  mountPoint.id = 'dirnav-root';
  shadowRoot.appendChild(mountPoint);

  // Inject the CSS into the shadow DOM
  const style = document.createElement('style');
  style.textContent = styles; // Use the imported CSS content
  shadowRoot.appendChild(style);

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

  render(() => 
  <>
  <button on:click={() => applyTheme('light')}>Light mode</button>
  <button on:click={() => applyTheme('dark')}>Dark mode</button>
  <button on:click={() => applyTheme('system')}>System Default</button>
  <DirnavUI initialTree={sampleTree} />
  </>, mountPoint);
};

// Initialize the app
initDirnav();