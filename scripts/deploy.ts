#!/usr/bin/env bun

/**
 * 🚀 Windsurf Production Deployment Script
 *
 * Handles building, testing, and deploying the Windsurf platform
 */

import { $ } from 'bun';

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'build':
      await build();
      break;
    case 'test':
      await test();
      break;
    case 'deploy':
      await deploy();
      break;
    case 'docker':
      await docker();
      break;
    default:
      console.log('Usage: bun run deploy.ts [build|test|deploy|docker]');
      process.exit(1);
  }
}

async function build() {
  console.log('🔨 Building Windsurf for production...');

  // Type check
  await $`bun run typecheck`;

  // Run tests
  await $`bun test`;

  // Build
  await $`bun run build`;

  console.log('✅ Build completed successfully');
}

async function test() {
  console.log('🧪 Running production tests...');

  // Run all tests
  await $`bun test`;

  // Run integration tests
  await $`bun run integration`;

  // Run performance benchmarks
  await $`bun test benchmarks/`;

  console.log('✅ All tests passed');
}

async function deploy() {
  console.log('🚀 Deploying Windsurf...');

  // Build first
  await build();

  // Create deployment package
  await $`mkdir -p dist`;
  await $`cp -r src dist/`;
  await $`cp package.json dist/`;
  await $`cp bun.lock dist/`;
  await $`cp settings.local.json dist/`;

  console.log('✅ Deployment package created in dist/');
}

async function docker() {
  console.log('🐳 Building Docker image...');

  // Build the Docker image
  await $`docker build -t windsurf:latest .`;

  // Run basic health check
  console.log('🏥 Running Docker health check...');
  await $`docker run --rm windsurf:latest bun run examples/index.ts --status`;

  console.log('✅ Docker image built and tested');
}

main().catch(console.error);