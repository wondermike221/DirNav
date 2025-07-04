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
      <For each={props.paginatedItems()}>{(item, index) => (
        <div
          style={{
            padding: '5px 0',
            cursor: 'pointer',
            'border-bottom': '1px solid #eee',
          }}
          onClick={() => props.handleNavigate(item[0], item[1].type)}
        >
          {index() + 1}. {item[1].name}
          {item[1].type === 'directory' ? '/' : ''}
          {item[1].type === 'input' && item[1].localStorageKey ? ` (Current: ${localStorage.getItem(item[1].localStorageKey) || ''})` : ''}
        </div>
      )}</For>

      <Show when={props.totalPages() > 1}>
        <div style={{ 'text-align': 'center', 'margin-top': '10px' }}>
          <For each={Array(props.totalPages()).fill(0)}>{(_, i) => (
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                'border-radius': '50%',
                'background-color': props.currentPage() === i() ? '#333' : '#ccc',
                margin: '0 4px',
              }}
            />
          )}</For>
        </div>
      </Show>
    </>
  );
};

export default MainNav;