import { createContext, useContext } from 'solid-js';
import { Accessor, Setter } from 'solid-js';

interface TitleContextType {
  title: Accessor<string>;
  setTitle: Setter<string>;
}

export const TitleContext = createContext<TitleContextType>();

export const useTitle = () => {
  const context = useContext(TitleContext);
  if (!context) {
    throw new Error('useTitle must be used within a TitleProvider');
  }
  return context;
};
