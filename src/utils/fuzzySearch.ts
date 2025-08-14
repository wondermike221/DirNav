import { FlatDirNode } from '../types';
import { LRUCache, createMemoizedFunction, performanceMonitor } from './performance';

export interface SearchResult {
  node: FlatDirNode;
  score: number;
  matchedSegments: string[];
}

export interface SearchOptions {
  maxResults?: number;
  minScore?: number;
  pathWeight?: number;
  nameWeight?: number;
  sequenceWeight?: number;
  exactMatchBonus?: number;
  prefixMatchBonus?: number;
}

const DEFAULT_OPTIONS: Required<SearchOptions> = {
  maxResults: 50,
  minScore: 0.1,
  pathWeight: 0.3,
  nameWeight: 0.7,
  sequenceWeight: 2.0,
  exactMatchBonus: 100,
  prefixMatchBonus: 50,
};

/**
 * Enhanced fuzzy search algorithm with improved relevance scoring
 * and partial path matching support
 */
export class FuzzySearchEngine {
  private options: Required<SearchOptions>;
  private scoreCache = new LRUCache<string, number>(1000);
  private resultCache = new LRUCache<string, SearchResult[]>(200);
  private memoizedCalculateScore: (node: FlatDirNode, term: string) => number;

  constructor(options: SearchOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Create memoized version of score calculation
    this.memoizedCalculateScore = createMemoizedFunction(
      (node: FlatDirNode, term: string) => this.calculateScoreInternal(node, term),
      (node, term) => `${node.fullPath}:${term}`,
      1000
    );
  }

  /**
   * Performs fuzzy search on a list of nodes
   */
  search(nodes: FlatDirNode[], term: string): SearchResult[] {
    if (!term.trim()) return [];

    const normalizedTerm = term.toLowerCase().trim();
    
    // Check cache first
    const cacheKey = `${nodes.length}:${normalizedTerm}:${JSON.stringify(this.options)}`;
    const cached = this.resultCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const endMeasurement = performanceMonitor.start('fuzzy-search');
    
    const results: SearchResult[] = [];

    for (const node of nodes) {
      const score = this.memoizedCalculateScore(node, normalizedTerm);
      if (score >= this.options.minScore) {
        results.push({
          node,
          score,
          matchedSegments: this.getMatchedSegments(node, normalizedTerm),
        });
      }
    }

    // Sort by score (descending) and then by path length (ascending) for tie-breaking
    results.sort((a, b) => {
      if (Math.abs(b.score - a.score) < 0.001) {
        return a.node.fullPath.length - b.node.fullPath.length;
      }
      return b.score - a.score;
    });

    const finalResults = results.slice(0, this.options.maxResults);
    
    // Cache the results
    this.resultCache.set(cacheKey, finalResults);
    
    endMeasurement();
    return finalResults;
  }

  /**
   * Calculates relevance score for a node against the search term
   */
  private calculateScore(node: FlatDirNode, term: string): number {
    return this.memoizedCalculateScore(node, term);
  }

  /**
   * Internal score calculation method (memoized)
   */
  private calculateScoreInternal(node: FlatDirNode, term: string): number {
    const name = node.name.toLowerCase();
    const fullPath = node.fullPath.toLowerCase();
    const pathSegments = fullPath.split('/');

    let score = 0;

    // Exact matches get highest priority
    if (name === term) {
      score += this.options.exactMatchBonus;
    }

    // Prefix matches get high priority
    if (name.startsWith(term)) {
      score += this.options.prefixMatchBonus;
    }

    // Name-based scoring
    const nameScore = this.calculateStringScore(name, term);
    score += nameScore * this.options.nameWeight;

    // Path-based scoring (check each path segment)
    let maxPathSegmentScore = 0;
    for (const segment of pathSegments) {
      const segmentScore = this.calculateStringScore(segment, term);
      maxPathSegmentScore = Math.max(maxPathSegmentScore, segmentScore);
    }
    score += maxPathSegmentScore * this.options.pathWeight;

    // Full path scoring for partial path matching
    const fullPathScore = this.calculateStringScore(fullPath, term);
    score += fullPathScore * this.options.pathWeight * 0.5;

    // Sequence matching bonus (characters in order)
    const sequenceScore = this.calculateSequenceScore(fullPath, term);
    score += sequenceScore * this.options.sequenceWeight;

    // Normalize score based on term length and path complexity
    const lengthPenalty = Math.max(0, fullPath.length - term.length) * 0.01;
    score = Math.max(0, score - lengthPenalty);

    return score;
  }

