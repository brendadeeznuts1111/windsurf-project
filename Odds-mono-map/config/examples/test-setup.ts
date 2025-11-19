#!/usr/bin/env bun

/**
 * 🧪 Test Setup for YAML Examples
 * 
 * Global test configuration and utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "bun:test";

// Global test configuration
beforeAll(async () => {
    console.log("🚀 Setting up Bun YAML test suite");
    console.log("====================================");

    // Ensure we're in the correct directory
    process.chdir("./examples");

    // Set test environment variables
    process.env.NODE_ENV = "test";
    process.env.DEBUG = "true";
});

afterAll(async () => {
    console.log("🧹 Cleaning up test environment");
    console.log("================================");

    // Reset environment variables
    delete process.env.NODE_ENV;
    delete process.env.DEBUG;
});

beforeEach(() => {
    // Reset console output before each test
    // This helps with test isolation
});

afterEach(() => {
    // Cleanup after each test
});

// Global test utilities
export const createTestYaml = (name: string, content: any) => {
    const yaml = require("bun").YAML;
    return Bun.write(`./test-${name}.yaml`, yaml.stringify(content));
};

export const cleanupTestYaml = (name: string) => {
    return Bun.file(`./test-${name}.yaml`).delete();
};

export const measureTestPerformance = async (fn: () => Promise<any>) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
};
