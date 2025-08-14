import { Component, For } from 'solid-js';
import { useTitle } from '../TitleContext';

const Breadcrumbs: Component = () => {
  const { title, setTitle } = useTitle();

  return (
    <nav id="breadcrumbs" class="breadcrumbs-container" aria-label="Directory breadcrumb navigation">
      <ol class="breadcrumb-list" role="list">
        <For each={title()}>{(segment, index) => (
          <li class="breadcrumb-list-item" role="listitem">
            {segment.isClickable ? (
              <button
                id={`breadcrumb-${index()}`}
                class="breadcrumb-item clickable"
                onClick={() => setTitle(segment.path)}
                aria-label={`Navigate to ${segment.name} directory`}
                aria-current={index() === title().length - 1 ? "page" : undefined}
              >
                {segment.name}
              </button>
            ) : (
              <span
                id={`breadcrumb-${index()}`}
                class="breadcrumb-item"
                aria-current={index() === title().length - 1 ? "page" : undefined}
              >
                {segment.name}
              </span>
            )}
            {index() < title().length - 1 && (
              <span class="breadcrumb-separator" aria-hidden="true">/</span>
            )}
          </li>
        )}</For>
      </ol>
    </nav>
  );
};

export default Breadcrumbs;