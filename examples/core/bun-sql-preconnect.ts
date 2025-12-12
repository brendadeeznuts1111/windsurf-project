/**
 * Bun SQL Preconnect - Reducing First-Query Latency
 * Demonstrates the new --sql-preconnect CLI flag for PostgreSQL connection warming
 */

import { sql } from 'bun';

// ===== DATABASE CONNECTION WARMING =====

// This example demonstrates how to use --sql-preconnect to reduce first-query latency

async function demonstratePreconnect() {
  console.log('🚀 Testing SQL Preconnect Performance...\n');

  // Measure first query time (with preconnect, this should be much faster)
  const startTime = performance.now();

  try {
    // First query - should be fast if --sql-preconnect was used
    const result = await sql`SELECT NOW() as current_time, 'preconnect_demo' as test`;
    const firstQueryTime = performance.now() - startTime;

    console.log('✅ First query successful!');
    console.log(`⏱️  First query time: ${firstQueryTime.toFixed(2)}ms`);
    console.log('📊 Query result:', result[0]);

    // Additional queries to show normal performance
    const additionalStart = performance.now();
    const results = await Promise.all([
      sql`SELECT COUNT(*) as user_count FROM users`,
      sql`SELECT COUNT(*) as posts_count FROM posts`,
      sql`SELECT AVG(length) as avg_content_length FROM content`
    ]);
    const additionalTime = performance.now() - additionalStart;

    console.log(`\n⏱️  Additional queries time: ${additionalTime.toFixed(2)}ms`);
    console.log('📊 Additional results:', results);

    // Performance analysis
    if (firstQueryTime < 50) { // Should be very fast with preconnect
      console.log('\n🎯 Performance: EXCELLENT - Preconnect working!');
      console.log('💡 The database connection was established at startup.');
    } else if (firstQueryTime < 200) {
      console.log('\n⚠️  Performance: GOOD - Connection established on first query.');
      console.log('💡 Consider using --sql-preconnect for even better performance.');
    } else {
      console.log('\n❌ Performance: SLOW - Connection issues detected.');
      console.log('🔧 Check your DATABASE_URL and network connectivity.');
    }

  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    console.log('\n🔧 To use --sql-preconnect:');
    console.log('   export DATABASE_URL="postgres://user:pass@host:port/db"');
    console.log('   bun --sql-preconnect run this-file.ts');
  }
}

// ===== PRACTICAL USAGE PATTERNS =====

async function productionPatterns() {
  console.log('\n🏭 Production Usage Patterns:\n');

  // Pattern 1: Health checks with preconnect
  console.log('1. Health Check Pattern:');
  try {
    const health = await sql`SELECT 1 as health_check, NOW() as timestamp`;
    console.log('   ✅ Database health:', health[0]);
    } catch (error: any) {
      console.log('   ❌ Health check failed');
    }

  // Pattern 2: Connection pooling verification
  console.log('\n2. Connection Pool Verification:');
  const poolTests = await Promise.all(
    Array.from({ length: 5 }, async (_, i) => {
      const start = performance.now();
      await sql`SELECT ${i} as connection_test`;
      return performance.now() - start;
    })
  );

  const avgPoolTime = poolTests.reduce((a, b) => a + b, 0) / poolTests.length;
  console.log(`   📊 Average connection time: ${avgPoolTime.toFixed(2)}ms`);
  console.log(`   🔄 Pool test results: [${poolTests.map(t => t.toFixed(1)).join(', ')}]ms`);

  // Pattern 3: Transaction performance
  console.log('\n3. Transaction Performance:');
  const transactionStart = performance.now();
  await sql.begin(async (tx) => {
    await tx`INSERT INTO metrics (name, value, timestamp) VALUES ('preconnect_test', ${Date.now()}, NOW())`;
    await tx`UPDATE metrics SET value = value + 1 WHERE name = 'preconnect_test'`;
  });
  const transactionTime = performance.now() - transactionStart;

  console.log(`   💾 Transaction completed in: ${transactionTime.toFixed(2)}ms`);
}

// ===== CLI USAGE EXAMPLES =====

// To run this with preconnect (recommended for production):
// export DATABASE_URL="postgres://user:pass@host:port/db"
// bun --sql-preconnect run examples/core/bun-sql-preconnect.ts

// To run without preconnect (for comparison):
// export DATABASE_URL="postgres://user:pass@host:port/db"
// bun run examples/core/bun-sql-preconnect.ts

// ===== CONFIGURATION EXAMPLES =====

// Environment setup for different environments:
const configs = {
  development: {
    url: 'postgres://dev:dev@localhost:5432/windsurf_dev',
    preconnect: false // Usually not needed in dev
  },
  staging: {
    url: 'postgres://staging:pass@staging-db.example.com:5432/windsurf_staging',
    preconnect: true // Recommended for staging
  },
  production: {
    url: 'postgres://prod:secure@prod-db.example.com:5432/windsurf_prod',
    preconnect: true // Essential for production
  }
};

console.log('🔧 Configuration Examples:');
Object.entries(configs).forEach(([env, config]) => {
  console.log(`   ${env}: ${config.preconnect ? '✅' : '❌'} preconnect`);
  console.log(`      URL: ${config.url.replace(/:[^:]+@/, ':***@')}`);
});

// ===== PERFORMANCE METRICS =====

async function performanceMetrics() {
  console.log('\n📊 Performance Metrics:\n');

  // Measure multiple query types
  const queryTypes = [
    { name: 'Simple SELECT', query: sql`SELECT 42 as answer` },
    { name: 'Complex JOIN', query: sql`SELECT u.name, COUNT(p.id) as posts FROM users u LEFT JOIN posts p ON u.id = p.user_id GROUP BY u.id LIMIT 5` },
    { name: 'INSERT operation', query: sql`INSERT INTO logs (level, message, timestamp) VALUES ('info', 'preconnect test', NOW())` },
    { name: 'JSON query', query: sql`SELECT data->>'version' as version FROM app_config LIMIT 1` }
  ];

  for (const { name, query } of queryTypes) {
    try {
      const start = performance.now();
      const result = await query;
      const time = performance.now() - start;

      console.log(`   ${name}: ${time.toFixed(2)}ms`);
    } catch (error: any) {
      console.log('   ❌ Health check failed');
    }
  }
}

// ===== RUN DEMONSTRATION =====

async function main() {
  console.log('🔌 Bun SQL Preconnect Demonstration');
  console.log('=====================================\n');

  await demonstratePreconnect();
  await productionPatterns();
  await performanceMetrics();

  console.log('\n🎯 Summary:');
  console.log('• Use --sql-preconnect for production deployments');
  console.log('• Reduces first-query latency significantly');
  console.log('• Graceful fallback if connection fails');
  console.log('• No application code changes required');
  console.log('\n✅ Demonstration complete!');
}

// Run if this file is executed directly
if (import.meta.main) {
  main().catch(console.error);
}

export { demonstratePreconnect, productionPatterns, performanceMetrics };