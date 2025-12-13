#!/usr/bin/env bun

/**
 * Enhanced MIME Type and Byte Metrics Demonstration
 * Shows comprehensive file operation tracking and MIME type analysis
 */

import { EnhancedMimeMetrics, analyzeMimeTypeUsage } from '../src/utils/enhanced-mime-metrics';

async function demonstrateEnhancedMetrics() {
  console.log('🔬 Enhanced MIME Type & Byte Metrics Demonstration');
  console.log('==================================================');

  const metrics = new EnhancedMimeMetrics();

  // Simulate various file operations
  console.log('\n📁 Simulating file operations...');

  const testFiles = [
    'script.js', 'styles.css', 'data.json', 'image.png', 'document.pdf',
    'video.mp4', 'music.mp3', 'archive.zip', 'config.yaml', 'readme.md',
    'component.tsx', 'library.py', 'binary.exe', 'spreadsheet.xlsx'
  ];

  // Track file operations
  for (const file of testFiles) {
    const fileSize = Math.floor(Math.random() * 1000000) + 1000; // 1KB to 1MB
    metrics.trackFileOperation(file, 'reads', fileSize);

    // Simulate some writes and streams
    if (Math.random() > 0.7) {
      metrics.trackFileOperation(file, 'writes', fileSize);
    }
    if (Math.random() > 0.8) {
      metrics.trackFileOperation(file, 'streams', fileSize);
    }
  }

  console.log(`✅ Tracked ${testFiles.length} file operations`);

  // Display byte metrics
  console.log('\n📊 Byte-Level Metrics:');
  const byteMetrics = metrics.getByteMetrics();
  console.log(`   Total Processed: ${byteMetrics.totalProcessed.toLocaleString()} bytes`);
  console.log(`   Per Second: ${byteMetrics.perSecond.toLocaleString()} bytes/sec`);
  console.log(`   Per Minute: ${byteMetrics.perMinute.toLocaleString()} bytes/min`);
  console.log(`   Peak Rate: ${byteMetrics.peakRate.toLocaleString()} bytes/sec`);

  // Display MIME type statistics
  console.log('\n🏷️  MIME Type Statistics:');
  const mimeStats = metrics.getMimeStats();
  mimeStats.slice(0, 10).forEach((stat, index) => {
    console.log(`   ${index + 1}. ${stat.type}: ${stat.count} files, ${stat.totalBytes.toLocaleString()} bytes avg`);
  });

  // Display top MIME types
  console.log('\n🥇 Top MIME Types by Usage:');
  const topTypes = metrics.getTopMimeTypes(8);
  topTypes.forEach((type, index) => {
    console.log(`   ${index + 1}. ${type.type} (${type.category}): ${type.count} files`);
  });

  // Display category distribution
  console.log('\n📂 MIME Type Category Distribution:');
  const categories = metrics.getMimeCategoryDistribution();
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} files`);
  });

  // Demonstrate MIME type analysis utility
  console.log('\n🔍 MIME Type Analysis Utility:');
  const analysis = analyzeMimeTypeUsage(testFiles);
  console.log('Top types with percentages:');
  analysis.topTypes.slice(0, 5).forEach((type, index) => {
    console.log(`   ${index + 1}. ${type.type}: ${type.percentage}% (${type.count} files)`);
  });

  console.log('\nCategory breakdown:');
  Object.entries(analysis.categories).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} files`);
  });

  // Display file operation metrics
  console.log('\n⚙️  File Operation Metrics:');
  const operations = metrics.getOperationMetrics();
  console.log(`   Reads: ${operations.reads}`);
  console.log(`   Writes: ${operations.writes}`);
  console.log(`   Streams: ${operations.streams}`);
  console.log(`   Total Operations: ${operations.reads + operations.writes + operations.streams}`);

  // Export/import demonstration
  console.log('\n💾 Export/Import Demonstration:');
  const exported = metrics.export();
  console.log(`   Exported ${Object.keys(exported.mimeStats).length} MIME types`);
  console.log(`   Exported ${exported.byteMetrics.totalProcessed} total bytes`);

  // Create new instance and import
  const newMetrics = new EnhancedMimeMetrics();
  newMetrics.import(exported);
  const importedByteMetrics = newMetrics.getByteMetrics();

  console.log(`   Imported ${importedByteMetrics.totalProcessed} bytes successfully`);
  console.log(`   Data integrity: ${importedByteMetrics.totalProcessed === byteMetrics.totalProcessed ? '✅' : '❌'}`);

  console.log('\n🎉 Enhanced MIME Type & Byte Metrics demonstration complete!');
  console.log('\n💡 Key Features Demonstrated:');
  console.log('   • Comprehensive MIME type detection and categorization');
  console.log('   • Real-time byte tracking with rate calculations');
  console.log('   • File operation monitoring (reads, writes, streams)');
  console.log('   • Statistical analysis and reporting');
  console.log('   • Data export/import for persistence');
  console.log('   • Category-based analysis and insights');
}

// Demonstrate MIME type detection
function demonstrateMimeDetection() {
  console.log('\n🔍 MIME Type Detection Examples:');

  const testFiles = [
    'script.js', 'styles.css', 'data.json', 'image.png', 'video.mp4',
    'document.pdf', 'archive.zip', 'config.toml', 'readme.md', 'unknown.xyz'
  ];

  testFiles.forEach(file => {
    const mimeType = EnhancedMimeMetrics.detectMimeType(file);
    const category = EnhancedMimeMetrics.getMimeCategory(mimeType);
    console.log(`   ${file.padEnd(12)} → ${mimeType.padEnd(20)} (${category})`);
  });
}

// Run demonstrations
demonstrateMimeDetection();
demonstrateEnhancedMetrics().catch(console.error);