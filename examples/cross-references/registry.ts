/**
 * Cross-Reference Registry for Bun Examples
 * Demonstrates the cross-reference system with real examples and benchmarks
 */

import { crossRefSystem } from '../cross-references/system';

// Register examples with their cross-references
crossRefSystem.registerExample({
  file: 'examples/applications/apis/bun-rest-crud-api.ts',
  category: 'applications/apis',
  difficulty: 'intermediate',
  prerequisites: ['examples/core/networking/bun-tls-server.ts', 'examples/bun-file-mime-demo.test.ts'],
  relatedExamples: [
    'examples/core/networking/bun-http-session.ts',
    'examples/core/networking/bun-rate-limiting.ts',
    'examples/core/networking/bun-cors-middleware.ts',
    'examples/core/file-system/bun-file-upload-api.ts',
    'examples/core/networking/bun-api-validation.ts'
  ],
  guides: [
    'examples/guides/advanced/bun-http-api-guide.md',
    'examples/guides/advanced/bun-rest-api-best-practices.md'
  ],
  tests: ['examples/patterns/testing/bun-rest-api-testing.test.ts'],
  benchmarks: [
    'benchmarks/bun-rest-performance.bench.ts',
    'benchmarks/bun-api-benchmark.test.ts'
  ],
  tags: ['http', 'server', 'api', 'middleware', 'rest', 'crud'],
  dependencies: ['bun:sqlite', 'crypto'],
  alternatives: [
    'examples/applications/apis/bun-graphql-server.ts',
    'examples/applications/apis/bun-fastify-api.ts'
  ],
  description: 'Complete REST API with CRUD operations, authentication, and comprehensive middleware',
  lastUpdated: new Date().toISOString()
});

// Register benchmarks with their references
crossRefSystem.registerBenchmark({
  benchmark: 'benchmarks/bun-rest-performance.bench.ts',
  category: 'api-performance',
  metrics: ['responseTime', 'throughput', 'errorRate', 'memoryUsage'],
  baseline: {
    responseTime: 5,
    throughput: 1500,
    errorRate: 0.1,
    memoryUsage: 50
  },
  thresholds: {
    responseTime: 10,
    throughput: -10,
    errorRate: 5,
    memoryUsage: 25
  },
  relatedExamples: [
    'examples/applications/apis/bun-rest-crud-api.ts',
    'examples/applications/apis/bun-graphql-server.ts',
    'examples/patterns/performance/bun-load-testing.ts'
  ],
  comparisons: []
});

