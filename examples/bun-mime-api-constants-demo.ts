#!/usr/bin/env bun

/**
 * Bun MIME API Constants Demonstration
 * Shows comprehensive MIME type detection and utilities
 */

import {
  MIME_TYPES,
  MIME_CATEGORIES,
  MIME_CHARSETS,
  MIME_QUALITY,
  detectMimeType,
  getMimeCategory,
  getMimeCharset,
  getMimeQuality,
  isTextMimeType,
  isBinaryMimeType,
  getSupportedExtensions,
  getSupportedMimeTypes,
  getMimeTypesByCategory,
  formatMimeTypeWithCharset,
  BunMimeAPI
} from '../src/constants/bun-mime-api';

async function demonstrateBunMimeAPI() {
  console.log('🎯 Bun MIME API Constants & Utilities Demonstration');
  console.log('==================================================');

  // Test file samples
  const testFiles = [
    'script.js', 'styles.css', 'data.json', 'image.png', 'video.mp4',
    'document.pdf', 'archive.zip', 'config.yaml', 'readme.md', 'unknown.xyz'
  ];

  console.log('\n📁 MIME Type Detection:');
  console.log('File → MIME Type (Category)');
  console.log('-----------------------------');

  testFiles.forEach(file => {
    const mimeType = detectMimeType(file);
    const category = getMimeCategory(mimeType);
    console.log(`${file.padEnd(12)} → ${mimeType.padEnd(25)} (${category})`);
  });

  console.log('\n🏷️  MIME Type Categories:');
  const categories = ['text', 'code', 'image', 'video', 'audio', 'document', 'archive'];
  categories.forEach(category => {
    const types = getMimeTypesByCategory(category);
    console.log(`${category.padEnd(8)}: ${types.length} types`);
    if (types.length <= 3) {
      console.log(`         ${types.join(', ')}`);
    } else {
      console.log(`         ${types.slice(0, 3).join(', ')}...`);
    }
  });

  console.log('\n🔤 Text vs Binary Classification:');
  const sampleTypes = [
    'text/plain', 'application/json', 'image/png', 'video/mp4',
    'application/javascript', 'application/pdf', 'application/zip'
  ];

  sampleTypes.forEach(mimeType => {
    const isText = isTextMimeType(mimeType);
    const isBinary = isBinaryMimeType(mimeType);
    console.log(`${mimeType.padEnd(25)} → Text: ${isText}, Binary: ${isBinary}`);
  });

  console.log('\n🎨 MIME Type with Charset Formatting:');
  const textTypes = ['text/plain', 'text/html', 'application/json', 'application/javascript'];
  textTypes.forEach(mimeType => {
    const formatted = formatMimeTypeWithCharset(mimeType);
    console.log(`${mimeType.padEnd(25)} → ${formatted}`);
  });

  console.log('\n⭐ Quality Factors (Content Negotiation):');
  const qualityTypes = ['application/json', 'text/html', 'image/png', 'application/pdf'];
  qualityTypes.forEach(mimeType => {
    const quality = getMimeQuality(mimeType);
    console.log(`${mimeType.padEnd(25)} → Quality: ${quality}`);
  });

  console.log('\n📊 MIME API Statistics:');
  console.log(`Supported Extensions: ${getSupportedExtensions().length}`);
  console.log(`Supported MIME Types: ${getSupportedMimeTypes().length}`);
  console.log(`MIME Categories: ${Object.keys(MIME_CATEGORIES).length}`);

  console.log('\n🚀 BunMimeAPI Enhanced Detection:');
  testFiles.slice(0, 5).forEach(file => {
    const detection = BunMimeAPI.detectFileType(file);
    console.log(`${file.padEnd(12)} → ${detection.mimeType.padEnd(25)} (${detection.category})`);
    console.log(`             Quality: ${detection.quality}, Text: ${detection.isText}, Binary: ${detection.isBinary}`);
    if (detection.charset) {
      console.log(`             Charset: ${detection.charset}`);
    }
  });

  console.log('\n⚡ Performance Test (Cached Detection):');
  const performanceFiles = Array.from({ length: 100 }, (_, i) => `file${i}.js`);

  // First run (uncached)
  const start1 = performance.now();
  performanceFiles.forEach(file => BunMimeAPI.detect(file));
  const time1 = performance.now() - start1;

  // Second run (cached)
  const start2 = performance.now();
  performanceFiles.forEach(file => BunMimeAPI.detect(file));
  const time2 = performance.now() - start2;

  console.log(`First run (100 files):  ${time1.toFixed(2)}ms`);
  console.log(`Second run (cached):    ${time2.toFixed(2)}ms`);
  console.log(`Cache stats: ${JSON.stringify(BunMimeAPI.getCacheStats())}`);

  console.log('\n🎉 Bun MIME API Constants demonstration complete!');
  console.log('\n💡 Key Features Demonstrated:');
  console.log('   • Comprehensive MIME type database (50+ types)');
  console.log('   • Automatic file extension to MIME type mapping');
  console.log('   • Category-based classification system');
  console.log('   • Text vs binary type detection');
  console.log('   • Charset specifications for text types');
  console.log('   • Quality factors for content negotiation');
  console.log('   • Performance-optimized caching');
  console.log('   • Bun-native API integration');
}

// Demonstrate MIME constants directly
function demonstrateMimeConstants() {
  console.log('\n📋 MIME Type Constants Overview:');

  // Show some key MIME type mappings
  const keyMappings = {
    'JavaScript': 'js',
    'TypeScript': 'ts',
    'JSON': 'json',
    'HTML': 'html',
    'CSS': 'css',
    'PNG Image': 'png',
    'MP4 Video': 'mp4',
    'PDF Document': 'pdf',
    'ZIP Archive': 'zip'
  };

  console.log('Key File Extensions → MIME Types:');
  Object.entries(keyMappings).forEach(([desc, ext]) => {
    const mimeType = MIME_TYPES[ext];
    console.log(`   ${desc.padEnd(12)} (.${ext}) → ${mimeType}`);
  });

  // Show charset mappings
  console.log('\nText MIME Types with Charsets:');
  Object.entries(MIME_CHARSETS).forEach(([mimeType, charset]) => {
    console.log(`   ${mimeType.padEnd(25)} → ${charset}`);
  });

  // Show quality factors
  console.log('\nContent Negotiation Quality Factors:');
  Object.entries(MIME_QUALITY).forEach(([mimeType, quality]) => {
    console.log(`   ${mimeType.padEnd(25)} → ${quality}`);
  });
}

// Run demonstrations
demonstrateMimeConstants();
demonstrateBunMimeAPI().catch(console.error);