# Requirements Document

## Introduction

DirNav is a comprehensive directory navigation UI component designed for userscripts and web applications. It provides an OS-like window interface with keyboard shortcuts, command palette functionality, and support for various node types including directories, actions, inputs, and virtual directories. The component is designed to be embedded in any web page through a shadow DOM to avoid styling conflicts.

## Requirements

### Requirement 1: Window Management System

**User Story:** As a user, I want a floating, draggable, and resizable window interface, so that I can position and size the navigation component according to my preferences.

#### Acceptance Criteria

1. WHEN the component is initialized THEN the system SHALL display a floating window with default dimensions of 25vw by 25vh
2. WHEN the component is initialized THEN the system SHALL center the window on the screen
3. WHEN the user drags the title bar THEN the system SHALL move the window to follow the cursor
4. WHEN the user drags the resize handle in the bottom-right corner THEN the system SHALL resize the window accordingly
5. WHEN the user closes and reopens the component THEN the system SHALL restore the previous window position and size from local storage
6. WHEN the user clicks the close button (X) THEN the system SHALL hide the window
7. WHEN the user clicks the resize-to-default button (□) THEN the system SHALL reset the window to default size and centered position

### Requirement 2: Navigation Controls

**User Story:** As a user, I want intuitive navigation controls in the window title bar, so that I can easily navigate through directory hierarchies.

#### Acceptance Criteria

1. WHEN the user is not at the root directory THEN the system SHALL display a back button (←) in the top-left of the title bar
2. WHEN the user clicks the back button THEN the system SHALL navigate up one directory level
3. WHEN the user is at the root directory THEN the system SHALL display a command palette button (>) instead of the back button
4. WHEN the user clicks the command palette button THEN the system SHALL switch to command palette mode
5. WHEN in the title bar center THEN the system SHALL display the current directory name
6. WHEN the directory name changes THEN the system SHALL update the title dynamically

### Requirement 3: Directory Display and Navigation

**User Story:** As a user, I want to see directory contents with breadcrumbs and pagination, so that I can navigate through hierarchical data structures efficiently.

#### Acceptance Criteria

1. WHEN viewing a directory THEN the system SHALL display breadcrumbs showing the current path
2. WHEN the path is more than 4 levels deep THEN the system SHALL truncate breadcrumbs to show "..." and the last 3 directories
3. WHEN the user clicks a breadcrumb THEN the system SHALL navigate to that directory level
4. WHEN a directory contains 9 or fewer items THEN the system SHALL display all items numbered 1-9
5. WHEN a directory contains more than 9 items THEN the system SHALL paginate with a maximum of 3 pages (23 items total)
6. WHEN pagination is active THEN the system SHALL display pagination dots at the bottom indicating current page
7. WHEN on page 2 or 3 THEN the system SHALL use option 1 for "previous page"
8. WHEN on page 1 or 2 THEN the system SHALL use option 9 for "next page"

### Requirement 4: Keyboard Shortcuts and Controls

**User Story:** As a user, I want comprehensive keyboard shortcuts, so that I can navigate efficiently without using the mouse.

#### Acceptance Criteria

1. WHEN the user presses Ctrl+` and the component is hidden THEN the system SHALL show and focus the window
2. WHEN the user presses Ctrl+` and the component is visible and focused THEN the system SHALL hide the window
3. WHEN the user presses Ctrl+` and the component is visible but not focused THEN the system SHALL focus the window
4. WHEN the component is focused and the user presses numbers 1-9 THEN the system SHALL select the corresponding directory item
5. WHEN the component is focused and the user presses Backspace THEN the system SHALL navigate up one directory
6. WHEN the component is focused and the user presses Esc THEN the system SHALL hide the component
7. WHEN the component is focused and the user presses ` THEN the system SHALL enter command palette mode

### Requirement 5: Command Palette Functionality

**User Story:** As a user, I want a command palette with fuzzy search, so that I can quickly find and access any item in the entire directory tree.

#### Acceptance Criteria

1. WHEN the user activates command palette mode THEN the system SHALL display a search input field
2. WHEN the user types in the search field THEN the system SHALL perform fuzzy search across all leaf nodes
3. WHEN search results are displayed THEN the system SHALL sort them by relevance
4. WHEN the user presses Arrow Up/Down THEN the system SHALL navigate through search results
5. WHEN the user presses Enter on a selected result THEN the system SHALL activate that item
6. WHEN the user presses Esc with non-empty search THEN the system SHALL clear the search term
7. WHEN the user presses Esc with empty search THEN the system SHALL exit command palette and hide the window
8. WHEN an item is activated from command palette THEN the system SHALL reset to root directory

### Requirement 6: Node Type Support

**User Story:** As a developer, I want support for different node types (directories, actions, inputs, virtual directories), so that I can create flexible navigation structures for various use cases.

#### Acceptance Criteria

1. WHEN a directory node is selected THEN the system SHALL navigate to that subdirectory
2. WHEN an action node is selected THEN the system SHALL execute the associated callback function
3. WHEN an input node is selected THEN the system SHALL focus an input field for editing
4. WHEN editing an input and the user presses Enter THEN the system SHALL save the value to local storage
5. WHEN editing an input and the user presses Esc THEN the system SHALL cancel the input operation
6. WHEN a virtual directory node is selected THEN the system SHALL execute an async action to fetch directory contents
7. WHEN a virtual directory is loading THEN the system SHALL display a loading indicator
8. WHEN a virtual directory loads successfully THEN the system SHALL display the generated directory listing

### Requirement 7: Theme and Meta Settings

**User Story:** As a user, I want theme options and component settings, so that I can customize the appearance and behavior of the navigation component.

#### Acceptance Criteria

1. WHEN accessing meta settings THEN the system SHALL provide theme switching options (Light, Dark, System)
2. WHEN a theme is selected THEN the system SHALL apply the theme immediately
3. WHEN a theme is selected THEN the system SHALL persist the choice in local storage
4. WHEN the component loads THEN the system SHALL restore the previously selected theme
5. WHEN meta settings are accessed THEN the system SHALL show them only in command palette to avoid cluttering user directories

### Requirement 8: Data Structure and Initialization

**User Story:** As a developer, I want flexible ways to initialize the directory tree, so that I can easily configure the navigation structure for my application.

#### Acceptance Criteria

1. WHEN initializing the component THEN the system SHALL accept a JavaScript object representing the directory tree
2. WHEN a directory contains more than 23 items THEN the system SHALL throw an error during initialization
3. WHEN the component is embedded in a page THEN the system SHALL use shadow DOM to prevent styling conflicts
4. WHEN the component is attached THEN the system SHALL append itself to the document body