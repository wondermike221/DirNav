import { Component, For, Accessor, Setter } from 'solid-js';

interface CommandPaletteProps {
  searchTerm: Accessor<string>;
  setSearchTerm: Setter<string>;
  searchResults: Accessor<any[]>;
  selectedSearchResultIndex: Accessor<number>;
  onSelect: (item: any) => void;
  commandPaletteInputRef: (el: HTMLInputElement) => void;
}

const CommandPalette: Component<CommandPaletteProps> = (props) => {
  return (
    <div>
      <input
        ref={props.commandPaletteInputRef}
        type="text"
        placeholder="Search..."
        value={props.searchTerm()}
        onInput={(e) => props.setSearchTerm(e.currentTarget.value)}
        style={{ width: '100%', padding: '5px', 'margin-bottom': '10px' }}
      />
      <Show when={props.searchResults().length > 0}>
        <div style={{ 'max-height': '200px', 'overflow-y': 'auto', 'border': '1px solid #eee' }}>
          <For each={props.searchResults()}>{(item, index) => (
            <div
              style={{
                padding: '5px',
                cursor: 'pointer',
                'background-color': props.selectedSearchResultIndex() === index() ? '#f0f0f0' : 'transparent',
              }}
              onClick={() => props.onSelect(item)}
            >
              {item.name} <span style={{ color: '#888', 'font-size': '0.8em' }}>({item.fullPath})</span>
            </div>
          )}</For>
        </div>
      </Show>
      <Show when={props.searchResults().length === 0 && props.searchTerm().length > 0}>
        <p>No results found.</p>
      </Show>
    </div>
  );
};

export default CommandPalette;