// Register more examples
crossRefSystem.registerExample({
  file: 'examples/core/networking/bun-tls-server.ts',
  category: 'core/networking',
  difficulty: 'intermediate',
  prerequisites: [],
  relatedExamples: [
    'examples/applications/apis/bun-rest-crud-api.ts',
    'examples/applications/realtime/bun-websocket-chat-api.ts',
    'examples/core/networking/bun-http-session.ts'
  ],
  guides: [],
  tests: ['examples/core/networking/bun-serve-testing.test.ts'],
  benchmarks: [],
  tags: ['http', 'server', 'tls', 'websocket', 'cors'],
  dependencies: ['bun:serve'],
  alternatives: ['examples/core/networking/bun-fastify-server.ts'],
  description: 'HTTP/HTTPS server with TLS, HTTP/2, WebSocket upgrade hooks',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/networking/bun-http-session.ts',
  category: 'core/networking',
  difficulty: 'intermediate',
  prerequisites: ['examples/core/networking/bun-tls-server.ts'],
  relatedExamples: [
    'examples/applications/apis/bun-rest-crud-api.ts',
    'examples/core/networking/bun-rate-limiting.ts',
    'examples/core/networking/bun-cors-middleware.ts'
  ],
  guides: [],
  tests: ['examples/core/networking/bun-http-session-testing.test.ts'],
  benchmarks: [],
  tags: ['http', 'authentication', 'sessions', 'security', 'middleware'],
  dependencies: ['crypto'],
  alternatives: ['examples/core/networking/bun-jwt-auth.ts'],
  description: 'Secure HTTP session management with automatic cleanup and configurable options',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/networking/bun-rate-limiting.ts',
  category: 'core/networking',
  difficulty: 'intermediate',
  prerequisites: ['examples/core/networking/bun-tls-server.ts', 'examples/core/networking/bun-http-session.ts'],
  relatedExamples: [
    'examples/applications/apis/bun-rest-crud-api.ts',
    'examples/core/networking/bun-cors-middleware.ts',
    'examples/core/networking/bun-http-session.ts'
  ],
  guides: [],
  tests: ['examples/core/networking/bun-rate-limiting-testing.test.ts'],
  benchmarks: [],
  tags: ['http', 'middleware', 'security', 'rate-limiting', 'ddos-protection'],
  dependencies: [],
  alternatives: ['examples/core/networking/bun-redis-rate-limiting.ts'],
  description: 'Advanced rate limiting middleware with multiple algorithms, Redis support, and configurable strategies',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/networking/bun-cors-middleware.ts',
  category: 'core/networking',
  difficulty: 'beginner',
  prerequisites: ['examples/core/networking/bun-tls-server.ts'],
  relatedExamples: [
    'examples/applications/apis/bun-rest-crud-api.ts',
    'examples/core/networking/bun-rate-limiting.ts',
    'examples/core/networking/bun-http-session.ts'
  ],
  guides: [],
  tests: ['examples/core/networking/bun-cors-testing.test.ts'],
  benchmarks: [],
  tags: ['http', 'middleware', 'cors', 'security', 'cross-origin'],
  dependencies: [],
  alternatives: ['examples/core/networking/bun-cors-express-compat.ts'],
  description: 'Comprehensive CORS middleware with preflight handling, configurable origins, and security features',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/networking/bun-api-validation.ts',
  category: 'core/networking',
  difficulty: 'intermediate',
  prerequisites: ['examples/core/networking/bun-tls-server.ts', 'examples/applications/apis/bun-rest-crud-api.ts'],
  relatedExamples: [
    'examples/applications/apis/bun-rest-crud-api.ts',
    'examples/core/file-system/bun-file-upload-api.ts',
    'examples/core/networking/bun-rate-limiting.ts'
  ],
  guides: [],
  tests: ['examples/core/networking/bun-api-validation-testing.test.ts'],
  benchmarks: [],
  tags: ['validation', 'security', 'api', 'middleware', 'sanitization'],
  dependencies: [],
  alternatives: ['examples/core/networking/bun-joi-validation.ts'],
  description: 'Comprehensive input validation middleware with sanitization, type checking, and security features',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/file-system/bun-file-upload-api.ts',
  category: 'core/file-system',
  difficulty: 'intermediate',
  prerequisites: ['examples/bun-file-mime-demo.test.ts', 'examples/core/networking/bun-tls-server.ts'],
  relatedExamples: [
    'examples/applications/apis/bun-rest-crud-api.ts',
    'examples/core/networking/bun-rate-limiting.ts'
  ],
  guides: [],
  tests: [],
  benchmarks: [],
  tags: ['file', 'upload', 'multipart', 'streaming', 'validation', 'security'],
  dependencies: [],
  alternatives: ['examples/core/file-system/bun-s3-upload.ts'],
  description: 'Complete file upload API with multipart handling, validation, streaming, and security features',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/applications/realtime/bun-websocket-chat-api.ts',
  category: 'applications/realtime',
  difficulty: 'intermediate',
  prerequisites: ['examples/core/networking/bun-tls-server.ts'],
  relatedExamples: [
    'examples/core/networking/bun-tls-server.ts',
    'examples/core/networking/bun-http-session.ts',
    'examples/core/networking/bun-http-session.ts',
    'examples/core/networking/bun-rate-limiting.ts'
  ],
  guides: [],
  tests: ['examples/applications/realtime/bun-websocket-chat-testing.test.ts'],
  benchmarks: [],
  tags: ['websocket', 'realtime', 'chat', 'messaging', 'rooms', 'authentication'],
  dependencies: ['crypto'],
  alternatives: ['examples/applications/realtime/bun-socket-io-chat.ts'],
  description: 'Real-time WebSocket chat API with rooms, authentication, message history, and connection management',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/networking/bun-tls-server.ts',
  category: 'core/networking',
  difficulty: 'advanced',
  prerequisites: ['examples/bun-file-mime-demo.test.ts'],
  relatedExamples: [
    'examples/core/networking/bun-http-session.ts',
    'examples/core/networking/bun-http-session.ts',
    'examples/core/networking/bun-cors-middleware.ts'
  ],
  guides: [],
  tests: ['examples/core/networking/bun-tls-server-testing.test.ts'],
  benchmarks: [],
  tags: ['tls', 'ssl', 'https', 'security', 'certificates', 'encryption'],
  dependencies: [],
  alternatives: ['examples/core/networking/bun-lets-encrypt-integration.ts'],
  description: 'Advanced TLS/HTTPS server with automatic certificate generation, HSTS, and security headers',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/bun-file-mime-demo.test.ts',
  category: 'core/file-system',
  difficulty: 'beginner',
  prerequisites: ['examples/core/file-system/bun-file-mime-advanced-demo.test.ts'],
  relatedExamples: [
    'examples/core/file-system/bun-file-upload-api.ts',
    'examples/core/file-system-advanced.ts'
  ],
  guides: [],
  tests: ['examples/core/file-system/bun-mime-testing.test.ts'],
  benchmarks: [],
  tags: ['mime', 'file-processing', 'content-type', 'validation'],
  dependencies: [],
  alternatives: ['examples/core/file-system/bun-file-mime-advanced-demo.test.ts'],
  description: 'Basic MIME type detection and content type handling for file uploads',
  lastUpdated: new Date().toISOString()
});

