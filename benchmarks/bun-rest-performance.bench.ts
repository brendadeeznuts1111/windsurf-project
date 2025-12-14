#!/usr/bin/env bun

/**
 * @benchmark-links
 * @performance-baseline responseTime: <10ms, throughput: >1000req/sec, memoryUsage: <50MB
 * @optimization-targets memory-usage: <50MB, response-time: <5ms, throughput: >1500req/sec
 * @comparative-benchmarks node-express-comparison.bench.ts, deno-http-comparison.bench.ts
 * @related-examples
 *   - examples/applications/apis/bun-rest-crud-api.ts (implementation)
 *   - examples/applications/apis/bun-graphql-server.ts (GraphQL comparison)
 *   - examples/patterns/performance/bun-load-testing.ts (testing)
 * @guides examples/guides/advanced/bun-api-optimization.md
 * @tags http, api, performance, benchmark, rest, crud
 */

// Note: This benchmark is designed to test the REST API server
// Import would be: import { RESTAPIServer } from '../examples/applications/apis/bun-rest-crud-api'

const BASE_URL = 'http://localhost:3001';

interface BenchmarkResult {
  endpoint: string;
  method: string;
  samples: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

class RESTAPIBenchmark {
  private results: BenchmarkResult[] = [];

  async runBenchmarks(): Promise<void> {
    console.log('🚀 REST API Performance Benchmarks');
    console.log('===================================\n');

    console.log('⚠️  Note: This benchmark requires the REST API server to be running on port 3001');
    console.log('   Start it with: bun run examples/applications/apis/bun-rest-crud-api.ts\n');

    // Check if server is running
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/health`);
      if (!healthResponse.ok) {
        throw new Error('Server not responding');
      }
      console.log('✅ REST API server detected and responding');
    } catch (error) {
      console.log('❌ REST API server not found. Please start the server first:');
      console.log('   bun run examples/applications/apis/bun-rest-crud-api.ts');
      return;
    }

    try {
      // Health check benchmark
      await this.benchmarkEndpoint('/api/health', 'GET', 100);

      // User creation benchmark (smaller sample for demo)
      await this.benchmarkEndpoint('/api/users', 'POST', 50, {
        username: `user_${Date.now()}_${Math.random()}`,
        email: `user_${Date.now()}_${Math.random()}@example.com`
      });

      // User retrieval benchmark
      await this.benchmarkEndpoint('/api/users/user-123', 'GET', 100);

      // Post retrieval benchmark
      await this.benchmarkEndpoint('/api/posts', 'GET', 100);

      this.printResults();

    } catch (error) {
      console.error('❌ Benchmark failed:', error);
    }
  }

  private async benchmarkEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    sampleSize: number = 1000,
    body?: any
  ): Promise<void> {
    console.log(`\n🏃 Benchmarking ${method} ${endpoint} (${sampleSize} requests)...`);

    const responseTimes: number[] = [];
    let errors = 0;

    const startTime = performance.now();

    // Warm up (10% of sample size)
    const warmupSize = Math.max(10, Math.floor(sampleSize * 0.1));
    for (let i = 0; i < warmupSize; i++) {
      try {
        await this.makeRequest(endpoint, method, body);
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Actual benchmark
    for (let i = 0; i < sampleSize; i++) {
      const requestStart = performance.now();

      try {
        await this.makeRequest(endpoint, method, body);
        const requestTime = performance.now() - requestStart;
        responseTimes.push(requestTime);
      } catch (error) {
        errors++;
        responseTimes.push(performance.now() - requestStart);
      }

      // Progress indicator
      if ((i + 1) % 100 === 0) {
        process.stdout.write(`  Progress: ${i + 1}/${sampleSize} requests\r`);
      }
    }

    const totalTime = performance.now() - startTime;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const minResponseTime = sortedTimes[0];
    const maxResponseTime = sortedTimes[sortedTimes.length - 1];
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    const p95ResponseTime = sortedTimes[p95Index];
    const p99ResponseTime = sortedTimes[p99Index];
    const requestsPerSecond = (sampleSize / totalTime) * 1000;
    const errorRate = (errors / sampleSize) * 100;

    this.results.push({
      endpoint,
      method,
      samples: sampleSize,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      errorRate
    });

    console.log(`  ✅ Completed: ${requestsPerSecond.toFixed(0)} req/sec, ${avgResponseTime.toFixed(2)}ms avg`);
  }

  private async makeRequest(endpoint: string, method: string, body?: any): Promise<Response> {
    const url = `${BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok && response.status !== 404 && response.status !== 401) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  }

  private printResults(): void {
    console.log('\n📊 Benchmark Results Summary');
    console.log('=============================\n');

    console.log('┌─────────────────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ Endpoint                    │ Method │ Samples │ Avg (ms) │ P95 (ms) │ RPS     │ Errors │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────────────┤');

    this.results.forEach(result => {
      const endpoint = result.endpoint.padEnd(27);
      const method = result.method.padEnd(6);
      const samples = result.samples.toString().padStart(7);
      const avg = result.avgResponseTime.toFixed(1).padStart(8);
      const p95 = result.p95ResponseTime.toFixed(1).padStart(8);
      const rps = result.requestsPerSecond.toFixed(0).padStart(7);
      const errors = `${result.errorRate.toFixed(1)}%`.padStart(6);

      console.log(`│ ${endpoint} │ ${method} │ ${samples} │ ${avg} │ ${p95} │ ${rps} │ ${errors} │`);
    });

    console.log('└─────────────────────────────────────────────────────────────────────────────────────────────┘\n');

    // Performance analysis
    console.log('🎯 Performance Analysis:');
    console.log('=======================');

    const avgRPS = this.results.reduce((sum, r) => sum + r.requestsPerSecond, 0) / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / this.results.length;
    const totalErrors = this.results.reduce((sum, r) => sum + (r.errorRate * r.samples / 100), 0);
    const errorRate = (totalErrors / this.results.reduce((sum, r) => sum + r.samples, 0)) * 100;

    console.log(`📈 Average Throughput: ${avgRPS.toFixed(0)} requests/second`);
    console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`🎯 Overall Error Rate: ${errorRate.toFixed(2)}%`);

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    if (avgRPS > 1000) {
      console.log('   ✅ Excellent throughput! Server handles high load well.');
    } else if (avgRPS > 500) {
      console.log('   ⚠️ Good throughput, but could be optimized for higher loads.');
    } else {
      console.log('   ❌ Low throughput. Consider performance optimizations.');
    }

    if (avgResponseTime < 10) {
      console.log('   ✅ Fast response times! Excellent user experience.');
    } else if (avgResponseTime < 50) {
      console.log('   ⚠️ Acceptable response times, but could be faster.');
    } else {
      console.log('   ❌ Slow response times. Needs optimization.');
    }

    if (errorRate < 1) {
      console.log('   ✅ Low error rate! Reliable API.');
    } else {
      console.log('   ❌ High error rate. Check error handling and validation.');
    }

    console.log('\n🔗 Cross-References:');
    console.log('   • Implementation: examples/applications/apis/bun-rest-crud-api.ts');
    console.log('   • Testing: examples/patterns/testing/bun-api-testing.test.ts');
    console.log('   • Optimization: examples/guides/advanced/bun-api-optimization.md');
    console.log('   • Comparison: benchmarks/node-express-comparison.bench.ts');
  }
}

// Run benchmarks if called directly
if (import.meta.main) {
  const benchmark = new RESTAPIBenchmark();
  benchmark.runBenchmarks().catch(console.error);
}

export { RESTAPIBenchmark, BenchmarkResult };