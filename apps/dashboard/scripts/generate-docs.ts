#!/usr/bin/env bun

/**
 * Simple JSDoc to Markdown Documentation Generator
 * Extracts JSDoc comments from TypeScript files and generates markdown documentation
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

interface JSDocComment {
  file: string;
  line: number;
  comment: string;
  type: 'file' | 'class' | 'method' | 'interface' | 'function';
  name?: string;
}

class DocGenerator {
  private docs: JSDocComment[] = [];

  /**
   * Extracts JSDoc comments from a file
   */
  extractJSDoc(filePath: string): void {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let currentComment = '';
    let inComment = false;
    let commentStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('/**')) {
        inComment = true;
        currentComment = line + '\n';
        commentStartLine = i + 1;
      } else if (inComment) {
        if (trimmed.startsWith('*/')) {
          currentComment += line + '\n';
          inComment = false;

          // Extract comment type and name
          const comment = this.parseJSDocComment(currentComment, filePath, commentStartLine);
          if (comment) {
            this.docs.push(comment);
          }
          currentComment = '';
        } else {
          currentComment += line + '\n';
        }
      }
    }
  }

  /**
   * Parses a JSDoc comment and extracts metadata
   */
  private parseJSDocComment(comment: string, filePath: string, line: number): JSDocComment | null {
    const lines = comment.split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    let type: JSDocComment['type'] = 'function';
    let name = '';

    // Extract @fileoverview, @class, @method, @interface, etc.
    for (const line of lines) {
      const trimmed = line.trim().replace(/^\*\s*/, '');

      if (trimmed.includes('@fileoverview')) {
        type = 'file';
      } else if (trimmed.includes('@class') || trimmed.includes('@component')) {
        type = 'class';
      } else if (trimmed.includes('@method')) {
        type = 'method';
      } else if (trimmed.includes('@interface')) {
        type = 'interface';
      } else if (trimmed.includes('@function')) {
        type = 'function';
      }

      // Extract name from various patterns
      const nameMatch = trimmed.match(/@method\s+(\w+)/) ||
                       trimmed.match(/@function\s+(\w+)/) ||
                       trimmed.match(/@class\s+(\w+)/) ||
                       trimmed.match(/@interface\s+(\w+)/);
      if (nameMatch) {
        name = nameMatch[1];
      }
    }

    return {
      file: filePath,
      line,
      comment: comment.trim(),
      type,
      name
    };
  }

  /**
   * Generates markdown documentation
   */
  generateMarkdown(): string {
    let markdown = '# API Documentation\n\n';
    markdown += 'Generated from JSDoc comments in the codebase.\n\n';

    // Group by file
    const byFile = new Map<string, JSDocComment[]>();
    for (const doc of this.docs) {
      const fileName = doc.file.split('/').pop() || doc.file;
      if (!byFile.has(fileName)) {
        byFile.set(fileName, []);
      }
      byFile.get(fileName)!.push(doc);
    }

    // Generate documentation for each file
    for (const [fileName, comments] of byFile) {
      markdown += `## ${fileName}\n\n`;

      // Group by type
      const byType = new Map<string, JSDocComment[]>();
      for (const comment of comments) {
        if (!byType.has(comment.type)) {
          byType.set(comment.type, []);
        }
        byType.get(comment.type)!.push(comment);
      }

      for (const [type, typeComments] of byType) {
        markdown += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;

        for (const comment of typeComments) {
          if (comment.name) {
            markdown += `#### ${comment.name}\n\n`;
          }

          // Clean up the comment for markdown
          let cleanComment = comment.comment
            .replace(/\/\*\*\s*\n/, '')
            .replace(/\s*\*\/\s*$/, '')
            .split('\n')
            .map(line => line.replace(/^\s*\*\s?/, ''))
            .join('\n')
            .trim();

          // Convert JSDoc tags to markdown
          cleanComment = cleanComment
            .replace(/@param\s+{(\w+)}\s+(\w+)\s*-\s*(.+)/g, '- **`$2`** (*$1*): $3')
            .replace(/@returns\s+{([^}]+)}\s*(.+)?/g, '**Returns** (*$1*): $2')
            .replace(/@example\s*\n([\s\S]*?)(?=\n@\w|\n```|\n$|$)/g, '\n**Example:**\n```typescript$1```\n')
            .replace(/```typescript\s*\n/g, '```\n')
            .replace(/@see\s+{([^}]+)}\s*-\s*(.+)/g, '\n🔗 **See also:** [$1] - $2')
            .replace(/@(\w+)/g, '**$1**');

          markdown += cleanComment + '\n\n';
        }
      }

      markdown += '---\n\n';
    }

    return markdown;
  }

  /**
   * Processes all TypeScript files in a directory
   */
  processDirectory(dirPath: string): void {
    const files = readdirSync(dirPath, { recursive: true });

    for (const file of files) {
      if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        const filePath = join(dirPath, file);
        try {
          this.extractJSDoc(filePath);
        } catch (error) {
          console.warn(`Warning: Could not process ${filePath}:`, error);
        }
      }
    }
  }

  /**
   * Saves documentation to file
   */
  saveToFile(outputPath: string): void {
    const markdown = this.generateMarkdown();
    mkdirSync(outputPath.split('/').slice(0, -1).join('/'), { recursive: true });
    writeFileSync(outputPath, markdown);
    console.log(`Documentation generated: ${outputPath}`);
  }
}

// Main execution
const generator = new DocGenerator();

// Process the components we documented
generator.extractJSDoc('src/components/MarketTelemetryDemo.tsx');
generator.extractJSDoc('src/components/TCPDemo.tsx');
generator.extractJSDoc('../../packages/odds-core/src/telemetry/market-telemetry.ts');

// Generate and save documentation
generator.saveToFile('docs/API-Documentation.md');

console.log('✅ JSDoc documentation generated successfully!');