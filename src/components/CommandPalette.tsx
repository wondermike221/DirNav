import { Component, For, Show, Accessor, Setter, onMount } from 'solid-js';
import { focusInputInShadowDOM } from '../utils/shadowDOMUtils';

interface CommandPaletteProps {
  searchTerm: Accessor<string>;
  setSearchTerm: Setter<string>;
  searchResults: Accessor<any[]>;
  selectedSearchResultIndex: Accessor<number>;
  onSelect: (item: any) => void;
}

const CommandPalette: Component<CommandPaletteProps> = (props) => {
  let commandPaletteInputRef: HTMLInputElement | undefined;

  onMount(() => {
    // Focus the input when the component mounts
    setTimeout(() => {
      if (commandPaletteInputRef) {
        focusInputInShadowDOM(commandPaletteInputRef);
      }
    }, 10);
  });

  return (
    <div id="command-palette" role="search" aria-label="Command palette search">
      <label for="command-palette-input" class="sr-only">
        Search for directories, actions, and settings
      </label>
      <input
        id="command-palette-input"
        ref={commandPaletteInputRef}
        type="text"
        placeholder="Search..."
        value={props.searchTerm()}
        onInput={(e) => props.setSearchTerm(e.currentTarget.value)}
        aria-describedby="command-palette-instructions"
        aria-expanded={props.searchResults().length > 0}
        aria-activedescendant={props.searchResults().length > 0 ? `command-palette-result-${props.selectedSearchResultIndex()}` : undefined}
        role="combobox"
        aria-autocomplete="list"
      />
      <div id="command-palette-instructions" class="sr-only">
        Use arrow keys to navigate results, Enter to select, Escape to close
      </div>
      <Show when={props.searchResults().length > 0}>
        <ul 
          id="command-palette-results" 
          role="listbox" 
          aria-label={`${props.searchResults().length} search results available`}
        >
          <For each={props.searchResults()}>{(item, index) => {
            const isSelected = index() === props.selectedSearchResultIndex();
            const itemType = item.type;
            let typeDescription = '';
            if (itemType === 'directory') typeDescription = 'directory';
            else if (itemType === 'action') typeDescription = 'action';
            else if (itemType === 'input') typeDescription = 'input field';
            else if (itemType === 'virtual-directory') typeDescription = 'virtual directory';

            return (
              <li
                id={`command-palette-result-${index()}`}
                class={`command-palette-result ${isSelected ? 'selected' : ''}`}
                onClick={() => props.onSelect(item)}
                role="option"
                aria-selected={isSelected}
                aria-label={`${item.name}, ${typeDescription}, path: ${item.fullPath}`}
              >
                <span class="command-palette-result-name">
                  {item.name}
                  {itemType === 'directory' && <span aria-hidden="true">/</span>}
                </span>
                <span class="command-palette-result-path" aria-hidden="true">
                  {item.fullPath}
                </span>
              </li>
            );
          }}</For>
        </ul>
      </Show>
      <Show when={props.searchResults().length === 0 && props.searchTerm().length > 0}>
        <p id="command-palette-no-results" role="status" aria-live="polite">
          No results found for "{props.searchTerm()}".
        </p>
      </Show>
    </div>
  );
};

export default CommandPalette;