// Register additional core examples
crossRefSystem.registerExample({
  file: 'examples/core/bun-serve-advanced.ts',
  category: 'core/networking',
  difficulty: 'intermediate',
  prerequisites: [],
  relatedExamples: [
    'examples/core/networking/bun-tls-server.ts',
    'examples/core/networking/bun-http-session.ts',
    'examples/applications/apis/bun-rest-crud-api.ts'
  ],
  guides: [],
  tests: ['examples/core/networking/bun-serve-testing.test.ts'],
  benchmarks: [],
  tags: ['http', 'server', 'networking', 'bun-serve', 'web-server'],
  dependencies: [],
  alternatives: ['examples/core/networking/bun-tls-server.ts'],
  description: 'Advanced HTTP server configuration with Bun.serve, middleware, and routing',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/bun-sql-preconnect.ts',
  category: 'core/database',
  difficulty: 'intermediate',
  prerequisites: [],
  relatedExamples: [
    'examples/core/bun-serve-advanced.ts',
    'examples/applications/apis/bun-rest-crud-api.ts'
  ],
  guides: [],
  tests: ['examples/advanced/sql/bun-sql-testing.test.ts'],
  benchmarks: [],
  tags: ['database', 'sqlite', 'sql', 'preconnect', 'performance'],
  dependencies: ['bun:sqlite'],
  alternatives: ['examples/advanced/sql/bun-sql-example.ts'],
  description: 'SQLite database preconnection and optimization for high-performance applications',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/bun-executable-compilation.ts',
  category: 'core/build',
  difficulty: 'advanced',
  prerequisites: [],
  relatedExamples: [
    'examples/core/bun-serve-advanced.ts'
  ],
  guides: [],
  tests: ['examples/core/bun-build-testing.test.ts'],
  benchmarks: [],
  tags: ['build', 'compilation', 'executable', 'deployment', 'performance'],
  dependencies: [],
  alternatives: [],
  description: 'Compiling Bun applications to standalone executables for deployment',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/file-system-advanced.ts',
  category: 'core/file-system',
  difficulty: 'intermediate',
  prerequisites: ['examples/core/file-system/bun-file-streaming.ts'],
  relatedExamples: [
    'examples/core/file-system/bun-file-upload-api.ts',
    'examples/streaming/bun-compression.ts'
  ],
  guides: [],
  tests: ['examples/core/file-system/bun-file-system-testing.test.ts'],
  benchmarks: [],
  tags: ['file-system', 'streaming', 'io', 'performance', 'async'],
  dependencies: [],
  alternatives: ['examples/core/file-system/bun-file-streaming.ts'],
  description: 'Advanced file system operations including streaming, compression, and high-performance I/O',
  lastUpdated: new Date().toISOString()
});

