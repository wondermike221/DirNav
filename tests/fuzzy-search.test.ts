import { test, expect } from '@playwright/test';
import { FuzzySearchEngine, fuzzySearch, SearchResult } from '../src/utils/fuzzySearch';
import { FlatDirNode } from '../src/types';

// Test data setup
const createTestNodes = (): FlatDirNode[] => [
  { name: 'home', type: 'directory', fullPath: 'home' },
  { name: 'documents', type: 'directory', fullPath: 'home/documents' },
  { name: 'projects', type: 'directory', fullPath: 'home/documents/projects' },
  { name: 'react-app', type: 'directory', fullPath: 'home/documents/projects/react-app' },
  { name: 'src', type: 'directory', fullPath: 'home/documents/projects/react-app/src' },
  { name: 'components', type: 'directory', fullPath: 'home/documents/projects/react-app/src/components' },
  { name: 'Button.tsx', type: 'action', fullPath: 'home/documents/projects/react-app/src/components/Button.tsx', action: () => {} },
  { name: 'Modal.tsx', type: 'action', fullPath: 'home/documents/projects/react-app/src/components/Modal.tsx', action: () => {} },
  { name: 'Header.tsx', type: 'action', fullPath: 'home/documents/projects/react-app/src/components/Header.tsx', action: () => {} },
  { name: 'utils', type: 'directory', fullPath: 'home/documents/projects/react-app/src/utils' },
  { name: 'helpers.ts', type: 'action', fullPath: 'home/documents/projects/react-app/src/utils/helpers.ts', action: () => {} },
  { name: 'api.ts', type: 'action', fullPath: 'home/documents/projects/react-app/src/utils/api.ts', action: () => {} },
  { name: 'config', type: 'directory', fullPath: 'home/documents/projects/react-app/config' },
  { name: 'webpack.config.js', type: 'action', fullPath: 'home/documents/projects/react-app/config/webpack.config.js', action: () => {} },
  { name: 'package.json', type: 'action', fullPath: 'home/documents/projects/react-app/package.json', action: () => {} },
  { name: 'README.md', type: 'action', fullPath: 'home/documents/projects/react-app/README.md', action: () => {} },
  { name: 'vue-app', type: 'directory', fullPath: 'home/documents/projects/vue-app' },
  { name: 'main.js', type: 'action', fullPath: 'home/documents/projects/vue-app/main.js', action: () => {} },
  { name: 'App.vue', type: 'action', fullPath: 'home/documents/projects/vue-app/App.vue', action: () => {} },
  { name: 'downloads', type: 'directory', fullPath: 'home/downloads' },
  { name: 'image.png', type: 'action', fullPath: 'home/downloads/image.png', action: () => {} },
  { name: 'document.pdf', type: 'action', fullPath: 'home/downloads/document.pdf', action: () => {} },
  { name: 'music', type: 'directory', fullPath: 'home/music' },
  { name: 'song.mp3', type: 'action', fullPath: 'home/music/song.mp3', action: () => {} },
  { name: 'playlist.m3u', type: 'action', fullPath: 'home/music/playlist.m3u', action: () => {} },
  { name: 'settings', type: 'input', fullPath: 'settings', localStorageKey: 'settings' },
  { name: 'user-preferences', type: 'input', fullPath: 'user-preferences', localStorageKey: 'user-prefs' },
];

