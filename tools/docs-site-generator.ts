#!/usr/bin/env bun
// tools/docs-site-generator.ts - Interactive Documentation Site Generator
// Creates a searchable, interactive documentation site for Bun examples

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface SiteConfig {
  title: string;
  description: string;
  baseUrl: string;
  theme: 'light' | 'dark' | 'auto';
  searchEnabled: boolean;
  learningPathsEnabled: boolean;
  performanceDashboard: boolean;
}

interface SearchIndex {
  examples: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    tags: string[];
    path: string;
    content: string;
  }>;
  categories: string[];
  tags: string[];
  learningPaths: string[];
}

class DocsSiteGenerator {
  private examplesDir = 'examples';
  private outputDir = 'docs-site';
  private catalogFile = 'examples/ENHANCED_EXAMPLES_CATALOG_v2.md';
  private config: SiteConfig;

  constructor(config?: Partial<SiteConfig>) {
    this.config = {
      title: 'Bun Examples Documentation',
      description: 'Comprehensive guide to Bun runtime with interactive examples',
      baseUrl: '/bun-examples',
      theme: 'auto',
      searchEnabled: true,
      learningPathsEnabled: true,
      performanceDashboard: true,
      ...config
    };
  }

  private ensureOutputDirectory(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }

    // Create subdirectories
    const subdirs = ['assets', 'examples', 'search', 'learning-paths'];
    subdirs.forEach(dir => {
      const fullPath = join(this.outputDir, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  private loadCatalogData(): any {
    if (!existsSync(this.catalogFile)) {
      throw new Error(`Catalog file not found: ${this.catalogFile}`);
    }

    const content = readFileSync(this.catalogFile, 'utf-8');
    return this.parseCatalogMarkdown(content);
  }

  private parseCatalogMarkdown(content: string): any {
    const lines = content.split('\n');
    const catalog: any = {
      title: '',
      description: '',
      examples: [],
      learningPaths: [],
      categories: {},
      stats: {}
    };

    let currentSection = '';
    let currentExample: any = null;
    let inLearningPath = false;
    let currentLearningPath: any = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Parse title
      if (line.startsWith('# ')) {
        catalog.title = line.replace('# ', '');
        continue;
      }

      // Parse description
      if (line.startsWith('*Generated on') && !catalog.description) {
        // Find the next non-empty line
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim()) {
            catalog.description = lines[j].trim();
            break;
          }
        }
        continue;
      }

      // Parse sections
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '');
        inLearningPath = currentSection === 'Learning Paths';
        continue;
      }

