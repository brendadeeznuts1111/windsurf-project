#!/usr/bin/env bun

/**
 * @benchmark-links
 * @performance-baseline generationSpeed: >1000000/sec, memoryUsage: <1MB, sortability: 100%
 * @optimization-targets generationSpeed: >2000000/sec, memoryUsage: <500KB
 * @comparative-benchmarks uuid-v4-comparison.bench.ts, crypto-random-comparison.bench.ts
 * @related-examples
 *   - examples/core/utils/bun-uuid-v7-demo.ts (implementation demo)
 *   - examples/bun-uuid-demo.test.ts (existing UUID tests)
 * @tags uuid, performance, crypto, timestamp, sorting
 */

import { UUIDv7 } from '../examples/core/utils/bun-uuid-v7-demo';

class UUIDv7Benchmark {
  private results: any[] = [];

  async runBenchmarks(): Promise<void> {
    console.log('🚀 UUID v7 Performance Benchmarks');
    console.log('==================================\n');

    // Basic generation benchmark
    await this.benchmarkGeneration('Basic Generation', 100000, () => UUIDv7.generate());

    // Different encoding benchmarks
    await this.benchmarkGeneration('Hex Encoding', 50000, () => UUIDv7.generate('hex'));
    await this.benchmarkGeneration('Base64 Encoding', 50000, () => UUIDv7.generate('base64'));
    await this.benchmarkGeneration('Base64URL Encoding', 50000, () => UUIDv7.generate('base64url'));

    // Timestamp control benchmark
    await this.benchmarkGeneration('Timestamp Control', 50000, () => {
      const timestamp = Math.floor(Date.now() - Math.random() * 86400000); // Random time within last 24h
      return UUIDv7.generate('hex', timestamp);
    });

    // Validation benchmark
    await this.benchmarkValidation('UUID Validation', 10000);

    // Timestamp extraction benchmark
    await this.benchmarkTimestampExtraction('Timestamp Extraction', 10000);

    // Sorting benchmark
    await this.benchmarkSorting('UUID Sorting', 5000);

    this.printResults();
  }

