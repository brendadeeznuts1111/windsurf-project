#!/usr/bin/env bun

/**
 * 🌊 Smooth Pattern Weaver - Demonstration
 *
 * Showcases the smooth pattern weaving capabilities with glide transitions
 * and adaptive pattern generation for the Windsurf platform.
 */

import { smoothPatternWeaver, weavePatterns, glideTransition, createAdaptivePattern } from './smooth-pattern-weaver';

async function demonstratePatternWeaving() {
  console.log('🌊 Smooth Pattern Weaver - Live Demonstration\n');
  console.log('=' .repeat(60) + '\n');

  // 1. Show registered patterns
  console.log('📋 Registered Patterns:');
  const analytics = smoothPatternWeaver.getWeaveAnalytics();
  Object.entries(analytics.patternTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} patterns`);
  });
  console.log('');

  // 2. Demonstrate pattern weaving
  console.log('🧵 Pattern Weaving Demonstration:');
  console.log('-'.repeat(40));

  const weaveResult = await smoothPatternWeaver.weavePatterns([
    'http-server-advanced',
    'build-pipeline-advanced',
    'real-benchmarks-suite'
  ], {
    smoothness: 0.9,
    compatibilityCheck: true
  });

  console.log(`✅ Weaved ${weaveResult.transitions.length} transitions`);
  console.log(`   Smoothness: ${(weaveResult.smoothness * 100).toFixed(1)}%`);
  console.log(`   Compatibility: ${(weaveResult.performance.compatibilityScore * 100).toFixed(1)}%`);
  console.log(`   Weave Time: ${weaveResult.performance.weaveTime.toFixed(2)}ms`);
  console.log('');

  // 3. Demonstrate glide transitions
  console.log('🛷 Glide Transition Demonstration:');
  console.log('-'.repeat(40));

  const glideResult = await smoothPatternWeaver.glideTransition(
    'http-server-advanced',
    'build-pipeline-advanced',
    {
      glideFactor: 0.95,
      duration: 500,
      easing: 'ease-in-out'
    }
  );

  console.log(`✅ Glided from "${glideResult.from}" to "${glideResult.to}"`);
  console.log(`   Glide Factor: ${(glideResult.glideFactor * 100).toFixed(1)}%`);
  console.log(`   Duration: ${glideResult.duration}ms`);
  console.log(`   Easing: ${glideResult.easing}`);
  console.log('');

  // 4. Demonstrate adaptive patterns
  console.log('🎭 Adaptive Pattern Demonstration:');
  console.log('-'.repeat(40));

  const adaptiveResult = await smoothPatternWeaver.createAdaptivePattern(
    'http-server-advanced',
    {
      loadLevel: 'high',
      memoryPressure: 'medium',
      networkLatency: 150
    }
  );

  console.log(`✅ Created adaptive pattern: ${adaptiveResult.name}`);
  console.log(`   Base Features: ${adaptiveResult.metadata.features?.join(', ')}`);
  console.log(`   Adaptations: ${Object.keys(adaptiveResult.metadata).filter(k => k.includes('Level') || k.includes('Enabled')).join(', ')}`);
  console.log('');

  // 5. Show utility functions
  console.log('🔧 Utility Functions Demonstration:');
  console.log('-'.repeat(40));

  const utilResult = await weavePatterns(['real-benchmarks-suite'], {
    smoothness: 1.0
  });

  console.log(`✅ Utility weave completed for ${utilResult.pattern.name}`);
  console.log(`   Pattern ID: ${utilResult.pattern.id}`);
  console.log(`   Compatibility: ${utilResult.pattern.compatibility.join(', ')}`);
  console.log('');

  // 6. Show comprehensive analytics
  console.log('📊 Comprehensive Analytics:');
  console.log('-'.repeat(40));

  const finalAnalytics = smoothPatternWeaver.getWeaveAnalytics();
  console.log(`Total Patterns: ${finalAnalytics.totalPatterns}`);
  console.log(`Active Weaves: ${finalAnalytics.activeWeaves}`);

  console.log('\nPattern Distribution:');
  Object.entries(finalAnalytics.patternTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('\nTop Compatibility Features:');
  const allCompatibilities = Object.values(finalAnalytics.compatibilityMatrix).flat();
  const compatibilityCount: Record<string, number> = {};
  allCompatibilities.forEach(feature => {
    compatibilityCount[feature] = (compatibilityCount[feature] || 0) + 1;
  });

  Object.entries(compatibilityCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([feature, count]) => {
      console.log(`   ${feature}: ${count} patterns`);
    });

  console.log('\n🎉 Smooth Pattern Weaver Demonstration Complete!');
  console.log('=' .repeat(60));
  console.log('\n💡 Key Capabilities Demonstrated:');
  console.log('   ✅ Pattern registration and management');
  console.log('   ✅ Smooth weaving with compatibility checking');
  console.log('   ✅ Glide transitions with easing functions');
  console.log('   ✅ Adaptive pattern generation');
  console.log('   ✅ Utility function integration');
  console.log('   ✅ Comprehensive analytics and reporting');
  console.log('   ✅ Enterprise-grade error handling');
  console.log('   ✅ Performance monitoring and metrics');
}

// Run the demonstration
demonstratePatternWeaving().catch(console.error);