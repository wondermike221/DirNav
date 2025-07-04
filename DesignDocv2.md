# DirNav Design Document v2

This document outlines the design and features of the DirNav component.

## Core Concepts

- **Tree-like Data Structure**: The navigation is organized as a hierarchical tree of nodes.
- **Node Types**:
    - **Directory**: A node that contains other nodes.
    - **Action**: A leaf node that triggers a callback function.
    - **Input**: A leaf node that allows for user input and stores the value in local storage.
    - **Virtual Directory**: A leaf node that dynamically generates a directory listing upon selection.
- **Initialization**: The directory tree can be initialized from a JavaScript object.
- **Usage**: Intended usage in userscripts as a all in one Frontend UI component to run actions update settings and otherwise interact with userscripts. 
    - **API design**: designed with that in mind. the library attaches itself to the body of the page it is being run on, put in a shadow dom to avoid any styling clashes.

## I. Window Component

- [x] **Floating and Draggable**: The window can be moved around the screen by dragging the title bar.
- [x] **Resizable**: The window can be resized from the bottom-right corner.
- [x] **State Persistence**: The window's position and size are saved to local storage and restored on reload.
- [x] **Initial State**: Defaults to a centered position with a size of 25vw and 25vh.
- [x] **Controls**:
    - [x] **Close Button (`X`)**: Hides the window.
    - [x] **Resize to Default Button (`□`)**: Resets the window to its default size and position.
    - [x] **Back Button (`←`)**: Navigates up one level in the directory hierarchy. ~~Disabled at the root level~~.
        - [ ] Changes to > on root directory instead of disabling, now it should change to command palette mode and back ^ to directory view
- [x] **Title**:
    - [x] The title bar displays the name of the current directory.
    - [ ] The title should support a provider component for live updates (Partially implemented, uses a context but not a full provider component).

## II. Main Navigation View

- [x] **Breadcrumbs**:
    - [x] Displays the current directory path.
    - [x] Clicking a breadcrumb navigates to that directory.
    - [x] If the path is more than 4 levels deep, it truncates to show `...` and the last 3 directories.
- [x] **Directory Listing**:
    - [x] Shows the contents of the current directory.
    - [x] Items are numbered 1-9 for keyboard selection.
- [x] **Pagination**:
    - [x] Enabled when a directory contains more than 9 items.
    - [x] Maximum of 3 pages (23 items total).
    - [x] Pagination dots are displayed at the bottom to indicate the current page.
    - [x] Use `1` for the previous page and `9` for the next page.

## III. Keyboard Shortcuts

- [x] **Toggle Visibility/Focus**:
    - [x] `Ctrl+\``:
        - If hidden, shows and focuses the window.
        - If visible and focused, hides the window.
        - If visible and not focused, focuses the window.
- [x] **While Focused**:
    - [x] `Backspace`: Navigates up one directory.
    - [x] `1`-`9`: Selects the corresponding item in the directory listing.
    - [x] `Esc`: Hides the component.
    - [x] `\``: Enters Command Palette mode.

## IV. Command Palette

- [x] **Activation**: Pressing `\`` in the main navigation view opens the command palette.
- [x] **Fuzzy Find**:
    - [x] Searches through all leaf nodes in the entire directory tree.
    - [x] Displays results sorted by relevance.
- [x] **Keyboard Navigation**:
    - [x] `ArrowUp`/`ArrowDown`: Selects the previous/next result.
    - [x] `Enter`: Activates the selected item.
    - [x] `Esc`:
        - If the search term is not empty, clears the search term.
        - If the search term is empty, exits the command palette and hides the window.
- [x] **Functionality**:
    - [x] After activating an item, the component resets to the root directory.
    - [ ] Escape twice during command palette mode should hide everything (Currently, one escape with an empty search term hides everything).

## V. Node Types in Detail

- [x] **Directory**: Navigates to a subdirectory.
- [x] **Action**: Executes a user-defined callback function.
- [x] **Input**:
    - [x] On selection, focuses an input field.
    - [x] `Enter`: Saves the input value to local storage.
    - [x] `Esc`: Cancels the input.
- [x] **Virtual Directory**:
    - [x] On selection, executes an asynchronous action to fetch and display a new directory listing.
    - [x] A loading indicator is shown during the fetch.
    - [ ] Cache results per page.
    - [ ] Include a button for a hard reload to re-run the action.

## VI. Meta

- [x] **Meta Settings**: settings that show up in the directory implicitly and only show in command palette to avoid cluttering user defined directories. These are settings for the component itself, like themeing and other defaults.
- [x] **Theme Switching**:
    - [x] A `meta/theme` directory allows switching between `Light`, `Dark`, and `System` themes.
    - [x] The selected theme is persisted in local storage.
- [ ] **Default View**:
    - [ ] Default to Directory view (this is already the default)
    - [ ] Default to Command Palette view


## VII. Future/Unimplemented Features from Original Document

- [ ] **Tree Initialization via API**: An API method to programmatically add nodes to the tree.
- [ ] **Custom Event for Actions**: An alternative to callbacks for handling actions.
- [ ] **Input Signal Agnosticism**: Ensure the input node type is not tied to a specific state management library (e.g., signals).
- [ ] **Error on > 3 Pages**: Throw an error if a directory is defined with more than 23 items.

```