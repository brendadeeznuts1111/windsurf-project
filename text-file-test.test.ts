#!/usr/bin/env bun

/**
 * 📄 Text File Loading Tests - Following Bun Testing Guidelines
 *
 * Tests for text file loading functionality using proper Bun testing patterns.
 * No timeouts, random ports, proper resource cleanup.
 */

import { test, describe, beforeAll, afterAll } from 'bun:test';
import { expect } from 'bun:test';
import { tempDir, waitFor, createMockServer, bunExe, bunEnv } from './harness';

describe('Text File Loading', () => {
  let testDir: any;
  let testFile: string;

  beforeAll(() => {
    // Create temporary directory with test file (Bun guideline)
    testDir = tempDir('text-file-test', {
      'test.txt': 'Hello World! This is a test file for Bun.',
      'config.json': '{"app": "test", "version": "1.0.0"}',
      'empty.txt': '',
    });
    testFile = `${testDir}/test.txt`;
  });

  afterAll(async () => {
    // Automatic cleanup via disposable
    // testDir will be cleaned up automatically
  });

  test('Bun.file().text() loads content correctly', async () => {
    const content = await Bun.file(testFile).text();
    expect(content).toBe('Hello World! This is a test file for Bun.');
  });

  test('Bun.file().text() handles empty files', async () => {
    const emptyFile = `${testDir}/empty.txt`;
    const content = await Bun.file(emptyFile).text();
    expect(content).toBe('');
  });

  test('Bun.file() arrayBuffer works for binary-like text', async () => {
    const buffer = await Bun.file(testFile).arrayBuffer();
    const content = new TextDecoder().decode(buffer);
    expect(content).toBe('Hello World! This is a test file for Bun.');
  });

  test('handles JSON files', async () => {
    const jsonFile = `${testDir}/config.json`;
    const content = await Bun.file(jsonFile).text();
    const parsed = JSON.parse(content);
    expect(parsed.app).toBe('test');
    expect(parsed.version).toBe('1.0.0');
  });

  test('throws on non-existent files', async () => {
    const nonexistent = `${testDir}/nonexistent.txt`;

    await expect(Bun.file(nonexistent).text()).rejects.toThrow();
  });

  test('spawns Bun process correctly', async () => {
    // Create a test fixture (Bun guideline: *-fixture.ts)
    const fixtureContent = `
      console.log("Hello from spawned process!");
      console.log("Args:", process.argv.slice(2));
    `;

    const fixturePath = `${testDir}/spawn-fixture.ts`;
    await Bun.write(fixturePath, fixtureContent);

    // Spawn Bun process (Bun guideline: use bunExe and bunEnv)
    const proc = Bun.spawn({
      cmd: [bunExe(), 'run', fixturePath, 'arg1', 'arg2'],
      env: bunEnv(),
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    expect(exitCode).toBe(0);
    expect(stdout.trim()).toContain('Hello from spawned process!');
    expect(stdout.trim()).toContain('Args: [ "arg1", "arg2" ]');
    expect(stderr).toBe('');
  });

  test('waits for condition instead of timeout', async () => {
    let counter = 0;

    // Start an async operation
    const promise = (async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      counter = 42;
      return counter;
    })();

    // Wait for condition instead of arbitrary timeout (Bun guideline)
    await waitFor(() => counter === 42, {
      timeout: 1000,
      message: 'Counter should become 42'
    });

    expect(counter).toBe(42);
  });

  test('creates and uses mock server', async () => {
    const mockServer = createMockServer((req) => {
      if (req.url.endsWith('/test')) {
        return new Response('mock response', { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });

    // Test the mock server
    const response = await fetch(`${mockServer.url}/test`);
    const text = await response.text();

    expect(response.ok).toBe(true);
    expect(text).toBe('mock response');

    // Cleanup happens automatically via disposable
    mockServer.close();
  });

  test('handles large files efficiently', async () => {
    // Create a larger test file
    const largeContent = 'x'.repeat(10000); // 10KB
    const largeFile = `${testDir}/large.txt`;
    await Bun.write(largeFile, largeContent);

    const start = performance.now();
    const content = await Bun.file(largeFile).text();
    const duration = performance.now() - start;

    expect(content.length).toBe(10000);
    expect(duration).toBeLessThan(100); // Should be fast
  });
});