// Register key testing examples
crossRefSystem.registerExample({
  file: 'examples/testing/bun-official-testing-patterns.test.ts',
  category: 'testing',
  difficulty: 'intermediate',
  prerequisites: [],
  relatedExamples: [
    'examples/bun-testing-demo.ts',
    'examples/bun-advanced-testing.test.ts'
  ],
  guides: [],
  tests: [],
  benchmarks: [],
  tags: ['testing', 'bun:test', 'patterns', 'best-practices', 'tdd'],
  dependencies: [],
  alternatives: ['examples/testing/bun-init-cli-testing-patterns.test.ts'],
  description: 'Official Bun testing patterns and best practices with comprehensive examples',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/bun-testing-demo.ts',
  category: 'testing',
  difficulty: 'beginner',
  prerequisites: [],
  relatedExamples: [
    'examples/testing/bun-official-testing-patterns.test.ts',
    'examples/bun-advanced-testing.test.ts'
  ],
  guides: [],
  tests: [],
  benchmarks: [],
  tags: ['testing', 'demo', 'beginner', 'bun:test', 'examples'],
  dependencies: [],
  alternatives: ['examples/testing/bun-official-testing-patterns.test.ts'],
  description: 'Beginner-friendly demonstration of Bun testing capabilities and patterns',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/bun-advanced-testing.test.ts',
  category: 'testing',
  difficulty: 'advanced',
  prerequisites: ['examples/testing/bun-official-testing-patterns.test.ts'],
  relatedExamples: [
    'examples/bun-testing-demo.ts'
  ],
  guides: [],
  tests: [],
  benchmarks: [],
  tags: ['testing', 'advanced', 'performance', 'edge-cases', 'comprehensive'],
  dependencies: [],
  alternatives: ['examples/testing/bun-official-testing-patterns.test.ts'],
  description: 'Advanced testing techniques including performance testing, edge cases, and comprehensive validation',
  lastUpdated: new Date().toISOString()
});

// Register streaming and utility examples
crossRefSystem.registerExample({
  file: 'examples/streaming/bun-compression.ts',
  category: 'streaming',
  difficulty: 'intermediate',
  prerequisites: ['examples/core/file-system/bun-file-streaming.ts'],
  relatedExamples: [
    'examples/core/file-system-advanced.ts',
    'examples/core/file-system/bun-file-upload-api.ts',
    'examples/core/networking/bun-tls-server.ts'
  ],
  guides: [],
  tests: ['examples/streaming/bun-compression-testing.test.ts'],
  benchmarks: [],
  tags: ['streaming', 'compression', 'gzip', 'deflate', 'performance'],
  dependencies: [],
  alternatives: ['examples/core/file-system/bun-file-streaming.ts'],
  description: 'High-performance streaming compression using Bun built-in gzip/deflate algorithms',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/core/bun-strip-ansi.ts',
  category: 'core/utils',
  difficulty: 'beginner',
  prerequisites: [],
  relatedExamples: [
    'examples/core/utils/bun-uuid-v7-demo.ts',
    'examples/logging/bun-logger.ts'
  ],
  guides: [],
  tests: ['examples/core/bun-utilities-testing.test.ts'],
  benchmarks: [],
  tags: ['utilities', 'ansi', 'terminal', 'formatting', 'text-processing'],
  dependencies: [],
  alternatives: [],
  description: 'ANSI escape code stripping for clean terminal output and text processing',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/logging/bun-logger.ts',
  category: 'logging',
  difficulty: 'intermediate',
  prerequisites: [],
  relatedExamples: [
    'examples/core/bun-strip-ansi.ts',
    'examples/core/bun-serve-advanced.ts',
    'examples/applications/apis/bun-rest-crud-api.ts'
  ],
  guides: [],
  tests: ['examples/logging/bun-logger-testing.test.ts'],
  benchmarks: [],
  tags: ['logging', 'monitoring', 'debugging', 'observability', 'structured-logs'],
  dependencies: [],
  alternatives: ['examples/monitoring/system-monitor.ts'],
  description: 'Structured logging system with multiple output formats and performance monitoring',
  lastUpdated: new Date().toISOString()
});

