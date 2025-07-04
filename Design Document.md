## Features
1. OS like window design
	1. Floating
	2. Draggable
		1. Only draggable from title bar
	3. Resizable
		1. Old-school style handle at the bottom right corner for resizing
	4. Default 25vw and 25vh and centered initial position
	5. Top right has an 'x' and a box just like the maximize button on windows
		1. the x will hide the window
		2. the box will resize to default instead of maximize
	6. Top left will deviate from the standard OS window and will look like a android feature with a back button for navigating up a directory
		1. disabled when in the root directory
	7. Center on the title bar will be the title
		1. Should support a provider component that resolves to a string for live updates
		2. can take a plain string too
	8. Main body of the window
		1. Will have the breadcrumbs, then the body of the navigation, then pagination dots centered at the bottom
			1. Breadcrumbs show the hierarchy of the directory. If it get more than 3 deep only show the last 3 (e.g. .../sub/directory/listing)
			2. Body shows the directory.
			3. Pagination dots should be centered at the bottom and only show if there is more than one page. IE more than 9 options in the directory. 
2. Keyboard 
	1. Configurable show/hide/focus shortcut
		1. default to Ctrl+\`
		2. Show if hidden then focus
		3. Hide if shown & focused
		4. Focus if shown & not focused
	2. While focused
		1. backspace goes up a directory
		2. numbers and numpad will select options 1-9 respectively
		3. Esc hides the component same as Ctrl+\` while focused
		4. \` will open command palette mode
			1. like its namesake will change the component to have a command palette with a fuzzy find search for all the leaf nodes.
			2. Enter activates the selected element (asking for input if necessary, then enter again to confirm)
			3. Resets to root directory after completion. 
			4. Escape key at anytime to escape the palette back to the root directory.
			5. Escape twice during command palette mode should hide everything.
3. Design
	1. Uses a tree data structure to organize a hierarchy of options to select
	2. Tree should have two ways to initialize
		1. API method calls to add subdirectories and leaf nodes
		2. Use JS object notation as a easy DSL
			1. design a schema TODO
	3. If a subdirectory has more than 9 nodes, paginate
		1. use 1 for going back a page
		2. use 9 for going forward a page
		3. use the pagination dots to indicate current page
		4. restrict having more than 3 pages by throwing an error
		5. max is 23 (8 + 7 + 8). first and third page will never need a previous and next button respectively so first can handle 8 (9 if that is the total), second page can handle 7 or 8 if the total is more than 15 or equal to 15 respectively and the third page can take 8 where 1 is always a previous button.
4. Navigation
	1. Subdirectories
		1. navigation to a subdirectory will render that directory and update the breadcrumbs to match the new position and follow pagination rules depending on the size
	2. Leaf Nodes
		1. Three types; more to be determined
			1. action
				1. is just a button that will run a user defined action
					1. callback passed when leaf was created
					2. or a custom event. 
					3. pros and cons and other ideas for how to actually define the actions are still needed. for now callback function suffice
			2. input
				1. will take a signal for live updates and should be agnostic of how the data is stored (DB, LocalStorage, Etc)
				2. User flow:
					1. Press corresponding number -> focus input -> edit -> press enter -> submit changes (if any) to application state
			3. Virtual Directory (computed)
				1. A leaf node can turn into a directory (on selection or on page load) based on the output of the action
				2. Use a loading spinner upon rendering any virtual directory to signify its async nature and render as normal after action returns
				3. Cache results per page
				4. include a button on the right side of the virtual directory leaf for hard reloading to run the action again for updated results
				5. 