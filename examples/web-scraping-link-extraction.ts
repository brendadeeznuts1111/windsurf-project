/**
 * High-performance link extraction from HTML using Bun-native HTMLRewriter
 * DOMAIN: web
 * SCOPE: scraping
 * SPEC: EX063
 * PR: #1275 - Implement high-performance link extraction with HTMLRewriter
 * STATUS: draft
 * TAGS: critical, performance, html-parsing
 * REVIEWED-BY: @platform-team-lead
 * COMMIT: abcdef123456
 */

import { logger } from "./logging/bun-logger";

interface LinkExtractionOptions {
  includeExternal?: boolean;
  sameDomainOnly?: boolean;
  maxLinks?: number;
  timeout?: number;
  userAgent?: string;
}

interface LinkExtractionResult {
  url: string;
  links: string[];
  internalLinks: string[];
  externalLinks: string[];
  processingTime: number;
  errorCount: number;
  totalSize: number;
}

export class BunLinkExtractor {
  // ========================================
  // META: {PROPERTY} values from TOML
  // ========================================
  private config = {
    htmlParser: "bun-html-rewriter",
    urlResolution: "automatic",
    deduplication: "set-based",
    errorHandling: "graceful",
    streamingProcessing: true,
    concurrentRequests: 10,
    timeoutSeconds: 30,
    maxResponseSizeMb: 50,
    urlFormatValidation: true,
    schemeFiltering: ["http", "https"],
  };

  private activeRequests = new Set<string>();

  // ========================================
  // #REF:* dependencies injected
  // ========================================
  constructor(
    private httpClient?: any,  // EX001 - HTTP client
    private htmlParser?: any,  // EX013 - HTML processing
    private urlValidator?: any,  // EX008 - URL validation
  ) {
    logger.debug("BunLinkExtractor initialized", {
      domain: "web.scraping",
      spec: "EX063"
    });
  }

  // ========================================
  // METHOD: extractLinksFromURL
  // PR: #1275
  // STATUS: draft
  // TAGS: critical, performance-critical
  // ========================================
  public async extractLinksFromURL(
    url: string,
    options: LinkExtractionOptions = {}
  ): Promise<LinkExtractionResult> {
    const traceId = Bun.randomUUIDv7();
    const start = Bun.nanoseconds();

    try {
      logger.info("Starting link extraction", {
        trace_id: traceId,
        url,
        options
      });

      // Prevent concurrent requests to same URL
      if (this.activeRequests.has(url)) {
        throw new Error(`Request already in progress for ${url}`);
      }

      this.activeRequests.add(url);

      const result: LinkExtractionResult = {
        url,
        links: [],
        internalLinks: [],
        externalLinks: [],
        processingTime: 0,
        errorCount: 0,
        totalSize: 0,
      };

      // Validate URL
      if (!this.isValidURL(url)) {
        throw new Error(`Invalid URL: ${url}`);
      }

      // Fetch HTML content
      const response = await this.fetchWithTimeout(url, options.timeout || this.config.timeoutSeconds * 1000, options.userAgent);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        logger.warn("Non-HTML content type", { trace_id: traceId, contentType });
        return result;
      }

      // Get response size
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        const size = parseInt(contentLength);
        if (size > this.config.maxResponseSizeMb * 1024 * 1024) {
          throw new Error(`Response too large: ${size} bytes`);
        }
        result.totalSize = size;
      }

      // Extract links using HTMLRewriter
      const links = await this.extractLinksFromResponse(response, url);

      // Process and categorize links
      const processedLinks = this.processLinks(links, url, options);

      result.links = processedLinks.all;
      result.internalLinks = processedLinks.internal;
      result.externalLinks = processedLinks.external;
      result.processingTime = Number(Bun.nanoseconds() - start) / 1e6; // Convert to ms

      logger.info("Link extraction completed", {
        trace_id: traceId,
        url,
        links_found: result.links.length,
        processing_time_ms: result.processingTime
      });