  private async benchmarkGeneration(name: string, iterations: number, generator: () => string): Promise<void> {
    console.log(`🏃 Benchmarking: ${name} (${iterations.toLocaleString()} iterations)`);

    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const uuids: string[] = [];
    for (let i = 0; i < iterations; i++) {
      uuids.push(generator());
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const duration = endTime - startTime;
    const speed = iterations / (duration / 1000);
    const memoryUsage = (endMemory - startMemory) / iterations;

    // Validate generated UUIDs (only hex encoding is UUID format)
    const isHexEncoding = name.includes('Hex') || name.includes('Basic') || name.includes('Timestamp');
    const validCount = isHexEncoding ? uuids.filter(uuid => UUIDv7.validate(uuid)).length : iterations;
    const validityRate = (validCount / iterations) * 100;

    this.results.push({
      name,
      iterations,
      duration,
      speed,
      memoryUsage,
      validityRate,
      type: 'generation'
    });

    console.log(`  ✅ ${speed.toFixed(0).toLocaleString()} UUIDs/sec, ${memoryUsage.toFixed(2)} bytes each, ${validityRate.toFixed(1)}% valid`);
  }

  private async benchmarkValidation(name: string, iterations: number): Promise<void> {
    console.log(`🔍 Benchmarking: ${name} (${iterations.toLocaleString()} iterations)`);

    // Generate UUIDs for validation
    const uuids = Array.from({ length: iterations }, () => UUIDv7.generate());
    const invalidUuids = Array.from({ length: Math.floor(iterations * 0.1) }, () => 'invalid-uuid-' + Math.random());

    const testUuids = [...uuids, ...invalidUuids];

    const startTime = performance.now();

    let validCount = 0;
    for (const uuid of testUuids) {
      if (UUIDv7.validate(uuid)) validCount++;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const speed = testUuids.length / (duration / 1000);
    const accuracy = (validCount / uuids.length) * 100; // Should be 100%

    this.results.push({
      name,
      iterations: testUuids.length,
      duration,
      speed,
      accuracy,
      type: 'validation'
    });

    console.log(`  ✅ ${speed.toFixed(0).toLocaleString()} validations/sec, ${accuracy.toFixed(1)}% accuracy`);
  }

  private async benchmarkTimestampExtraction(name: string, iterations: number): Promise<void> {
    console.log(`⏰ Benchmarking: ${name} (${iterations.toLocaleString()} iterations)`);

    const uuids = Array.from({ length: iterations }, () => UUIDv7.generate());

    const startTime = performance.now();

    for (const uuid of uuids) {
      UUIDv7.extractTimestamp(uuid);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const speed = iterations / (duration / 1000);

    // Verify correctness
    const testUuid = uuids[0];
    const extracted = UUIDv7.extractTimestamp(testUuid);
    const original = Date.now();
    const timeDiff = Math.abs(extracted - original);
    const accuracy = timeDiff < 1000; // Within 1 second

    this.results.push({
      name,
      iterations,
      duration,
      speed,
      accuracy,
      type: 'extraction'
    });

    console.log(`  ✅ ${speed.toFixed(0).toLocaleString()} extractions/sec, ${accuracy ? 'accurate' : 'inaccurate'} timing`);
  }

  private async benchmarkSorting(name: string, iterations: number): Promise<void> {
    console.log(`📊 Benchmarking: ${name} (${iterations.toLocaleString()} UUIDs)`);

    // Generate UUIDs with some time spread
    const uuids: string[] = [];
    const baseTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const timestamp = baseTime + (i * 10); // 10ms apart
      uuids.push(UUIDv7.generate('hex', timestamp));
    }

    // Shuffle the array
    const shuffled = [...uuids].sort(() => Math.random() - 0.5);

    const startTime = performance.now();

    // Sort by UUID comparison
    const sorted = shuffled.sort((a, b) => UUIDv7.compare(a, b));

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Verify sorting is correct
    let isCorrectlySorted = true;
    for (let i = 1; i < sorted.length; i++) {
      if (UUIDv7.compare(sorted[i-1], sorted[i]) > 0) {
        isCorrectlySorted = false;
        break;
      }
    }

    // Check if original order is maintained
    const maintainsOrder = sorted.every((uuid, index) => uuid === uuids[index]);

    this.results.push({
      name,
      iterations,
      duration,
      correctlySorted: isCorrectlySorted,
      maintainsOrder,
      type: 'sorting'
    });

    console.log(`  ✅ ${(iterations / (duration / 1000)).toFixed(0).toLocaleString()} UUIDs/sec sorting, ${isCorrectlySorted ? 'correctly sorted' : 'sorting failed'}`);
  }

  private printResults(): void {
    console.log('\n📊 Benchmark Results Summary');
    console.log('=============================\n');

    // Generation benchmarks
    const generationResults = this.results.filter(r => r.type === 'generation');
    if (generationResults.length > 0) {
      console.log('🏭 UUID Generation Performance:');
      generationResults.forEach(result => {
        console.log(`  ${result.name.padEnd(20)}: ${result.speed.toFixed(0).toLocaleString().padStart(8)} UUIDs/sec, ${result.memoryUsage.toFixed(1).padStart(4)} bytes, ${result.validityRate.toFixed(1).padStart(4)}% valid`);
      });
    }

    // Other benchmarks
    const otherResults = this.results.filter(r => r.type !== 'generation');
    if (otherResults.length > 0) {
      console.log('\n🔧 Other Operations:');
      otherResults.forEach(result => {
        if (result.type === 'validation') {
          console.log(`  ${result.name.padEnd(20)}: ${result.speed.toFixed(0).toLocaleString().padStart(8)} ops/sec, ${result.accuracy.toFixed(1).padStart(4)}% accuracy`);
        } else if (result.type === 'extraction') {
          console.log(`  ${result.name.padEnd(20)}: ${result.speed.toFixed(0).toLocaleString().padStart(8)} ops/sec, ${result.accuracy ? 'accurate' : 'inaccurate'}`);
        } else if (result.type === 'sorting') {
          console.log(`  ${result.name.padEnd(20)}: ${(result.iterations / (result.duration / 1000)).toFixed(0).toLocaleString().padStart(8)} UUIDs/sec, ${result.correctlySorted ? 'correct' : 'incorrect'} sorting`);
        }
      });
    }

    // Performance analysis
    console.log('\n🎯 Performance Analysis:');
    const avgGenerationSpeed = generationResults.reduce((sum, r) => sum + r.speed, 0) / generationResults.length;
    const avgMemoryUsage = generationResults.reduce((sum, r) => sum + r.memoryUsage, 0) / generationResults.length;
    const avgValidity = generationResults.reduce((sum, r) => sum + r.validityRate, 0) / generationResults.length;

    console.log(`📈 Average Generation Speed: ${avgGenerationSpeed.toFixed(0).toLocaleString()} UUIDs/second`);
    console.log(`💾 Average Memory Usage: ${avgMemoryUsage.toFixed(2)} bytes per UUID`);
    console.log(`✅ Average Validity Rate: ${avgValidity.toFixed(1)}%`);

    // Recommendations
    console.log('\n💡 Performance Recommendations:');
    if (avgGenerationSpeed > 500000) {
      console.log('   ✅ Excellent generation performance!');
    } else if (avgGenerationSpeed > 100000) {
      console.log('   ⚠️ Good performance, but could be optimized further.');
    } else {
      console.log('   ❌ Generation speed needs improvement.');
    }

    if (avgMemoryUsage < 10) {
      console.log('   ✅ Excellent memory efficiency!');
    } else if (avgMemoryUsage < 50) {
      console.log('   ⚠️ Reasonable memory usage.');
    } else {
      console.log('   ❌ High memory usage per UUID.');
    }

    if (avgValidity > 99.9) {
      console.log('   ✅ Perfect UUID generation validity!');
    } else {
      console.log('   ❌ UUID generation has validity issues.');
    }

    console.log('\n🔗 Cross-References:');
    console.log('   • Implementation: examples/core/utils/bun-uuid-v7-demo.ts');
    console.log('   • Related: examples/bun-uuid-demo.test.ts');
    console.log('   • Performance: examples/core/utils/bun-utils-benchmark.ts');

    console.log('\n🎉 UUID v7 benchmark complete!');
  }
}

// Run benchmarks if called directly
if (import.meta.main) {
  const benchmark = new UUIDv7Benchmark();
  benchmark.runBenchmarks().catch(console.error);
}

export { UUIDv7Benchmark };