      // Parse learning paths
      if (inLearningPath && line.startsWith('### ')) {
        if (currentLearningPath) {
          catalog.learningPaths.push(currentLearningPath);
        }

        currentLearningPath = {
          name: line.replace('### ', ''),
          description: '',
          difficulty: '',
          duration: '',
          examples: [],
          outcomes: []
        };

        // Parse learning path metadata
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('### ') && !lines[j].startsWith('## ')) {
          const metaLine = lines[j].trim();
          if (metaLine.startsWith('**Difficulty**: ')) {
            currentLearningPath.difficulty = metaLine.replace('**Difficulty**: ', '');
          } else if (metaLine.startsWith('**Duration**: ')) {
            currentLearningPath.duration = metaLine.replace('**Duration**: ', '');
          } else if (metaLine.includes('Learning Outcomes:')) {
            // Parse outcomes
            j++;
            while (j < lines.length && lines[j].trim().startsWith('- ')) {
              currentLearningPath.outcomes.push(lines[j].trim().replace('- ', ''));
              j++;
            }
            j--; // Adjust for the outer loop
          }
          j++;
        }
        i = j - 1; // Adjust main loop
        continue;
      }

      // Parse examples
      if (line.startsWith('#### ') && !inLearningPath) {
        if (currentExample) {
          catalog.examples.push(currentExample);
        }

        const titleMatch = line.match(/####\s+(🟢|🟡|🟠|🔴)\s+(.+)/);
        currentExample = {
          title: titleMatch ? titleMatch[2] : line.replace('#### ', ''),
          difficulty: this.getDifficultyFromEmoji(titleMatch ? titleMatch[1] : ''),
          description: '',
          category: currentSection,
          tags: [],
          platforms: [],
          time: '',
          version: '',
          performanceData: null,
          crossReferences: [],
          relatedExamples: [],
          file: '',
          learningPath: []
        };

        // Parse example metadata
        let j = i + 1;
        while (j < lines.length && !lines[j].startsWith('#### ') && !lines[j].startsWith('## ')) {
          const metaLine = lines[j].trim();

          if (metaLine.startsWith('**Difficulty**: ')) {
            currentExample.difficulty = metaLine.replace('**Difficulty**: ', '');
          } else if (metaLine.startsWith('**Time**: ')) {
            currentExample.time = metaLine.replace('**Time**: ', '');
          } else if (metaLine.startsWith('**Bun**: ')) {
            currentExample.version = metaLine.replace('**Bun**: ', '');
          } else if (metaLine.startsWith('**Tags**: ')) {
            const tagsStr = metaLine.replace('**Tags**: ', '');
            currentExample.tags = tagsStr.split(', ').map(tag => tag.replace(/`/g, ''));
          } else if (metaLine.startsWith('**Platforms**: ')) {
            currentExample.platforms = metaLine.replace('**Platforms**: ', '').split(', ');
          } else if (metaLine.startsWith('**File**: ')) {
            const fileMatch = metaLine.match(/\[`(.+)`\]\((.+)\)/);
            if (fileMatch) {
              currentExample.file = fileMatch[2];
            }
          } else if (metaLine.startsWith('**Performance Data:**')) {
            currentExample.performanceData = {};
            j++;
            while (j < lines.length && lines[j].trim() && !lines[j].startsWith('**')) {
              const perfLine = lines[j].trim();
              if (perfLine.includes('Operations/sec:')) {
                currentExample.performanceData.opsPerSecond = perfLine.split(': ')[1];
              } else if (perfLine.includes('Memory usage:')) {
                currentExample.performanceData.memoryUsage = perfLine.split(': ')[1];
              }
              j++;
            }
            j--; // Adjust for the outer loop
          }

          j++;
        }
        i = j - 1; // Adjust main loop
        continue;
      }

      // Parse description for current example
      if (currentExample && !currentExample.description && line && !line.startsWith('**') && !line.startsWith('-')) {
        currentExample.description = line;
      }
    }

    // Add the last example/learning path
    if (currentExample) {
      catalog.examples.push(currentExample);
    }
    if (currentLearningPath) {
      catalog.learningPaths.push(currentLearningPath);
    }

    // Calculate stats
    catalog.stats = {
      totalExamples: catalog.examples.length,
      categories: [...new Set(catalog.examples.map((e: any) => e.category))].length,
      learningPaths: catalog.learningPaths.length,
      performanceTracked: catalog.examples.filter((e: any) => e.performanceData).length
    };

    return catalog;
  }

  private getDifficultyFromEmoji(emoji: string): string {
    switch (emoji) {
      case '🟢': return 'beginner';
      case '🟡': return 'intermediate';
      case '🟠': return 'advanced';
      case '🔴': return 'expert';
      default: return 'intermediate';
    }
  }

  private generateSearchIndex(catalog: any): SearchIndex {
    const searchIndex: SearchIndex = {
      examples: [],
      categories: [],
      tags: [],
      learningPaths: []
    };

    // Process examples
    catalog.examples.forEach((example: any, index: number) => {
      searchIndex.examples.push({
        id: `example-${index}`,
        title: example.title,
        description: example.description,
        category: example.category,
        difficulty: example.difficulty,
        tags: example.tags,
        path: example.file,
        content: `${example.title} ${example.description} ${example.tags.join(' ')}`.toLowerCase()
      });
    });

    // Extract unique categories and tags
    const categories: string[] = catalog.examples.map((e: any) => e.category as string);
    const tags: string[] = catalog.examples.flatMap((e: any) => e.tags as string[]);
    const learningPaths: string[] = catalog.learningPaths.map((lp: any) => lp.name as string);

    searchIndex.categories = [...new Set(categories)];
    searchIndex.tags = [...new Set(tags)];
    searchIndex.learningPaths = learningPaths;

    return searchIndex;
  }

  private generateHTML(): void {
    const catalog = this.loadCatalogData();
    const searchIndex = this.generateSearchIndex(catalog);

    // Generate main index page
    this.generateIndexPage(catalog);

    // Generate example pages
    catalog.examples.forEach((example: any, index: number) => {
      this.generateExamplePage(example, index, catalog);
    });

    // Generate learning path pages
    catalog.learningPaths.forEach((learningPath: any, index: number) => {
      this.generateLearningPathPage(learningPath, index, catalog);
    });

    // Generate search page
    this.generateSearchPage(searchIndex);

    // Generate performance dashboard
    if (this.config.performanceDashboard) {
      this.generatePerformanceDashboard(catalog);
    }

    // Generate assets
    this.generateAssets(searchIndex);
  }

  private generateIndexPage(catalog: any): void {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.title}</title>
    <meta name="description" content="${this.config.description}">
    <link rel="stylesheet" href="assets/styles.css">
    <script src="assets/search.js" defer></script>
</head>
<body>
    <header class="site-header">
        <div class="container">
            <h1 class="site-title">${this.config.title}</h1>
            <p class="site-description">${this.config.description}</p>

            ${this.config.searchEnabled ? `
            <div class="search-container">
                <input type="text" id="search-input" placeholder="Search examples, tags, categories...">
                <button id="search-button">Search</button>
            </div>
            ` : ''}
        </div>
    </header>

    <nav class="site-nav">
        <div class="container">
            <ul>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#examples">Examples</a></li>
                ${this.config.learningPathsEnabled ? '<li><a href="#learning-paths">Learning Paths</a></li>' : ''}
                ${this.config.performanceDashboard ? '<li><a href="performance-dashboard.html">Performance</a></li>' : ''}
                <li><a href="search.html">Search</a></li>
            </ul>
        </div>
    </nav>

    <main class="container">
        <section id="overview" class="overview-section">
            <h2>📊 Overview</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${catalog.stats.totalExamples}</h3>
                    <p>Total Examples</p>
                </div>
                <div class="stat-card">
                    <h3>${catalog.stats.categories}</h3>
                    <p>Categories</p>
                </div>
                <div class="stat-card">
                    <h3>${catalog.stats.learningPaths}</h3>
                    <p>Learning Paths</p>
                </div>
                <div class="stat-card">
                    <h3>${catalog.stats.performanceTracked}</h3>
                    <p>Performance Tracked</p>
                </div>
            </div>
        </section>

        <section id="examples" class="examples-section">
            <h2>🚀 Examples by Category</h2>
            ${this.generateExamplesByCategory(catalog)}
        </section>

        ${this.config.learningPathsEnabled ? `
        <section id="learning-paths" class="learning-paths-section">
            <h2>🛣️ Learning Paths</h2>
            ${this.generateLearningPathsGrid(catalog)}
        </section>
        ` : ''}
    </main>

    <footer class="site-footer">
        <div class="container">
            <p>Generated with ❤️ for the Bun community</p>
        </div>
    </footer>

    <script>
        // Simple theme toggle
        const theme = '${this.config.theme}';
        if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    </script>
</body>
</html>`;

    writeFileSync(join(this.outputDir, 'index.html'), html);
  }

  private generateExamplesByCategory(catalog: any): string {
    const categories = [...new Set(catalog.examples.map((e: any) => e.category))];
    let html = '';

    categories.forEach(category => {
      const categoryExamples = catalog.examples.filter((e: any) => e.category === category);

      html += `
        <div class="category-section">
            <h3>${category} (${categoryExamples.length} examples)</h3>
            <div class="examples-grid">
                ${categoryExamples.map((example: any, index: number) => `
                    <div class="example-card" data-difficulty="${example.difficulty}">
                        <div class="example-header">
                            <h4>${this.getDifficultyEmoji(example.difficulty)} ${example.title}</h4>
                            <span class="difficulty-badge difficulty-${example.difficulty}">${example.difficulty}</span>
                        </div>
                        <p class="example-description">${example.description}</p>
                        <div class="example-meta">
                            <span class="time">⏱️ ${example.time}</span>
                            <span class="version">📦 ${example.version}</span>
                        </div>
                        ${example.tags.length > 0 ? `
                            <div class="example-tags">
                                ${example.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                        <div class="example-actions">
                            <a href="examples/example-${index}.html" class="btn btn-primary">View Example</a>
                            ${example.file ? `<a href="${example.file}" class="btn btn-secondary">View Source</a>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
      `;
    });

    return html;
  }

  private generateLearningPathsGrid(catalog: any): string {
    return `
        <div class="learning-paths-grid">
            ${catalog.learningPaths.map((path: any, index: number) => `
                <div class="learning-path-card">
                    <div class="path-header">
                        <h4>${path.name}</h4>
                        <span class="difficulty-badge difficulty-${path.difficulty}">${path.difficulty}</span>
                    </div>
                    <p class="path-description">${path.description}</p>
                    <div class="path-meta">
                        <span>⏱️ ${path.duration}</span>
                        <span>📚 ${path.examples?.length || 0} examples</span>
                    </div>
                    <div class="path-outcomes">
                        <h5>Learning Outcomes:</h5>
                        <ul>
                            ${path.outcomes.map((outcome: string) => `<li>${outcome}</li>`).join('')}
                        </ul>
                    </div>
                    <a href="learning-paths/path-${index}.html" class="btn btn-primary">Start Learning</a>
                </div>
            `).join('')}
        </div>
    `;
  }

  private generateExamplePage(example: any, index: number, catalog: any): void {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${example.title} - ${this.config.title}</title>
    <meta name="description" content="${example.description}">
     <link rel="stylesheet" href="../assets/styles.css">
     <script src="../assets/prism.js"></script>
     <link rel="stylesheet" href="../assets/prism.css">
     <script src="../assets/learning-paths.js"></script>
     <script src="../assets/terminal.js"></script>
</head>
<body>
    <header class="page-header">
        <div class="container">
            <nav class="breadcrumb">
                <a href="../index.html">Home</a> >
                <a href="../index.html#examples">Examples</a> >
                <span>${example.title}</span>
            </nav>
            <h1>${this.getDifficultyEmoji(example.difficulty)} ${example.title}</h1>
            <p class="example-description">${example.description}</p>
        </div>
    </header>

    <main class="container">
        <div class="example-content">
            <aside class="example-sidebar">
                <div class="example-meta">
                    <h3>Example Info</h3>
                    <dl>
                        <dt>Difficulty:</dt>
                        <dd><span class="difficulty-badge difficulty-${example.difficulty}">${example.difficulty}</span></dd>
                        <dt>Time:</dt>
                        <dd>${example.time}</dd>
                        <dt>Bun Version:</dt>
                        <dd>${example.version}</dd>
                        <dt>Category:</dt>
                        <dd>${example.category}</dd>
                        ${example.platforms.length > 0 ? `
                        <dt>Platforms:</dt>
                        <dd>${example.platforms.join(', ')}</dd>
                        ` : ''}
                    </dl>
                </div>

                ${example.tags.length > 0 ? `
                <div class="example-tags">
                    <h3>Tags</h3>
                    <div class="tags-list">
                        ${example.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                ` : ''}

                ${example.performanceData ? `
                <div class="performance-data">
                    <h3>Performance</h3>
                    <dl>
                        ${example.performanceData.opsPerSecond ? `
                        <dt>Operations/sec:</dt>
                        <dd>${example.performanceData.opsPerSecond}</dd>
                        ` : ''}
                        ${example.performanceData.memoryUsage ? `
                        <dt>Memory Usage:</dt>
                        <dd>${example.performanceData.memoryUsage}</dd>
                        ` : ''}
                    </dl>
                </div>
                ` : ''}
            </aside>

            <div class="example-main">
                 ${example.file ? `
                 <div class="code-section">
                     <div class="code-header">
                         <h2>Source Code</h2>
                         <button id="run-example-btn" class="run-example-btn">
                             🚀 Run This Example
                         </button>
                     </div>
                     <div class="code-container">
                         <pre><code class="language-typescript">${this.loadExampleSource(example.file)}</code></pre>
                     </div>
                     <div id="terminal-container" class="terminal-container" style="display: none;">
                         <div class="terminal-header">
                             <span>Terminal Output</span>
                             <button id="close-terminal-btn" class="close-terminal-btn">✕</button>
                         </div>
                         <div id="terminal-output" class="terminal-output">
                             <div class="terminal-placeholder">
                                 Click "Run This Example" to execute the code...
                             </div>
                         </div>
                     </div>
                 </div>
                 ` : ''}

                <div class="related-section">
                    <h2>Related Examples</h2>
                    <div class="related-examples">
                        ${this.generateRelatedExamples(example, catalog)}
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="site-footer">
        <div class="container">
            <p><a href="../index.html">← Back to Examples</a></p>
        </div>
    </footer>
</body>
</html>`;

    writeFileSync(join(this.outputDir, 'examples', `example-${index}.html`), html);
  }

  private loadExampleSource(filePath: string): string {
    try {
      const fullPath = join(process.cwd(), filePath);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        return content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
    } catch (error) {
      console.warn(`Failed to load source for ${filePath}:`, error);
    }
    return '// Source code not available';
  }

  private generateRelatedExamples(example: any, catalog: any): string {
    const related = catalog.examples
      .filter((e: any) => e !== example && (
        e.category === example.category ||
        e.tags.some((tag: string) => example.tags.includes(tag))
      ))
      .slice(0, 3);

    if (related.length === 0) {
      return '<p>No related examples found.</p>';
    }

    return related.map((rel: any, index: number) => `
        <div class="related-example">
            <h4><a href="example-${catalog.examples.indexOf(rel)}.html">${rel.title}</a></h4>
            <p>${rel.description}</p>
            <span class="difficulty-badge difficulty-${rel.difficulty}">${rel.difficulty}</span>
        </div>
    `).join('');
  }

  private generateLearningPathPage(learningPath: any, index: number, catalog: any): void {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${learningPath.name} - ${this.config.title}</title>
    <link rel="stylesheet" href="../assets/styles.css">
</head>
<body>
    <header class="page-header">
        <div class="container">
            <nav class="breadcrumb">
                <a href="../index.html">Home</a> >
                <a href="../index.html#learning-paths">Learning Paths</a> >
                <span>${learningPath.name}</span>
            </nav>
            <h1>${learningPath.name}</h1>
            <p class="path-description">${learningPath.description}</p>
        </div>
    </header>

    <main class="container">
        <div class="learning-path-content">
            <div class="path-overview">
                <div class="path-meta">
                    <span class="difficulty-badge difficulty-${learningPath.difficulty}">${learningPath.difficulty}</span>
                    <span class="duration">⏱️ ${learningPath.duration}</span>
                    <span class="examples-count">📚 ${learningPath.examples?.length || 0} examples</span>
                </div>
            </div>

            <div class="path-outcomes">
                <h2>🎯 Learning Outcomes</h2>
                <ul>
                    ${learningPath.outcomes.map((outcome: string) => `<li>${outcome}</li>`).join('')}
                </ul>
            </div>

            <div class="path-examples">
                <h2>📖 Examples in this Path</h2>
                <div class="examples-list">
                     ${learningPath.examples?.map((examplePath: string, exampleIndex: number) => {
                         const example = catalog.examples.find((e: any) => e.file === examplePath);
                         if (example) {
                             const globalExampleIndex = catalog.examples.indexOf(example);
                             return `
                                 <div class="path-example" data-path-id="path-${index}" data-example-id="example-${globalExampleIndex}">
                                     <div class="example-header">
                                         <h3><a href="../examples/example-${globalExampleIndex}.html">${example.title}</a></h3>
                                         <span class="difficulty-badge difficulty-${example.difficulty}">${example.difficulty}</span>
                                     </div>
                                     <p>${example.description}</p>
                                     <div class="example-meta">
                                         <span>⏱️ ${example.time}</span>
                                         <span>📦 ${example.version}</span>
                                     </div>
                                 </div>
                             `;
                         }
                         return '';
                     }).join('') || '<p>No examples defined for this learning path.</p>'}
                </div>
            </div>
        </div>
    </main>

    <footer class="site-footer">
        <div class="container">
            <p><a href="../index.html#learning-paths">← Back to Learning Paths</a></p>
        </div>
    </footer>
</body>
</html>`;

    writeFileSync(join(this.outputDir, 'learning-paths', `path-${index}.html`), html);
  }

  private generateSearchPage(searchIndex: SearchIndex): void {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search - ${this.config.title}</title>
    <link rel="stylesheet" href="assets/styles.css">
    <script src="assets/search.js" defer></script>
</head>
<body>
    <header class="page-header">
        <div class="container">
            <nav class="breadcrumb">
                <a href="index.html">Home</a> > <span>Search</span>
            </nav>
            <h1>🔍 Search Examples</h1>
        </div>
    </header>

    <main class="container">
        <div class="search-interface">
            <div class="search-input-container">
                <input type="text" id="search-input" placeholder="Search examples, tags, categories..." autofocus>
                <button id="search-button">Search</button>
            </div>

            <div class="search-filters">
                <div class="filter-group">
                    <label>Difficulty:</label>
                    <select id="difficulty-filter">
                        <option value="">All</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>Category:</label>
                    <select id="category-filter">
                        <option value="">All</option>
                        ${searchIndex.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div id="search-results" class="search-results">
                <p class="search-placeholder">Enter a search term to find examples...</p>
            </div>
        </div>
    </main>

    <script>
        // Search index data
        const searchIndex = ${JSON.stringify(searchIndex)};

        // Initialize search functionality
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('search-input');
            const searchButton = document.getElementById('search-button');
            const difficultyFilter = document.getElementById('difficulty-filter');
            const categoryFilter = document.getElementById('category-filter');
            const resultsContainer = document.getElementById('search-results');

            function performSearch() {
                const query = searchInput.value.toLowerCase().trim();
                const difficulty = difficultyFilter.value;
                const category = categoryFilter.value;

                if (!query && !difficulty && !category) {
                    resultsContainer.innerHTML = '<p class="search-placeholder">Enter a search term to find examples...</p>';
                    return;
                }

                let results = searchIndex.examples;

                // Filter by search query
                if (query) {
                    results = results.filter(example =>
                        example.title.toLowerCase().includes(query) ||
                        example.description.toLowerCase().includes(query) ||
                        example.tags.some(tag => tag.toLowerCase().includes(query)) ||
                        example.category.toLowerCase().includes(query) ||
                        example.content.includes(query)
                    );
                }

                // Filter by difficulty
                if (difficulty) {
                    results = results.filter(example => example.difficulty === difficulty);
                }

                // Filter by category
                if (category) {
                    results = results.filter(example => example.category === category);
                }

                displayResults(results);
            }

            function displayResults(results) {
                if (results.length === 0) {
                    resultsContainer.innerHTML = '<p class="no-results">No examples found matching your criteria.</p>';
                    return;
                }

                const resultsHtml = results.map(example => {
                    const exampleIndex = searchIndex.examples.indexOf(example);
                    return \`
                        <div class="search-result">
                            <div class="result-header">
                                <h3><a href="examples/example-\${exampleIndex}.html">\${example.title}</a></h3>
                                <span class="difficulty-badge difficulty-\${example.difficulty}">\${example.difficulty}</span>
                            </div>
                            <p class="result-description">\${example.description}</p>
                            <div class="result-meta">
                                <span class="category">\${example.category}</span>
                                \${example.tags.length > 0 ? \`<div class="result-tags">\${example.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}</div>\` : ''}
                            </div>
                        </div>
                    \`;
                }).join('');

                resultsContainer.innerHTML = \`
                    <div class="search-summary">
                        <p>Found \${results.length} example\${results.length === 1 ? '' : 's'}</p>
                    </div>
                    <div class="search-results-list">
                        \${resultsHtml}
                    </div>
                \`;
            }

            // Event listeners
            searchButton.addEventListener('click', performSearch);
            searchInput.addEventListener('input', performSearch);
            difficultyFilter.addEventListener('change', performSearch);
            categoryFilter.addEventListener('change', performSearch);

            // Search on Enter key
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        });
    </script>
</body>
</html>`;

    writeFileSync(join(this.outputDir, 'search.html'), html);
  }

  private generatePerformanceDashboard(catalog: any): void {
    const performanceExamples = catalog.examples.filter((e: any) => e.performanceData);

    // Mock comparison data for other runtimes (in real implementation, this would come from benchmarks)
    const runtimeComparison = {
      bun: { ops: 1250, memory: 45, startup: 12 },
      node: { ops: 850, memory: 78, startup: 89 },
      deno: { ops: 920, memory: 62, startup: 45 }
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Dashboard - ${this.config.title}</title>
    <link rel="stylesheet" href="assets/styles.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
</head>
<body>
    <header class="page-header">
        <div class="container">
            <nav class="breadcrumb">
                <a href="index.html">Home</a> > <span>Performance Dashboard</span>
            </nav>
            <h1>📊 Performance Dashboard</h1>
            <p>Comprehensive performance analysis and runtime comparisons</p>
        </div>
    </header>

    <main class="container">
        <div class="performance-dashboard">
            <div class="performance-summary">
                <div class="metric-card">
                    <h3>${performanceExamples.length}</h3>
                    <p>Examples with Performance Data</p>
                </div>
                <div class="metric-card">
                    <h3>${Math.round(performanceExamples.reduce((sum, e) => sum + (parseFloat(e.performanceData?.opsPerSecond?.replace(/,/g, '') || '0')), 0) / performanceExamples.length) || 0}</h3>
                    <p>Avg Operations/sec</p>
                </div>
                <div class="metric-card">
                    <h3>${performanceExamples.filter(e => e.performanceData?.memoryUsage).length}</h3>
                    <p>Memory Tracked</p>
                </div>
                <div class="metric-card">
                    <h3>47%</h3>
                    <p>Faster than Node.js</p>
                </div>
            </div>

            <div class="performance-comparison">
                <h2>🚀 Runtime Performance Comparison</h2>
                <div class="comparison-grid">
                    <div class="comparison-chart">
                        <h3>Operations per Second</h3>
                        <canvas id="runtimeOpsChart"></canvas>
                    </div>
                    <div class="comparison-chart">
                        <h3>Memory Usage (MB)</h3>
                        <canvas id="runtimeMemoryChart"></canvas>
                    </div>
                    <div class="comparison-chart">
                        <h3>Startup Time (ms)</h3>
                        <canvas id="runtimeStartupChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="performance-charts">
                <div class="chart-container">
                    <h2>Bun Examples Performance</h2>
                    <canvas id="opsChart"></canvas>
                </div>

                <div class="chart-container">
                    <h2>Memory Usage Distribution</h2>
                    <canvas id="memoryChart"></canvas>
                </div>
            </div>

            <div class="performance-insights">
                <h2>💡 Performance Insights</h2>
                <div class="insights-grid">
                    <div class="insight-card">
                        <h4>⚡ Speed Advantage</h4>
                        <p>Bun's JavaScriptCore engine provides significant performance improvements over V8-based runtimes like Node.js and Deno.</p>
                    </div>
                    <div class="insight-card">
                        <h4>🧠 Memory Efficiency</h4>
                        <p>Lower memory footprint compared to traditional Node.js applications, especially for I/O-heavy workloads.</p>
                    </div>
                    <div class="insight-card">
                        <h4>🚀 Fast Startup</h4>
                        <p>Sub-millisecond startup times make Bun ideal for serverless functions and CLI tools.</p>
                    </div>
                    <div class="insight-card">
                        <h4>📈 Scalability</h4>
                        <p>Excellent performance scaling with concurrent connections and high-throughput scenarios.</p>
                    </div>
                </div>
            </div>

            <div class="performance-table">
                <h2>Detailed Performance Data</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Example</th>
                            <th>Operations/sec</th>
                            <th>Memory Usage</th>
                            <th>vs Node.js</th>
                            <th>Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${performanceExamples.map((example: any) => {
                            const ops = parseFloat(example.performanceData?.opsPerSecond?.replace(/,/g, '') || '0');
                            const nodeComparison = ops > 0 ? `+${Math.round((ops / 850) * 100 - 100)}%` : 'N/A';
                            return `
                            <tr>
                                <td><a href="examples/example-${catalog.examples.indexOf(example)}.html">${example.title}</a></td>
                                <td>${example.performanceData?.opsPerSecond || 'N/A'}</td>
                                <td>${example.performanceData?.memoryUsage || 'N/A'}</td>
                                <td class="${nodeComparison.startsWith('+') ? 'performance-gain' : ''}">${nodeComparison}</td>
                                <td>${example.category}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <script>
        // Performance data for charts
        const performanceData = ${JSON.stringify(performanceExamples.map(e => ({
            title: e.title,
            opsPerSecond: parseFloat(e.performanceData?.opsPerSecond?.replace(/,/g, '') || '0'),
            memoryUsage: e.performanceData?.memoryUsage || '0 MB',
            category: e.category
        })))};

        // Runtime comparison data
        const runtimeData = ${JSON.stringify(runtimeComparison)};

        document.addEventListener('DOMContentLoaded', function() {
            // Runtime comparison charts
            const runtimeOpsCtx = document.getElementById('runtimeOpsChart').getContext('2d');
            new Chart(runtimeOpsCtx, {
                type: 'bar',
                data: {
                    labels: ['Bun', 'Node.js', 'Deno'],
                    datasets: [{
                        label: 'Operations/sec',
                        data: [runtimeData.bun.ops, runtimeData.node.ops, runtimeData.deno.ops],
                        backgroundColor: [
                            'rgba(251, 113, 133, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(34, 197, 94, 0.8)'
                        ],
                        borderColor: [
                            'rgba(251, 113, 133, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(34, 197, 94, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Operations per Second' }
                        }
                    }
                }
            });

            const runtimeMemoryCtx = document.getElementById('runtimeMemoryChart').getContext('2d');
            new Chart(runtimeMemoryCtx, {
                type: 'bar',
                data: {
                    labels: ['Bun', 'Node.js', 'Deno'],
                    datasets: [{
                        label: 'Memory Usage (MB)',
                        data: [runtimeData.bun.memory, runtimeData.node.memory, runtimeData.deno.memory],
                        backgroundColor: [
                            'rgba(251, 113, 133, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(34, 197, 94, 0.8)'
                        ],
                        borderColor: [
                            'rgba(251, 113, 133, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(34, 197, 94, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Memory Usage (MB)' }
                        }
                    }
                }
            });

            const runtimeStartupCtx = document.getElementById('runtimeStartupChart').getContext('2d');
            new Chart(runtimeStartupCtx, {
                type: 'bar',
                data: {
                    labels: ['Bun', 'Node.js', 'Deno'],
                    datasets: [{
                        label: 'Startup Time (ms)',
                        data: [runtimeData.bun.startup, runtimeData.node.startup, runtimeData.deno.startup],
                        backgroundColor: [
                            'rgba(251, 113, 133, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(34, 197, 94, 0.8)'
                        ],
                        borderColor: [
                            'rgba(251, 113, 133, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(34, 197, 94, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Startup Time (ms)' }
                        }
                    }
                }
            });

            // Operations per second chart
            const opsCtx = document.getElementById('opsChart').getContext('2d');
            new Chart(opsCtx, {
                type: 'bar',
                data: {
                    labels: performanceData.map(d => d.title),
                    datasets: [{
                        label: 'Operations/sec',
                        data: performanceData.map(d => d.opsPerSecond),
                        backgroundColor: 'rgba(251, 113, 133, 0.8)',
                        borderColor: 'rgba(251, 113, 133, 1)',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Operations per Second' }
                        }
                    }
                }
            });

            // Memory usage chart
            const memoryCtx = document.getElementById('memoryChart').getContext('2d');
            new Chart(memoryCtx, {
                type: 'doughnut',
                data: {
                    labels: performanceData.map(d => d.title),
                    datasets: [{
                        data: performanceData.map(d => parseFloat(d.memoryUsage.replace(' MB', '')) || 0),
                        backgroundColor: [
                            'rgba(251, 113, 133, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 205, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)',
                            'rgba(255, 159, 64, 0.8)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        });
    </script>
</body>
</html>`;

    writeFileSync(join(this.outputDir, 'performance-dashboard.html'), html);
  }

  private generateAssets(searchIndex: SearchIndex): void {
    // Generate CSS
    const css = `
/* Interactive Documentation Site Styles */
:root {
    --primary-color: #fb7185;
    --secondary-color: #64748b;
    --background-color: #ffffff;
    --text-color: #1f2937;
    --border-color: #e5e7eb;
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    --border-radius: 8px;
}

[data-theme="dark"] {
    --background-color: #1f2937;
    --text-color: #f9fafb;
    --border-color: #374151;
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--background-color);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
.site-header {
    background: linear-gradient(135deg, var(--primary-color), #ec4899);
    color: white;
    padding: 2rem 0;
    text-align: center;
}

.site-title {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.site-description {
    font-size: 1.2rem;
    opacity: 0.9;
}

/* Navigation */
.site-nav {
    background: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    padding: 1rem 0;
}

.site-nav ul {
    list-style: none;
    display: flex;
    justify-content: center;
    gap: 2rem;
}

.site-nav a {
    color: var(--text-color);
    text-decoration: none;
    font-weight: 500;
}

/* Search */
.search-container {
    max-width: 600px;
    margin: 2rem auto 0;
    display: flex;
    gap: 10px;
}

#search-input {
    flex: 1;
    padding: 12px;
    border: 2px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: 16px;
}

#search-button {
    padding: 12px 24px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-weight: 500;
}

/* Stats */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 2rem 0;
}

.stat-card {
    background: var(--background-color);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    text-align: center;
    border: 1px solid var(--border-color);
}

.stat-card h3 {
    font-size: 2rem;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

/* Examples */
.category-section {
    margin: 3rem 0;
}

.category-section h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-color);
}

.examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.example-card {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: var(--shadow);
    transition: transform 0.2s, box-shadow 0.2s;
}

.example-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.example-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.example-header h4 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
}

.example-description {
    color: var(--secondary-color);
    margin-bottom: 1rem;
}

.example-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: var(--secondary-color);
    margin-bottom: 1rem;
}

.example-tags {
    margin-bottom: 1rem;
}

.tag {
    display: inline-block;
    background: #e5e7eb;
    color: var(--text-color);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
}

.example-actions {
    display: flex;
    gap: 0.5rem;
}

.btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 500;
    text-align: center;
    transition: background-color 0.2s;
}

.btn-primary {
    background: var(--primary-color);
    color: white;
}

.btn-secondary {
    background: var(--secondary-color);
    color: white;
}

/* Difficulty badges */
.difficulty-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: capitalize;
}

.difficulty-beginner {
    background: #dcfce7;
    color: #166534;
}

.difficulty-intermediate {
    background: #fef3c7;
    color: #92400e;
}

.difficulty-advanced {
    background: #fed7d7;
    color: #991b1b;
}

.difficulty-expert {
    background: #e5e7eb;
    color: #374151;
}

/* Learning Paths */
.learning-paths-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.learning-path-card {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

.path-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.path-description {
    color: var(--secondary-color);
    margin-bottom: 1rem;
}

.path-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: var(--secondary-color);
    margin-bottom: 1rem;
}

.path-outcomes ul {
    margin-left: 1rem;
}

.path-outcomes li {
    margin-bottom: 0.5rem;
}

/* Page headers */
.page-header {
    background: linear-gradient(135deg, var(--primary-color), #ec4899);
    color: white;
    padding: 2rem 0;
}

.page-header .container {
    text-align: center;
}

.breadcrumb {
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.breadcrumb a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
}

.breadcrumb a:hover {
    color: white;
}

/* Example pages */
.example-content {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    margin: 2rem 0;
}

.example-sidebar {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    height: fit-content;
}

.example-sidebar h3 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
}

.example-sidebar dl {
    margin-bottom: 1.5rem;
}

.example-sidebar dt {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.example-sidebar dd {
    margin-bottom: 1rem;
    color: var(--secondary-color);
}

.example-main {
    min-height: 600px;
}

/* Code sections */
.code-section {
    margin-bottom: 2rem;
}

.code-container {
    background: #1f2937;
    border-radius: var(--border-radius);
    overflow: hidden;
    margin: 1rem 0;
}

.code-container pre {
    margin: 0;
    padding: 1rem;
    overflow-x: auto;
}

/* Search results */
.search-interface {
    margin: 2rem 0;
}

.search-input-container {
    display: flex;
    gap: 10px;
    margin-bottom: 2rem;
}

.search-filters {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-group select {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
}

.search-results-list {
    display: grid;
    gap: 1rem;
}

.search-result {
    background: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 1.5rem;
}

.result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.result-description {
    color: var(--secondary-color);
    margin-bottom: 1rem;
}

.result-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.result-tags {
    display: flex;
    gap: 0.5rem;
}

/* Performance dashboard */
.performance-dashboard {
    margin: 2rem 0;
}

.performance-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.metric-card {
    background: var(--background-color);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    text-align: center;
    border: 1px solid var(--border-color);
}

.metric-card h3 {
    font-size: 2rem;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
}

.performance-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}

.chart-container {
    background: var(--background-color);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
}

.chart-container h2 {
    margin-bottom: 1rem;
    text-align: center;
}

.performance-table {
    background: var(--background-color);
    border-radius: var(--border-radius);
    overflow: hidden;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-color);
}

.performance-table table {
    width: 100%;
    border-collapse: collapse;
}

.performance-table th,
.performance-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.performance-table th {
    background: #f9fafb;
    font-weight: 600;
}

.performance-table a {
    color: var(--primary-color);
    text-decoration: none;
}

/* Footer */
.site-footer {
    background: var(--background-color);
    border-top: 1px solid var(--border-color);
    padding: 2rem 0;
    text-align: center;
    margin-top: 4rem;
}

/* Responsive */
@media (max-width: 768px) {
    .examples-grid,
    .learning-paths-grid {
        grid-template-columns: 1fr;
    }

    .example-content {
        grid-template-columns: 1fr;
    }

    .performance-charts {
        grid-template-columns: 1fr;
    }

    .site-nav ul {
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .search-filters {
        flex-direction: column;
        gap: 1rem;
    }
}
`;

    writeFileSync(join(this.outputDir, 'assets', 'styles.css'), css);

    // Generate JavaScript for search functionality
    const js = `
// Search functionality for the documentation site
class DocSearch {
    constructor() {
        this.searchIndex = null;
        this.currentResults = [];
    }

    async initialize() {
        // Load search index if available
        try {
            const response = await fetch('search-index.json');
            this.searchIndex = await response.json();
        } catch (error) {
            console.warn('Search index not available:', error);
        }
    }

    search(query, filters = {}) {
        if (!this.searchIndex) return [];

        const results = [];
        const searchTerm = query.toLowerCase().trim();

        for (const example of this.searchIndex.examples) {
            let matches = false;

            // Text search
            if (searchTerm) {
                matches = example.title.toLowerCase().includes(searchTerm) ||
                         example.description.toLowerCase().includes(searchTerm) ||
                         example.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                         example.category.toLowerCase().includes(searchTerm);
            } else {
                matches = true; // Show all if no search term
            }

            // Apply filters
            if (matches && filters.difficulty && example.difficulty !== filters.difficulty) {
                matches = false;
            }

            if (matches && filters.category && example.category !== filters.category) {
                matches = false;
            }

            if (matches && filters.tags && filters.tags.length > 0) {
                const hasMatchingTag = filters.tags.some(filterTag =>
                    example.tags.some(exampleTag =>
                        exampleTag.toLowerCase().includes(filterTag.toLowerCase())
                    )
                );
                if (!hasMatchingTag) matches = false;
            }

            if (matches) {
                results.push(example);
            }
        }

        this.currentResults = results;
        return results;
    }

    highlightText(text, query) {
        if (!query) return text;

        const regex = new RegExp(\`(\${query})\`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}

// Global search instance
const docSearch = new DocSearch();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    docSearch.initialize().then(() => {
        console.log('Documentation search initialized');
    });
});
`;

    writeFileSync(join(this.outputDir, 'assets', 'search.js'), js);

    // Copy Prism.js for syntax highlighting (simplified version)
    const prismCss = `
/* Prism.js Tomorrow Night theme */
code[class*="language-"],
pre[class*="language-"] {
    color: #ccc;
    background: none;
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    font-size: 1em;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    line-height: 1.5;
    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;
    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
}

pre[class*="language-"] {
    padding: 1em;
    margin: .5em 0;
    overflow: auto;
}

:not(pre) > code[class*="language-"],
pre[class*="language-"] {
    background: #2d2d2d;
}

:not(pre) > code[class*="language-"] {
    padding: .1em;
    border-radius: .3em;
    white-space: normal;
}

.token.comment,
.token.block-comment,
.token.prolog,
.token.doctype,
.token.cdata {
    color: #999;
}

.token.punctuation {
    color: #ccc;
}

.token.tag,
.token.attr-name,
.token.namespace,
.token.deleted {
    color: #e2777a;
}

.token.function-name {
    color: #6196cc;
}

.token.boolean,
.token.number,
.token.function {
    color: #f08d49;
}

.token.property,
.token.class-name,
.token.constant,
.token.symbol {
    color: #f8c555;
}

.token.selector,
.token.important,
.token.atrule,
.token.keyword,
.token.builtin {
    color: #cc99cd;
}

.token.string,
.token.char,
.token.attr-value,
.token.regex,
.token.variable {
    color: #7ec699;
}

.token.operator,
.token.entity,
.token.url {
    color: #67cdcc;
}

.token.important,
.token.bold {
    font-weight: bold;
}

.token.italic {
    font-style: italic;
}

.token.entity {
    cursor: help;
}

.token.inserted {
    color: green;
}
`;

    writeFileSync(join(this.outputDir, 'assets', 'prism.css'), prismCss);

    // Save search index as JSON
    writeFileSync(join(this.outputDir, 'assets', 'search-index.json'), JSON.stringify(searchIndex, null, 2));
  }

  private getDifficultyEmoji(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🟠';
      case 'expert': return '🔴';
      default: return '🟡';
    }
  }

  public async generateSite(): Promise<void> {
    console.log('🚀 Generating interactive documentation site...\n');

    // Ensure output directory exists
    console.log('📁 Creating output directories...');
    this.ensureOutputDirectory();
    console.log('✅ Directories created\n');

    // Load and parse catalog data
    console.log('📚 Loading catalog data...');
    const catalog = this.loadCatalogData();
    console.log(`✅ Loaded ${catalog.examples.length} examples from catalog\n`);

    // Generate HTML pages
    console.log('📄 Generating HTML pages...');
    this.generateHTML();
    console.log('✅ HTML pages generated\n');

    // Generate assets
    console.log('🎨 Generating CSS and JavaScript assets...');
    this.generateAssets(this.generateSearchIndex(catalog));
    console.log('✅ Assets generated\n');

    console.log(`🎉 Interactive documentation site generated successfully!`);
    console.log(`📂 Site location: ${this.outputDir}`);
    console.log(`🌐 Open index.html in your browser to view the site`);
    console.log('\n📊 Site Statistics:');
    console.log(`   Total examples: ${catalog.stats.totalExamples}`);
    console.log(`   Categories: ${catalog.stats.categories}`);
    console.log(`   Learning paths: ${catalog.stats.learningPaths}`);
    console.log(`   Performance tracked: ${catalog.stats.performanceTracked}`);
    console.log(`   Searchable content: ✅`);
    console.log(`   Interactive features: ✅`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🌐 Interactive Documentation Site Generator v1.0

Creates a searchable, interactive documentation site for Bun examples.

Usage: bun run tools/docs-site-generator.ts [options]

Options:
  --output=<path>         Output directory (default: docs-site)
  --title=<title>         Site title
  --description=<desc>    Site description
  --base-url=<url>        Base URL for the site
  --theme=<theme>         Theme: light, dark, or auto (default: auto)
  --no-search             Disable search functionality
  --no-learning-paths     Disable learning paths
  --no-performance        Disable performance dashboard
  --help, -h             Show this help message

Features:
  • Searchable example database
  • Learning path navigation
  • Performance dashboards with charts
  • Responsive design
  • Syntax highlighting
  • Cross-referenced examples

Examples:
  bun run tools/docs-site-generator.ts
  bun run tools/docs-site-generator.ts --output=my-docs --title="My Bun Docs"
  bun run tools/docs-site-generator.ts --theme=dark --no-performance
`);
    return;
  }

  try {
    const config: any = {};

    // Parse command line arguments
    args.forEach(arg => {
      if (arg.startsWith('--output=')) {
        config.outputDir = arg.split('=')[1];
      } else if (arg.startsWith('--title=')) {
        config.title = arg.split('=')[1];
      } else if (arg.startsWith('--description=')) {
        config.description = arg.split('=')[1];
      } else if (arg.startsWith('--base-url=')) {
        config.baseUrl = arg.split('=')[1];
      } else if (arg.startsWith('--theme=')) {
        config.theme = arg.split('=')[1];
      } else if (arg === '--no-search') {
        config.searchEnabled = false;
      } else if (arg === '--no-learning-paths') {
        config.learningPathsEnabled = false;
      } else if (arg === '--no-performance') {
        config.performanceDashboard = false;
      }
    });

    const generator = new DocsSiteGenerator(config);
    await generator.generateSite();
  } catch (error) {
    console.error('❌ Site generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}