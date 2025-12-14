/**
 * @fileoverview RSS service for fetching Bun updates
 * @description Service to fetch and parse Bun's RSS feed for latest updates
 */

import { API_ENDPOINTS } from '../../shared/constants';

export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

export interface RSSFeed {
  title: string;
  link: string;
  description: string;
  lastBuildDate: string;
  items: RSSItem[];
}

export class RSSService {
  private cache: { data: RSSFeed | null; timestamp: number } = {
    data: null,
    timestamp: 0
  };

  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch Bun RSS feed
   */
  async fetchBunUpdates(): Promise<RSSFeed> {
    // Check cache first
    const now = Date.now();
    if (this.cache.data && (now - this.cache.timestamp) < this.cacheDuration) {
      return this.cache.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(API_ENDPOINTS.rss, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'Bun-Dashboard/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`RSS fetch failed: ${response.status}`);
      }

      const xmlText = await response.text();
      const feed = this.parseRSS(xmlText);

      // Cache the result
      this.cache = {
        data: feed,
        timestamp: now
      };

      return feed;
    } catch (error) {
      console.error('Failed to fetch Bun RSS feed:', error);

      // Return cached data if available, otherwise throw
      if (this.cache.data) {
        console.warn('Returning cached RSS data due to fetch error');
        return this.cache.data;
      }

      throw error;
    }
  }

  /**
   * Parse RSS XML to structured data
   */
  private parseRSS(xmlText: string): RSSFeed {
    // Simple XML parsing - in production, consider using a proper XML parser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const channel = xmlDoc.querySelector('channel');
    if (!channel) {
      throw new Error('Invalid RSS format: no channel element found');
    }

    const items: RSSItem[] = [];
    const itemElements = xmlDoc.querySelectorAll('item');

    itemElements.forEach(item => {
      const title = this.getTextContent(item, 'title');
      const link = this.getTextContent(item, 'link');
      const description = this.getTextContent(item, 'description');
      const pubDate = this.getTextContent(item, 'pubDate');
      const guid = this.getTextContent(item, 'guid');

      if (title && link) {
        items.push({
          title,
          link,
          description: description || '',
          pubDate: pubDate || '',
          guid: guid || link
        });
      }
    });

    return {
      title: this.getTextContent(channel, 'title') || 'Bun RSS Feed',
      link: this.getTextContent(channel, 'link') || API_ENDPOINTS.rss,
      description: this.getTextContent(channel, 'description') || '',
      lastBuildDate: this.getTextContent(channel, 'lastBuildDate') || '',
      items
    };
  }

  /**
   * Get text content from XML element
   */
  private getTextContent(parent: Element, tagName: string): string {
    const element = parent.querySelector(tagName);
    return element?.textContent?.trim() || '';
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache = {
      data: null,
      timestamp: 0
    };
  }

  /**
   * Get latest items (limited count)
   */
  async getLatestItems(limit: number = 5): Promise<RSSItem[]> {
    const feed = await this.fetchBunUpdates();
    return feed.items.slice(0, limit);
  }
}

// Export singleton instance
export const rssService = new RSSService();