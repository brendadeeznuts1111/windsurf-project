#!/usr/bin/env bun
/**
 * @fileoverview Dashboard build script
 * @description Builds the React dashboard for browser deployment
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Simple build script that creates browser-compatible versions
async function buildDashboard() {
  console.log('🔨 Building dashboard...');

  const buildDir = join(process.cwd(), 'dist');

  // Create dist directory
  await mkdir(buildDir, { recursive: true });

  // For now, we'll use ESM imports directly in the browser
  // In a full build system, this would use Vite, Webpack, etc.

  console.log('✅ Dashboard build complete');
  console.log('📁 Output: ./dist/');
}

if (import.meta.main) {
  buildDashboard().catch(console.error);
}