test.describe('FuzzySearchEngine', () => {
  let searchEngine: FuzzySearchEngine;
  let testNodes: FlatDirNode[];

  test.beforeEach(() => {
    searchEngine = new FuzzySearchEngine();
    testNodes = createTestNodes();
  });

  test('should return empty results for empty search term', () => {
    const results = searchEngine.search(testNodes, '');
    expect(results).toHaveLength(0);
  });

  test('should return empty results for whitespace-only search term', () => {
    const results = searchEngine.search(testNodes, '   ');
    expect(results).toHaveLength(0);
  });

  test('should find exact name matches with highest score', () => {
    const results = searchEngine.search(testNodes, 'home');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].node.name).toBe('home');
    expect(results[0].score).toBeGreaterThan(100);
  });

  test('should find prefix matches with high scores', () => {
    const results = searchEngine.search(testNodes, 'doc');
    const documentResults = results.filter(r => r.node.name.startsWith('doc'));
    expect(documentResults.length).toBeGreaterThan(0);
    expect(documentResults[0].score).toBeGreaterThan(50);
  });

  test('should find partial matches in file names', () => {
    const results = searchEngine.search(testNodes, 'tsx');
    const tsxFiles = results.filter(r => r.node.name.includes('.tsx'));
    expect(tsxFiles.length).toBe(3); // Button.tsx, Modal.tsx, Header.tsx
    expect(tsxFiles.every(r => r.score > 0)).toBe(true);
  });

  test('should support partial path matching', () => {
    const results = searchEngine.search(testNodes, 'react/src');
    const reactSrcResults = results.filter(r => 
      r.node.fullPath.includes('react-app') && r.node.fullPath.includes('src')
    );
    expect(reactSrcResults.length).toBeGreaterThan(0);
  });

  test('should support path segment matching', () => {
    const results = searchEngine.search(testNodes, 'components');
    const componentResults = results.filter(r => 
      r.node.fullPath.includes('components')
    );
    expect(componentResults.length).toBeGreaterThan(0);
    // Should include both the components directory and files within it
    expect(componentResults.some(r => r.node.name === 'components')).toBe(true);
    expect(componentResults.some(r => r.node.fullPath.includes('components/Button.tsx'))).toBe(true);
  });

  test('should rank shorter paths higher for same relevance', () => {
    const results = searchEngine.search(testNodes, 'app');
    const appResults = results.filter(r => r.node.name.includes('app'));
    
    if (appResults.length >= 2) {
      // Among results with similar scores, shorter paths should rank higher
      const sortedByPath = [...appResults].sort((a, b) => a.node.fullPath.length - b.node.fullPath.length);
      const actualOrder = appResults.slice(0, sortedByPath.length);
      
      // Check that results are generally ordered by path length for similar scores
      for (let i = 0; i < actualOrder.length - 1; i++) {
        if (Math.abs(actualOrder[i].score - actualOrder[i + 1].score) < 1) {
          expect(actualOrder[i].node.fullPath.length).toBeLessThanOrEqual(actualOrder[i + 1].node.fullPath.length);
        }
      }
    }
  });

  test('should handle fuzzy character sequence matching', () => {
    const results = searchEngine.search(testNodes, 'btntsx');
    const buttonResult = results.find(r => r.node.name === 'Button.tsx');
    expect(buttonResult).toBeDefined();
    expect(buttonResult!.score).toBeGreaterThan(0);
  });

  test('should handle case-insensitive search', () => {
    const lowerResults = searchEngine.search(testNodes, 'button');
    const upperResults = searchEngine.search(testNodes, 'BUTTON');
    const mixedResults = searchEngine.search(testNodes, 'BuTtOn');
    
    expect(lowerResults.length).toBe(upperResults.length);
    expect(lowerResults.length).toBe(mixedResults.length);
    expect(lowerResults[0].node.name).toBe(upperResults[0].node.name);
  });

  test('should respect maxResults option', () => {
    const engine = new FuzzySearchEngine({ maxResults: 5 });
    const results = engine.search(testNodes, 'a'); // Should match many items
    expect(results.length).toBeLessThanOrEqual(5);
  });

  test('should respect minScore option', () => {
    const engine = new FuzzySearchEngine({ minScore: 10 });
    const results = engine.search(testNodes, 'xyz'); // Should match few items with low scores
    expect(results.every(r => r.score >= 10)).toBe(true);
  });

  test('should provide matched segments for highlighting', () => {
    const results = searchEngine.search(testNodes, 'react');
    const reactResult = results.find(r => r.node.fullPath.includes('react-app'));
    expect(reactResult).toBeDefined();
    expect(reactResult!.matchedSegments.length).toBeGreaterThan(0);
    expect(reactResult!.matchedSegments.some(segment => segment.includes('react'))).toBe(true);
  });

  test('should handle special characters in search terms', () => {
    const results = searchEngine.search(testNodes, 'package.json');
    const packageResult = results.find(r => r.node.name === 'package.json');
    expect(packageResult).toBeDefined();
    expect(packageResult!.score).toBeGreaterThan(0);
  });

  test('should handle multi-word search terms', () => {
    const results = searchEngine.search(testNodes, 'react app');
    const reactAppResults = results.filter(r => 
      r.node.fullPath.includes('react-app')
    );
    expect(reactAppResults.length).toBeGreaterThan(0);
  });

  test('should prioritize word boundary matches', () => {
    const results = searchEngine.search(testNodes, 'app');
    const appResults = results.filter(r => r.node.name.includes('app'));
    
    // Results with 'app' at word boundaries should score higher
    if (appResults.length >= 2) {
      const wordBoundaryResult = appResults.find(r => 
        r.node.name.startsWith('app') || r.node.name.includes('-app') || r.node.name.includes('_app')
      );
      const nonBoundaryResult = appResults.find(r => 
        r.node.name.includes('app') && !r.node.name.startsWith('app') && 
        !r.node.name.includes('-app') && !r.node.name.includes('_app')
      );
      
      if (wordBoundaryResult && nonBoundaryResult) {
        expect(wordBoundaryResult.score).toBeGreaterThanOrEqual(nonBoundaryResult.score);
      }
    }
  });

  test('should handle performance with large datasets', () => {
    // Create a larger dataset
    const largeDataset: FlatDirNode[] = [];
    for (let i = 0; i < 1000; i++) {
      largeDataset.push({
        name: `item-${i}`,
        type: 'action',
        fullPath: `category-${Math.floor(i / 100)}/subcategory-${Math.floor(i / 10)}/item-${i}`,
        action: () => {}
      });
    }

    const startTime = performance.now();
    const results = searchEngine.search(largeDataset, 'item');
    const endTime = performance.now();
    
    expect(results.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
  });

  test('should update options correctly', () => {
    const initialResults = searchEngine.search(testNodes, 'test');
    
    searchEngine.updateOptions({ maxResults: 1 });
    const limitedResults = searchEngine.search(testNodes, 'a');
    
    expect(limitedResults.length).toBeLessThanOrEqual(1);
  });
});