      return result;

    } catch (error) {
      logger.error("Link extraction failed", {
        trace_id: traceId,
        url,
        duration_ns: Bun.nanoseconds() - start,
        error: (error as Error).message
      });
      throw error;
    } finally {
      this.activeRequests.delete(url);
    }
  }

  // ========================================
  // METHOD: extractLinksFromHTML
  // PR: #1275
  // STATUS: draft
  // TAGS: html-parsing, streaming
  // ========================================
  public async extractLinksFromHTML(
    html: string,
    baseUrl: string,
    options: LinkExtractionOptions = {}
  ): Promise<string[]> {
    const traceId = Bun.randomUUIDv7();

    try {
      logger.debug("Extracting links from HTML string", {
        trace_id: traceId,
        base_url: baseUrl,
        html_length: html.length
      });

      // Create a Response from HTML string for consistent processing
      const response = new Response(html, {
        headers: { 'content-type': 'text/html' }
      });

      const links = await this.extractLinksFromResponse(response, baseUrl);
      const processed = this.processLinks(links, baseUrl, options);

      return processed.all;

    } catch (error) {
      logger.error("HTML link extraction failed", {
        trace_id: traceId,
        base_url: baseUrl,
        error: (error as Error).message
      });
      throw error;
    }
  }

  // ========================================
  // METHOD: batchExtract
  // PR: #1275
  // STATUS: draft
  // TAGS: performance, concurrent
  // ========================================
  public async batchExtract(
    urls: string[],
    options: LinkExtractionOptions & { concurrency?: number } = {}
  ): Promise<LinkExtractionResult[]> {
    const traceId = Bun.randomUUIDv7();
    const concurrency = Math.min(options.concurrency || this.config.concurrentRequests, urls.length);

    logger.info("Starting batch link extraction", {
      trace_id: traceId,
      urls_count: urls.length,
      concurrency
    });

    const results: LinkExtractionResult[] = [];
    const semaphore = new Semaphore(concurrency);

    const promises = urls.map(async (url) => {
      await semaphore.acquire();
      try {
        const result = await this.extractLinksFromURL(url, options);
        results.push(result);
      } catch (error) {
        logger.warn("Batch extraction failed for URL", {
          trace_id: traceId,
          url,
          error: (error as Error).message
        });
        // Add failed result
        results.push({
          url,
          links: [],
          internalLinks: [],
          externalLinks: [],
          processingTime: 0,
          errorCount: 1,
          totalSize: 0,
        });
      } finally {
        semaphore.release();
      }
    });

    await Promise.all(promises);

    logger.info("Batch extraction completed", {
      trace_id: traceId,
      total_urls: urls.length,
      successful: results.filter(r => r.errorCount === 0).length
    });

    return results;
  }

  private async extractLinksFromResponse(response: Response, baseUrl: string): Promise<string[]> {
    const links = new Set<string>();

    const rewriter = new HTMLRewriter()
      .on("a[href]", {
        element(el) {
          const href = el.getAttribute("href");
          if (href) {
            try {
              const absoluteURL = new URL(href, baseUrl).href;
              links.add(absoluteURL);
            } catch {
              // Invalid URL, skip gracefully
              links.add(href);
            }
          }
        },
      })
      .on("link[href]", {
        element(el) {
          const href = el.getAttribute("href");
          const rel = el.getAttribute("rel");
          if (href && rel !== "stylesheet") { // Skip CSS links
            try {
              const absoluteURL = new URL(href, baseUrl).href;
              links.add(absoluteURL);
            } catch {
              links.add(href);
            }
          }
        },
      });

    try {
      await rewriter.transform(response).blob();
    } catch (error) {
      logger.warn("HTMLRewriter processing failed", { base_url: baseUrl }, error as Error);
      throw error;
    }

    return [...links];
  }

  private processLinks(links: string[], baseUrl: string, options: LinkExtractionOptions) {
    const baseDomain = this.extractDomain(baseUrl);
    const all: string[] = [];
    const internal: string[] = [];
    const external: string[] = [];

    for (const link of links) {
      // Validate URL format
      if (this.config.urlFormatValidation && !this.isValidURL(link)) {
        continue;
      }

      // Check scheme
      const scheme = link.split(':')[0];
      if (!this.config.schemeFiltering.includes(scheme)) {
        continue;
      }

      // Apply limits
      if (options.maxLinks && all.length >= options.maxLinks) {
        break;
      }

      // Apply same domain filter
      const linkDomain = this.extractDomain(link);
      if (options.sameDomainOnly && linkDomain !== baseDomain) {
        continue;
      }

      all.push(link);

      // Categorize internal vs external
      if (linkDomain === baseDomain) {
        internal.push(link);
      } else {
        if (options.includeExternal !== false) {
          external.push(link);
        }
      }
    }

    return { all, internal, external };
  }

  private async fetchWithTimeout(url: string, timeout: number, userAgent?: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': userAgent || 'BunLinkExtractor/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}

// Semaphore for concurrency control
class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      this.permits--;
      resolve();
    }
  }
}

