import { Component, For, Show, Accessor, Setter } from 'solid-js';

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
    <div id="command-palette">
      <input
        id="command-palette-input"
        ref={props.commandPaletteInputRef}
        type="text"
        placeholder="Search..."
        value={props.searchTerm()}
        onInput={(e) => props.setSearchTerm(e.currentTarget.value)}
      />
      <Show when={props.searchResults().length > 0}>
        <ul id="command-palette-results">
          <For each={props.searchResults()}>{(item, index) => (
            <li
              id={`command-palette-result-${index()}`}
              class="command-palette-result"
              onClick={() => props.onSelect(item)}
            >
              {item.name} <span class="command-palette-result-path">({item.fullPath})</span>
            </li>
          )}</For>
        </ul>
      </Show>
      <Show when={props.searchResults().length === 0 && props.searchTerm().length > 0}>
        <p id="command-palette-no-results">No results found.</p>
      </Show>
    </div>
  );
};

export default CommandPalette;