test.describe('Convenience fuzzySearch function', () => {
  test('should work with default options', () => {
    const testNodes = createTestNodes();
    const results = fuzzySearch(testNodes, 'home');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].node.name).toBe('home');
  });

  test('should work with custom options', () => {
    const testNodes = createTestNodes();
    const results = fuzzySearch(testNodes, 'a', { maxResults: 3 });
    
    expect(results.length).toBeLessThanOrEqual(3);
  });
});

test.describe('Search accuracy and relevance', () => {
  test('should rank exact matches highest', () => {
    const testNodes = createTestNodes();
    const results = fuzzySearch(testNodes, 'home');
    
    expect(results[0].node.name).toBe('home');
    expect(results[0].score).toBeGreaterThan(100);
  });

  test('should rank prefix matches higher than substring matches', () => {
    const testNodes = createTestNodes();
    const results = fuzzySearch(testNodes, 'doc');
    
    const prefixMatch = results.find(r => r.node.name.startsWith('doc'));
    const substringMatch = results.find(r => 
      r.node.name.includes('doc') && !r.node.name.startsWith('doc')
    );
    
    if (prefixMatch && substringMatch) {
      expect(prefixMatch.score).toBeGreaterThan(substringMatch.score);
    }
  });

  test('should handle complex search scenarios', () => {
    const testNodes = createTestNodes();
    
    // Test searching for file extensions - should find .tsx files with high relevance
    const tsxResults = fuzzySearch(testNodes, 'tsx');
    const tsxFiles = tsxResults.filter(r => r.node.name.includes('.tsx'));
    expect(tsxFiles.length).toBeGreaterThan(0);
    expect(tsxFiles.length).toBe(3); // Button.tsx, Modal.tsx, Header.tsx
    
    // Test searching for path components
    const srcResults = fuzzySearch(testNodes, 'src/components');
    expect(srcResults.some(r => 
      r.node.fullPath.includes('src') && r.node.fullPath.includes('components')
    )).toBe(true);
    
    // Test searching for partial file names
    const configResults = fuzzySearch(testNodes, 'config');
    expect(configResults.some(r => r.node.name.includes('config'))).toBe(true);
  });

  test('should maintain consistent ordering for repeated searches', () => {
    const testNodes = createTestNodes();
    
    const results1 = fuzzySearch(testNodes, 'app');
    const results2 = fuzzySearch(testNodes, 'app');
    
    expect(results1.length).toBe(results2.length);
    for (let i = 0; i < results1.length; i++) {
      expect(results1[i].node.name).toBe(results2[i].node.name);
      expect(results1[i].score).toBe(results2[i].score);
    }
  });
});