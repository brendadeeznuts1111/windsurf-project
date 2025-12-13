/**
 * @fileoverview Catalog-to-Registry Pipeline System
 * @description Automated pipeline from documentation catalog to registry with versioning, metadata, and notifications
 * @author Bun Documentation Team
 * @version 1.0.0
 * @since 2025
 *
 * This system provides a complete pipeline for:
 * - Catalog ingestion and processing
 * - Registry publishing with versioning
 * - Metadata generation and validation
 * - Auto-maintainer matrix dashboards
 * - RSS feed generation and Telegram notifications
 */

import { Database } from 'bun:sqlite';
import { RegistryManager } from './registry-manager';

// Types and interfaces
export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  filePath: string;
  content: string;
  metadata: CatalogMetadata;
  version: string;
  lastModified: string;
  maintainer?: string;
}

export interface CatalogMetadata {
  wordCount: number;
  codeBlocks: number;
  examples: number;
  dependencies: string[];
  relatedItems: string[];
  learningObjectives: string[];
  prerequisites: string[];
  estimatedTime: string;
  platformSupport: string[];
  lastValidated: string;
}

export interface RegistryEntry {
  id: string;
  catalogId: string;
  version: string;
  content: string;
  metadata: CatalogMetadata;
  checksum: string;
  publishedAt: string;
  publisher: string;
  changelog: string;
}

export interface MaintainerMatrix {
  itemId: string;
  primaryMaintainer: string;
  backupMaintainer: string;
  reviewers: string[];
  lastReviewed: string;
  reviewCycle: string; // "weekly", "monthly", etc.
  healthScore: number; // 0-100
}

export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
  lastBuildDate: string;
}

export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
  categories: string[];
}

/**
 * Catalog-to-Registry Pipeline Manager
 */
export class CatalogRegistryPipeline {
  private db: Database;
  private registry: RegistryManager;
  private catalogItems: Map<string, CatalogItem> = new Map();

  constructor(dbPath: string = 'catalog-registry.db') {
    this.db = new Database(dbPath);
    this.registry = new RegistryManager();
    this.initializeDatabase();
  }

