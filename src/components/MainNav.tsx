import { Component, For, Show } from 'solid-js';

interface MainNavProps {
  paginatedItems: () => any[];
  totalPages: () => number;
  currentPage: () => number;
  handleNavigate: (name: string, type: string) => void;
}

const MainNav: Component<MainNavProps> = (props) => {
  return (
    <div role="region" aria-label="Directory contents">
      <Show when={props.paginatedItems().length === 0}>
        <p role="status" aria-live="polite">This directory is empty.</p>
      </Show>
      <ol id="main-nav-list" role="list" aria-label="Directory items">
        <For each={props.paginatedItems()}>{(item, index) => {
          const itemType = item[1].type;
          const itemName = item[1].name;
          const isDirectory = itemType === 'directory';
          const isInput = itemType === 'input';
          const isAction = itemType === 'action';
          const isVirtualDirectory = itemType === 'virtual-directory';
          const currentValue = isInput && item[1].localStorageKey ? localStorage.getItem(item[1].localStorageKey) || '' : '';
          
          let ariaLabel = '';
          if (isDirectory) {
            ariaLabel = `Navigate to ${itemName} directory`;
          } else if (isInput) {
            ariaLabel = `Edit ${itemName} input field${currentValue ? `, value: ${currentValue}` : ''}`;
          } else if (isVirtualDirectory) {
            ariaLabel = `Load ${itemName} virtual directory`;
          } else if (isAction) {
            ariaLabel = `Execute ${itemName} action`;
          }

          return (
            <li
              id={`main-nav-item-${index()}`}
              class="main-nav-item"
              role="listitem"
            >
              <button
                onClick={() => props.handleNavigate(item[0], item[1].type)}
                aria-label={ariaLabel}
                class={`nav-item-button nav-item-${itemType}`}
                data-keyboard-shortcut={index() + 1}
              >
                <span class="nav-item-content">
                  <span class="nav-item-name">
                    {itemName}
                    {isDirectory && <span aria-hidden="true">/</span>}
                    {isInput && currentValue && (
                      <span class="nav-item-value" aria-hidden="true">
                        : {currentValue}
                      </span>
                    )}
                  </span>
                </span>
                <span class="keyboard-shortcut-indicator" aria-hidden="true">
                  {index() + 1}
                </span>
              </button>
            </li>
          );
        }}</For>
      </ol>

      <Show when={props.totalPages() > 1}>
        <nav id="pagination-dots" aria-label="Page navigation" role="navigation">
          <div class="pagination-container">
            <span class="sr-only">Page {props.currentPage() + 1} of {props.totalPages()}</span>
            <For each={Array(props.totalPages()).fill(0)}>{(_, i) => (
              <span 
                class={`pagination-dot ${props.currentPage() === i() ? 'active' : ''}`}
                aria-label={`Page ${i() + 1}${props.currentPage() === i() ? ' (current)' : ''}`}
                role="img"
              />
            )}</For>
          </div>
        </nav>
      </Show>
    </div>
  );
};

export default MainNav;