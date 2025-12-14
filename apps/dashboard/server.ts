#!/usr/bin/env bun
/**
 * @fileoverview Dashboard server entry point
 * @description Main entry point for the modular dashboard server
 */

import { DashboardServer } from './src/server/index';

// Start the server
async function main() {
  try {
    const server = new DashboardServer();
    const { port, url } = await server.start();

    console.log(`✅ Modular dashboard ready at ${url}`);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down dashboard server...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down dashboard server...');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start dashboard server:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}