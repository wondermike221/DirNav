import { Component, For } from 'solid-js';
import { useTitle } from '../TitleContext';

const Breadcrumbs: Component = () => {
  const { title, setTitle } = useTitle();

  return (
    <nav id="breadcrumbs" class="breadcrumbs-container">
      <For each={title()}>{(segment, index) => (
        <span
          id={`breadcrumb-${index()}`}
          class={segment.isClickable ? 'breadcrumb-item clickable' : 'breadcrumb-item'}
          onClick={() => segment.isClickable && setTitle(segment.path)}
        >
          {segment.name}{index() < title().length - 1 ? '/' : ''}
        </span>
      )}</For>
    </nav>
  );
};

export default Breadcrumbs;