// Register package management examples
crossRefSystem.registerExample({
  file: 'examples/package-management/bun-patch-demo.ts',
  category: 'package-management',
  difficulty: 'intermediate',
  prerequisites: [],
  relatedExamples: [],
  guides: [],
  tests: ['examples/package-management/bun-patch-testing.test.ts'],
  benchmarks: [],
  tags: ['package-management', 'patching', 'dependencies', 'node_modules', 'development-tools'],
  dependencies: [],
  alternatives: [],
  description: 'Comprehensive demonstration of Bun\'s package patching capabilities for modifying dependencies',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/package-management/bun-patch-testing.test.ts',
  category: 'package-management',
  difficulty: 'intermediate',
  prerequisites: ['examples/package-management/bun-patch-demo.ts'],
  relatedExamples: [
    'examples/package-management/bun-patch-demo.ts'
  ],
  guides: [],
  tests: [],
  benchmarks: [],
  tags: ['package-management', 'patching', 'testing', 'validation'],
  dependencies: [],
  alternatives: [],
  description: 'Test suite for Bun package patching functionality and workflows',
  lastUpdated: new Date().toISOString()
});

// Register UUID v7 examples
crossRefSystem.registerExample({
  file: 'examples/core/utils/bun-uuid-v7-demo.ts',
  category: 'core/utils',
  difficulty: 'intermediate',
  prerequisites: [],
  relatedExamples: [
    'examples/core/networking/bun-api-validation.ts',
    'examples/core/networking/bun-tls-server.ts'
  ],
  guides: [],
  tests: ['examples/bun-uuid-v7.test.ts'],
  benchmarks: [],
  tags: ['uuid', 'crypto', 'timestamp', 'sorting', 'performance', 'time-sortable', 'database'],
  dependencies: [],
  alternatives: ['examples/bun-uuid-demo.test.ts'],
  description: 'Comprehensive demonstration of Bun.randomUUIDv7 native API with utility functions for validation, timestamp extraction, and comparison',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/bun-uuid-v7.test.ts',
  category: 'core/utils',
  difficulty: 'intermediate',
  prerequisites: ['examples/core/utils/bun-uuid-v7-demo.ts'],
  relatedExamples: [
    'examples/core/networking/bun-api-validation.ts',
    'examples/core/networking/bun-tls-server.ts'
  ],
  guides: [],
  tests: [],
  benchmarks: [],
  tags: ['uuid', 'testing', 'validation', 'crypto', 'timestamp', 'performance'],
  dependencies: [],
  alternatives: ['examples/bun-uuid-demo.test.ts'],
  description: 'Comprehensive test suite for Bun.randomUUIDv7 implementation with format validation, time ordering, and performance testing',
  lastUpdated: new Date().toISOString()
});

// Register UUID v7 benchmark
crossRefSystem.registerBenchmark({
  benchmark: 'benchmarks/uuid-v7-performance.bench.ts',
  category: 'performance',
  metrics: ['generationSpeed', 'memoryUsage', 'validityRate', 'timestampAccuracy', 'sortability'],
  baseline: {
    generationSpeed: 1000000,
    memoryUsage: 0,
    validityRate: 100,
    timestampAccuracy: 100,
    sortability: 100
  },
  thresholds: {
    generationSpeed: 2000000,
    memoryUsage: 1,
    validityRate: 99.9,
    timestampAccuracy: 99.9,
    sortability: 100
  },
  relatedExamples: [
    'examples/core/utils/bun-uuid-v7-demo.ts',
    'examples/bun-uuid-v7.test.ts'
  ],
  comparisons: [
    'benchmarks/bun-rest-performance.bench.ts',
    'benchmarks/bun-api-benchmark.test.ts'
  ]
});

crossRefSystem.registerExample({
  file: 'examples/core/file-system/bun-file-streaming.ts',
  category: 'core/file-system',
  difficulty: 'intermediate',
  prerequisites: ['examples/bun-file-mime-demo.test.ts', 'examples/core/file-system/bun-file-upload-api.ts'],
  relatedExamples: [
    'examples/bun-file-mime-demo.test.ts',
    'examples/core/file-system/bun-file-upload-api.ts'
  ],
  guides: [],
  tests: [],
  benchmarks: [],
  tags: ['streaming', 'files', 'performance', 'memory-efficient', 'large-files'],
  dependencies: [],
  alternatives: [],
  description: 'High-performance file streaming utilities with memory-efficient processing, progress tracking, and resumable transfers',
  lastUpdated: new Date().toISOString()
});

