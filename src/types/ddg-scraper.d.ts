declare module 'ddg-scraper' {
  export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    icon?: string;
  }

  export interface SearchOptions {
    query: string;
    limit?: number;
    userAgent?: string;
  }

  export function search(options: SearchOptions): Promise<SearchResult[]>;
  export function search(query: string): Promise<SearchResult[]>;
}
