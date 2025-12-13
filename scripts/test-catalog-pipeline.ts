#!/usr/bin/env bun

/**
 * Test script for Catalog Registry Pipeline
 */

import { catalogPipeline } from '../src/catalog-registry-pipeline';

async function testPipeline() {
  console.log('🧪 Testing Catalog Registry Pipeline');

  try {
    // Get initial stats
    console.log('📊 Initial stats:', catalogPipeline.getPipelineStats());

    // Run the pipeline (this will take some time)
    console.log('🚀 Running pipeline...');
    await catalogPipeline.runPipeline();

    // Get final stats
    console.log('📊 Final stats:', catalogPipeline.getPipelineStats());

    console.log('✅ Pipeline test completed successfully');

  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
  } finally {
    catalogPipeline.close();
  }
}

// Run the test
testPipeline();