  private initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS catalog_items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        difficulty TEXT,
        tags TEXT, -- JSON array
        file_path TEXT,
        content TEXT,
        metadata TEXT, -- JSON
        version TEXT,
        last_modified TEXT,
        maintainer TEXT
      );

      CREATE TABLE IF NOT EXISTS registry_entries (
        id TEXT PRIMARY KEY,
        catalog_id TEXT NOT NULL,
        version TEXT NOT NULL,
        content TEXT,
        metadata TEXT, -- JSON
        checksum TEXT,
        published_at TEXT,
        publisher TEXT,
        changelog TEXT,
        FOREIGN KEY (catalog_id) REFERENCES catalog_items(id)
      );

      CREATE TABLE IF NOT EXISTS maintainer_matrix (
        item_id TEXT PRIMARY KEY,
        primary_maintainer TEXT,
        backup_maintainer TEXT,
        reviewers TEXT, -- JSON array
        last_reviewed TEXT,
        review_cycle TEXT,
        health_score INTEGER,
        FOREIGN KEY (item_id) REFERENCES catalog_items(id)
      );

      CREATE TABLE IF NOT EXISTS rss_feeds (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        link TEXT,
        items TEXT, -- JSON array
        last_build_date TEXT
      );

      CREATE TABLE IF NOT EXISTS telegram_channels (
        id TEXT PRIMARY KEY,
        name TEXT,
        chat_id TEXT,
        webhook_url TEXT,
        subscribed_events TEXT, -- JSON array
        last_notification TEXT
      );
    `);
  }

  /**
   * Ingest catalog from filesystem
   */
  async ingestCatalog(catalogPath: string = './examples'): Promise<void> {
    console.log('🔄 Ingesting catalog from:', catalogPath);

    // Find all documentation files
    const files = await this.findCatalogFiles(catalogPath);

    for (const file of files) {
      const item = await this.processCatalogFile(file);
      if (item) {
        this.catalogItems.set(item.id, item);
        await this.saveCatalogItem(item);
      }
    }

    console.log(`✅ Ingested ${this.catalogItems.size} catalog items`);
  }

  private async findCatalogFiles(basePath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      // Use Bun's glob functionality
      const globPattern = `${basePath}/**/*.{md,ts,test.ts}`;
      const glob = new Bun.Glob(globPattern);

      for await (const entry of glob.scan()) {
        const filePath = entry.toString();
        if (filePath.endsWith('.md') || filePath.endsWith('.ts') || filePath.endsWith('.test.ts')) {
          files.push(filePath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan ${basePath}:`, error);
    }

    return files;
  }

  private async processCatalogFile(filePath: string): Promise<CatalogItem | null> {
    try {
      const content = await Bun.file(filePath).text();
      const stats = await Bun.file(filePath).stat();

      // Extract metadata from content
      const metadata = this.extractMetadata(content, filePath);
      const id = this.generateItemId(filePath);

      const item: CatalogItem = {
        id,
        title: this.extractTitle(content) || filePath.split('/').pop() || 'Unknown',
        description: this.extractDescription(content),
        category: this.determineCategory(filePath),
        difficulty: this.determineDifficulty(content),
        tags: this.extractTags(content),
        filePath,
        content,
        metadata,
        version: this.calculateVersion(content, stats.mtime),
        lastModified: stats.mtime.toISOString(),
        maintainer: this.determineMaintainer(filePath)
      };

      return item;
    } catch (error) {
      console.warn(`Warning: Could not process ${filePath}:`, error);
      return null;
    }
  }

  private extractMetadata(content: string, filePath: string): CatalogMetadata {
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
    const examples = (content.match(/```typescript[\s\S]*?```/g) || []).length;
    const wordCount = content.split(/\s+/).length;

    // Extract dependencies from import statements
    const dependencies = Array.from(
      new Set(
        content.match(/import.*from ['"]([^'"]+)['"]/g)?.map(match =>
          match.match(/from ['"]([^'"]+)['"]/)?.[1]
        ).filter((dep): dep is string => Boolean(dep)) || []
      )
    );

    return {
      wordCount,
      codeBlocks,
      examples,
      dependencies,
      relatedItems: [], // Will be populated by cross-reference analysis
      learningObjectives: this.extractLearningObjectives(content),
      prerequisites: this.extractPrerequisites(content),
      estimatedTime: this.estimateReadingTime(content),
      platformSupport: ['bun', 'node'], // Default platforms
      lastValidated: new Date().toISOString()
    };
  }

  private extractTitle(content: string): string | undefined {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch?.[1];
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim() && !line.startsWith('#') && line.length > 20) {
        return line.trim();
      }
    }
    return '';
  }

  private determineCategory(filePath: string): string {
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];

    if (fileName.includes('guide')) return 'documentation';
    if (fileName.includes('test')) return 'testing';
    if (fileName.includes('benchmark')) return 'performance';
    if (fileName.includes('api') || fileName.includes('runtime')) return 'api';
    if (fileName.includes('build') || fileName.includes('bundle')) return 'build';
    if (fileName.includes('registry') || fileName.includes('rbac')) return 'enterprise';

    return 'general';
  }

  private determineDifficulty(content: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const complexity = content.match(/```/g)?.length || 0;
    const advancedTerms = ['optimization', 'performance', 'enterprise', 'security'].filter(term =>
      content.toLowerCase().includes(term)
    ).length;

    if (complexity < 3 && advancedTerms === 0) return 'beginner';
    if (complexity < 6 && advancedTerms < 2) return 'intermediate';
    if (complexity < 10 && advancedTerms < 3) return 'advanced';
    return 'expert';
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // Extract from content keywords
    const keywords = ['bun', 'typescript', 'api', 'testing', 'performance', 'security', 'database', 'http', 'websocket'];
    keywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)];
  }

  private extractLearningObjectives(content: string): string[] {
    const objectives: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('Learn') || line.includes('Understand') || line.includes('Master')) {
        objectives.push(line.trim());
      }
    }

    return objectives.slice(0, 5); // Limit to 5 objectives
  }

  private extractPrerequisites(content: string): string[] {
    const prereqs: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('Prerequisite') || line.includes('Required') || line.includes('Before')) {
        prereqs.push(line.trim());
      }
    }

    return prereqs.slice(0, 3);
  }

  private estimateReadingTime(content: string): string {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    if (minutes < 5) return '< 5 min';
    if (minutes < 15) return `${minutes} min`;
    if (minutes < 60) return `${Math.ceil(minutes / 5) * 5} min`;
    return `${Math.ceil(minutes / 60)} hour${Math.ceil(minutes / 60) > 1 ? 's' : ''}`;
  }

  private generateItemId(filePath: string): string {
    return filePath
      .replace('./examples/', '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
  }

  private calculateVersion(content: string, mtime: Date): string {
    // Simple versioning based on content hash and modification time
    const hash = Bun.hash(content);
    const dateStr = mtime.toISOString().split('T')[0].replace(/-/g, '');
    return `1.0.${hash.toString().slice(-4)}`;
  }

  private determineMaintainer(filePath: string): string {
    // Simple maintainer assignment based on file path
    if (filePath.includes('rbac') || filePath.includes('registry')) return '@security-team';
    if (filePath.includes('test') || filePath.includes('benchmark')) return '@qa-team';
    if (filePath.includes('api') || filePath.includes('runtime')) return '@core-team';
    if (filePath.includes('build') || filePath.includes('bundle')) return '@build-team';

    return '@docs-team';
  }

  private async saveCatalogItem(item: CatalogItem): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO catalog_items
      (id, title, description, category, difficulty, tags, file_path, content, metadata, version, last_modified, maintainer)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.title,
      item.description,
      item.category,
      item.difficulty,
      JSON.stringify(item.tags),
      item.filePath,
      item.content,
      JSON.stringify(item.metadata),
      item.version,
      item.lastModified,
      item.maintainer || '@docs-team'
    );
  }

  /**
   * Publish catalog items to registry
   */
  async publishToRegistry(catalogIds?: string[]): Promise<void> {
    const itemsToPublish = catalogIds ?
      catalogIds.map(id => this.catalogItems.get(id)).filter(Boolean) :
      Array.from(this.catalogItems.values());

    console.log(`🚀 Publishing ${itemsToPublish.length} items to registry`);

    for (const item of itemsToPublish) {
      if (!item) continue;

      try {
        // Check if this version already exists
        const existing = this.db.prepare(`
          SELECT id FROM registry_entries
          WHERE catalog_id = ? AND version = ?
        `).get(item.id, item.version);

        if (existing) {
          console.log(`⏭️  Skipping ${item.title} v${item.version} (already published)`);
          continue;
        }

        // Publish to registry
        const success = await this.registry.publishPackage(
          `@docs/${item.id}`,
          item.version,
          'docs-registry'
        );

        if (success) {
          // Save registry entry
          const checksum = Bun.hash(item.content).toString();
          const changelog = this.generateChangelog(item);

          this.db.prepare(`
            INSERT INTO registry_entries
            (id, catalog_id, version, content, metadata, checksum, published_at, publisher, changelog)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            `${item.id}-${item.version}`,
            item.id,
            item.version,
            item.content,
            JSON.stringify(item.metadata),
            checksum,
            new Date().toISOString(),
            item.maintainer || 'system',
            changelog
          );

          console.log(`✅ Published ${item.title} v${item.version}`);
        }
      } catch (error) {
        console.error(`❌ Failed to publish ${item.title}:`, error);
      }
    }
  }

  private generateChangelog(item: CatalogItem): string {
    // Generate changelog based on content changes
    const changes = [];

    if (item.metadata.codeBlocks > 0) {
      changes.push(`Added ${item.metadata.codeBlocks} code examples`);
    }

    if (item.metadata.examples > 0) {
      changes.push(`Added ${item.metadata.examples} interactive examples`);
    }

    if (item.tags.length > 0) {
      changes.push(`Tagged with: ${item.tags.join(', ')}`);
    }

    return changes.length > 0 ? changes.join('; ') : 'Content updates and improvements';
  }

  /**
   * Generate maintainer matrix dashboards
   */
  async generateMaintainerMatrix(): Promise<void> {
    console.log('📊 Generating maintainer matrix dashboards');

    const items = Array.from(this.catalogItems.values());

    for (const item of items) {
      const matrix: MaintainerMatrix = {
        itemId: item.id,
        primaryMaintainer: item.maintainer || '@docs-team',
        backupMaintainer: this.getBackupMaintainer(item.maintainer),
        reviewers: this.getReviewers(item.category),
        lastReviewed: item.lastModified,
        reviewCycle: this.getReviewCycle(item.category),
        healthScore: this.calculateHealthScore(item)
      };

      this.db.prepare(`
        INSERT OR REPLACE INTO maintainer_matrix
        (item_id, primary_maintainer, backup_maintainer, reviewers, last_reviewed, review_cycle, health_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        matrix.itemId,
        matrix.primaryMaintainer,
        matrix.backupMaintainer,
        JSON.stringify(matrix.reviewers),
        matrix.lastReviewed,
        matrix.reviewCycle,
        matrix.healthScore
      );
    }

    console.log(`✅ Generated maintainer matrix for ${items.length} items`);
  }

  private getBackupMaintainer(primary?: string): string {
    const backups: Record<string, string> = {
      '@core-team': '@senior-engineer',
      '@security-team': '@security-lead',
      '@qa-team': '@qa-lead',
      '@build-team': '@build-lead',
      '@docs-team': '@tech-writer'
    };

    return backups[primary || '@docs-team'] || '@tech-writer';
  }

  private getReviewers(category: string): string[] {
    const reviewers: Record<string, string[]> = {
      'documentation': ['@docs-team', '@tech-writer'],
      'api': ['@core-team', '@api-reviewer'],
      'testing': ['@qa-team', '@test-engineer'],
      'performance': ['@perf-team', '@senior-engineer'],
      'enterprise': ['@security-team', '@enterprise-architect'],
      'build': ['@build-team', '@devops-engineer']
    };

    return reviewers[category] || ['@docs-team'];
  }

  private getReviewCycle(category: string): string {
    const cycles: Record<string, string> = {
      'documentation': 'weekly',
      'api': 'biweekly',
      'testing': 'weekly',
      'performance': 'monthly',
      'enterprise': 'monthly',
      'build': 'biweekly'
    };

    return cycles[category] || 'monthly';
  }

  private calculateHealthScore(item: CatalogItem): number {
    let score = 100;

    // Deduct points for outdated content
    const daysSinceModified = (Date.now() - new Date(item.lastModified).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceModified > 30) score -= 20;
    if (daysSinceModified > 90) score -= 30;

    // Deduct points for lack of examples
    if (item.metadata.examples === 0) score -= 15;

    // Deduct points for missing maintainer
    if (!item.maintainer) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Generate RSS feeds for documentation updates
   */
  async generateRSSFeeds(): Promise<void> {
    console.log('📰 Generating RSS feeds');

    // Generate main documentation feed
    const mainFeed: RSSFeed = {
      title: 'Bun Documentation Updates',
      description: 'Latest updates to Bun documentation and guides',
      link: 'https://docs.bun.sh',
      items: [],
      lastBuildDate: new Date().toISOString()
    };

    // Get recent registry entries
    const recentEntries = this.db.prepare(`
      SELECT re.*, ci.title, ci.category
      FROM registry_entries re
      JOIN catalog_items ci ON re.catalog_id = ci.id
      ORDER BY re.published_at DESC
      LIMIT 20
    `).all() as any[];

    mainFeed.items = recentEntries.map(entry => ({
      title: `${entry.title} v${entry.version}`,
      description: entry.changelog,
      link: `https://docs.bun.sh/${entry.catalog_id}`,
      pubDate: entry.published_at,
      guid: `${entry.catalog_id}-${entry.version}`,
      categories: [entry.category]
    }));

    // Save RSS feed
    this.db.prepare(`
      INSERT OR REPLACE INTO rss_feeds (id, title, description, link, items, last_build_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'main-docs-feed',
      mainFeed.title,
      mainFeed.description,
      mainFeed.link,
      JSON.stringify(mainFeed.items),
      mainFeed.lastBuildDate
    );

    console.log(`✅ Generated RSS feed with ${mainFeed.items.length} items`);
  }

  /**
   * Send README alerts and Telegram notifications
   */
  async sendNotifications(): Promise<void> {
    console.log('📢 Sending notifications');

    // Get recent updates
    const recentUpdates = this.db.prepare(`
      SELECT ci.title, re.version, re.published_at, re.changelog
      FROM registry_entries re
      JOIN catalog_items ci ON re.catalog_id = ci.id
      WHERE re.published_at > datetime('now', '-1 day')
      ORDER BY re.published_at DESC
    `).all() as any[];

    if (recentUpdates.length === 0) {
      console.log('ℹ️  No recent updates to notify about');
      return;
    }

    // Generate README alert
    const readmeAlert = this.generateReadmeAlert(recentUpdates);

    // Update README.md
    await this.updateReadmeWithAlert(readmeAlert);

    // Send Telegram notifications
    await this.sendTelegramNotifications(recentUpdates);

    console.log(`✅ Sent notifications for ${recentUpdates.length} updates`);
  }

  private generateReadmeAlert(updates: any[]): string {
    const alert = [
      '## 🚨 Documentation Updates',
      '',
      `**${new Date().toLocaleDateString()}** - ${updates.length} documentation updates published:`,
      '',
      ...updates.map(update =>
        `- **${update.title}** v${update.version}: ${update.changelog}`
      ),
      '',
      '> View full documentation at [docs.bun.sh](https://docs.bun.sh)',
      ''
    ];

    return alert.join('\n');
  }

  private async updateReadmeWithAlert(alert: string): Promise<void> {
    try {
      const readmePath = './README.md';
      let content = '';

      try {
        content = await Bun.file(readmePath).text();
      } catch {
        // README doesn't exist, create basic one
        content = '# Bun Documentation\n\n';
      }

      // Remove existing alert if present
      content = content.replace(/## 🚨 Documentation Updates[\s\S]*?> View full documentation.*$/m, '');

      // Add new alert at the top (after title)
      const lines = content.split('\n');
      const titleEndIndex = lines.findIndex(line => line.trim() === '') + 1;

      lines.splice(titleEndIndex, 0, alert);

      await Bun.write(readmePath, lines.join('\n'));
      console.log('✅ Updated README.md with documentation alerts');
    } catch (error) {
      console.warn('Warning: Could not update README.md:', error);
    }
  }

  private async sendTelegramNotifications(updates: any[]): Promise<void> {
    // Get configured Telegram channels
    const channels = this.db.prepare('SELECT * FROM telegram_channels').all() as any[];

    for (const channel of channels) {
      try {
        const message = this.formatTelegramMessage(updates, channel.name);

        // Send to Telegram (mock implementation)
        console.log(`📱 Sending to ${channel.name}: ${message.substring(0, 100)}...`);

        // Update last notification time
        this.db.prepare(`
          UPDATE telegram_channels SET last_notification = ? WHERE id = ?
        `).run(new Date().toISOString(), channel.id);

      } catch (error) {
        console.warn(`Warning: Could not send to ${channel.name}:`, error);
      }
    }
  }

  private formatTelegramMessage(updates: any[], channelName: string): string {
    const message = [
      `🚀 *Bun Documentation Updates*`,
      `📅 ${new Date().toLocaleDateString()}`,
      `📊 ${updates.length} updates published`,
      '',
      ...updates.slice(0, 5).map(update =>
        `• *${update.title}* v${update.version}\n  ${update.changelog}`
      ),
      '',
      `🔗 [View Documentation](https://docs.bun.sh)`
    ];

    return message.join('\n');
  }

  /**
   * Run complete pipeline
   */
  async runPipeline(): Promise<void> {
    console.log('🚀 Starting Catalog-to-Registry Pipeline');

    try {
      // Step 1: Ingest catalog
      await this.ingestCatalog();

      // Step 2: Publish to registry
      await this.publishToRegistry();

      // Step 3: Generate maintainer matrix
      await this.generateMaintainerMatrix();

      // Step 4: Generate RSS feeds
      await this.generateRSSFeeds();

      // Step 5: Send notifications
      await this.sendNotifications();

      console.log('✅ Pipeline completed successfully');

    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      throw error;
    }
  }

  /**
   * Get pipeline statistics
   */
  getPipelineStats(): any {
    const catalogCount = this.db.prepare('SELECT COUNT(*) as count FROM catalog_items').get() as any;
    const registryCount = this.db.prepare('SELECT COUNT(*) as count FROM registry_entries').get() as any;
    const maintainerCount = this.db.prepare('SELECT COUNT(*) as count FROM maintainer_matrix').get() as any;
    const rssFeeds = this.db.prepare('SELECT COUNT(*) as count FROM rss_feeds').get() as any;

    return {
      catalogItems: catalogCount.count,
      registryEntries: registryCount.count,
      maintainerMatrices: maintainerCount.count,
      rssFeeds: rssFeeds.count,
      lastRun: new Date().toISOString()
    };
  }

  close() {
    this.db.close();
    this.registry.close();
  }
}

// Export singleton instance
export const catalogPipeline = new CatalogRegistryPipeline();

// Types are exported at the top of the file