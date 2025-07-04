import { Component, For } from 'solid-js';
import { useTitle } from '../TitleContext';

const Breadcrumbs: Component = () => {
  const { title, setTitle } = useTitle();

  return (
    <div class="breadcrumbs-container">
      <For each={title()}>{(segment, index) => (
        <span
          class={segment.isClickable ? 'breadcrumb-item clickable' : 'breadcrumb-item'}
          onClick={() => segment.isClickable && setTitle(segment.path)}
        >
          {segment.name}{index() < title().length - 1 ? '/' : ''}
        </span>
      )}</For>
    </div>
  );
};

export default Breadcrumbs;