  /**
   * Calculates score for string matching with character frequency and position
   */
  private calculateStringScore(str: string, term: string): number {
    if (!str || !term) return 0;

    let score = 0;
    let termIndex = 0;
    let consecutiveMatches = 0;
    let lastMatchIndex = -1;

    for (let i = 0; i < str.length && termIndex < term.length; i++) {
      if (str[i] === term[termIndex]) {
        // Character match found
        score += 1;
        termIndex++;

        // Bonus for consecutive matches
        if (i === lastMatchIndex + 1) {
          consecutiveMatches++;
          score += consecutiveMatches * 0.5;
        } else {
          consecutiveMatches = 0;
        }

        // Bonus for matches at word boundaries
        if (i === 0 || str[i - 1] === '/' || str[i - 1] === ' ' || str[i - 1] === '-' || str[i - 1] === '_') {
          score += 2;
        }

        lastMatchIndex = i;
      }
    }

    // Bonus if all characters were found
    if (termIndex === term.length) {
      score += 10;
      
      // Additional bonus for complete matches
      if (str.includes(term)) {
        score += 15;
      }
    }

    // Normalize by string length to favor shorter matches
    return score / Math.max(str.length, term.length);
  }

  /**
   * Calculates sequence score for characters appearing in order
   */
  private calculateSequenceScore(str: string, term: string): number {
    if (!str || !term) return 0;

    let score = 0;
    let termIndex = 0;
    let gapPenalty = 0;

    for (let i = 0; i < str.length && termIndex < term.length; i++) {
      if (str[i] === term[termIndex]) {
        // Reduce gap penalty for closer matches
        score += Math.max(1, 5 - gapPenalty);
        termIndex++;
        gapPenalty = 0;
      } else {
        gapPenalty = Math.min(gapPenalty + 0.1, 3);
      }
    }

    // Bonus for completing the sequence
    if (termIndex === term.length) {
      score += 5;
    }

    return score;
  }

  /**
   * Gets matched segments for highlighting purposes
   */
  private getMatchedSegments(node: FlatDirNode, term: string): string[] {
    const segments: string[] = [];
    const pathParts = node.fullPath.toLowerCase().split('/');
    
    for (const part of pathParts) {
      if (part.includes(term)) {
        segments.push(part);
      }
    }

    // Always include the name if it matches
    const name = node.name.toLowerCase();
    if (name.includes(term) && !segments.includes(name)) {
      segments.push(name);
    }

    return segments;
  }

  /**
   * Updates search options and clears caches
   */
  updateOptions(options: Partial<SearchOptions>): void {
    this.options = { ...this.options, ...options };
    // Clear caches when options change
    this.scoreCache.clear();
    this.resultCache.clear();
  }

  /**
   * Clears all caches
   */
  clearCache(): void {
    this.scoreCache.clear();
    this.resultCache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { scoreCache: number; resultCache: number } {
    return {
      scoreCache: this.scoreCache.size(),
      resultCache: this.resultCache.size()
    };
  }
}

/**
 * Default fuzzy search instance
 */
export const defaultFuzzySearch = new FuzzySearchEngine();

/**
 * Convenience function for quick searches
 */
export function fuzzySearch(nodes: FlatDirNode[], term: string, options?: SearchOptions): SearchResult[] {
  if (options) {
    const engine = new FuzzySearchEngine(options);
    return engine.search(nodes, term);
  }
  return defaultFuzzySearch.search(nodes, term);
}