crossRefSystem.registerExample({
  file: 'examples/bun-file-mime-demo.test.ts',
  category: 'core/file-system',
  difficulty: 'beginner',
  prerequisites: [],
  relatedExamples: [
    'examples/core/file-system/bun-file-streaming.ts',
    'examples/core/file-system/bun-file-upload-api.ts',
    'examples/applications/apis/bun-rest-crud-api.ts'
  ],
  guides: ['examples/guides/quickstart/bun-file-operations.md'],
  tests: [],
  benchmarks: ['benchmarks/bun-file-mime.benchmark.test.ts'],
  tags: ['file', 'mime', 'filesystem', 'streaming'],
  dependencies: ['bun:file'],
  alternatives: ['examples/core/file-system/bun-node-fs-compat.ts'],
  description: 'File API mime-type handling and custom type override',
  lastUpdated: new Date().toISOString()
});

// Export the populated system
export { crossRefSystem };

// Validation
const validation = crossRefSystem.validateReferences();
if (!validation.valid) {
  console.warn('⚠️  Cross-reference validation errors:', validation.errors);
} else {
  console.log('✅ Cross-reference system validated successfully');
}

// Utility functions for working with cross-references
export function getRelatedExamples(file: string) {
  return crossRefSystem.getRelatedExamples(file);
}

export function getExamplesByTags(tags: string[]) {
  return crossRefSystem.getExamplesByTags(tags);
}

export function getLearningPath(topic: string) {
  return crossRefSystem.getLearningPath(topic);
}

export function getBenchmarksForExample(example: string) {
  return crossRefSystem.getBenchmarksForExample(example);
}

// CLI interface for exploring cross-references
if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'related':
      const file = args[1];
      if (!file) {
        console.log('Usage: bun run cross-references/registry.ts related <file>');
        process.exit(1);
      }
      const related = getRelatedExamples(file);
      console.log(`📄 Related examples for ${file}:`);
      related.forEach(ex => console.log(`  • ${ex.file} (${ex.difficulty}) - ${ex.description}`));
      break;

    case 'tags':
      const tags = args.slice(1);
      if (tags.length === 0) {
        console.log('Usage: bun run cross-references/registry.ts tags <tag1> <tag2> ...');
        process.exit(1);
      }
      const tagged = getExamplesByTags(tags);
      console.log(`🏷️  Examples with tags [${tags.join(', ')}]:`);
      tagged.forEach(ex => console.log(`  • ${ex.file} - ${ex.description}`));
      break;

    case 'path':
      const topic = args[1];
      if (!topic) {
        console.log('Usage: bun run cross-references/registry.ts path <topic>');
        process.exit(1);
      }
      const path = getLearningPath(topic);
      console.log(`🎓 Learning path for "${topic}":`);
      path.forEach((ex, index) => console.log(`  ${index + 1}. ${ex.file} (${ex.difficulty})`));
      break;

    case 'benchmarks':
      const example = args[1];
      if (!example) {
        console.log('Usage: bun run cross-references/registry.ts benchmarks <example>');
        process.exit(1);
      }
      const benchmarks = getBenchmarksForExample(example);
      console.log(`📊 Benchmarks for ${example}:`);
      benchmarks.forEach(bench => console.log(`  • ${bench.benchmark} (${bench.category})`));
      break;

    case 'stats':
      const data = crossRefSystem.export();
      console.log('📈 Cross-Reference Statistics:');
      console.log(`  • ${data.examples.length} examples registered`);
      console.log(`  • ${data.benchmarks.length} benchmarks registered`);
      console.log(`  • Total cross-references: ${data.examples.reduce((sum, ex) => sum + ex.relatedExamples.length + ex.benchmarks.length, 0)}`);
      break;

    default:
      console.log('🔗 Cross-Reference Explorer');
      console.log('===========================');
      console.log('Commands:');
      console.log('  related <file>     - Show related examples');
      console.log('  tags <tag...>      - Find examples by tags');
      console.log('  path <topic>       - Show learning path');
      console.log('  benchmarks <file>  - Show benchmarks for example');
      console.log('  stats              - Show system statistics');
      break;
  }
}