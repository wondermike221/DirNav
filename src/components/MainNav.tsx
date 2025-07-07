import { Component, For, Show } from 'solid-js';

interface MainNavProps {
  paginatedItems: () => any[];
  totalPages: () => number;
  currentPage: () => number;
  handleNavigate: (name: string, type: string) => void;
}

const MainNav: Component<MainNavProps> = (props) => {
  return (
    <>
      <Show when={props.paginatedItems().length === 0}>
        <p>This directory is empty.</p>
      </Show>
      <ol id="main-nav-list">
        <For each={props.paginatedItems()}>{(item, index) => (
          <li
            id={`main-nav-item-${index()}`}
            class="main-nav-item"
          >
            <button
              onClick={() => props.handleNavigate(item[0], item[1].type)}
            >
              {item[1].name}
              {item[1].type === 'directory' ? '/' : ''}
              {item[1].type === 'input' && item[1].localStorageKey ? ` (Current: ${localStorage.getItem(item[1].localStorageKey) || ''})` : ''}
            </button>
          </li>
        )}</For>
      </ol>

      <Show when={props.totalPages() > 1}>
        <div id="pagination-dots">
          <For each={Array(props.totalPages()).fill(0)}>{(_, i) => (
            <span class={`pagination-dot ${props.currentPage() === i() ? 'active' : ''}`} />
          )}</For>
        </div>
      </Show>
    </>
  );
};

export default MainNav;