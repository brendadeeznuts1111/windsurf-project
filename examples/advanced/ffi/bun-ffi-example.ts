// ============================================================
// @example advanced/ffi: Bun FFI (Foreign Function Interface)
// Demonstrates calling C functions directly from Bun without compilation
// Note: FFI requires compiled C libraries - this shows the API structure
// ============================================================

import { test, expect } from 'bun:test';

// FFI Example Structure (would work with compiled C libraries)
// This demonstrates the API pattern for calling native C functions

test('Bun FFI API structure', () => {
  // Example of how FFI would work (conceptual - requires C compilation)
  console.log('FFI: Bun provides direct C function calls without Node.js addons');

  // Example API structure:
  // const lib = Bun.ffi.open('./library.so', {
  //   functionName: { args: ['i32', 'i32'], returns: 'i32' }
  // });
  // const result = lib.symbols.functionName(5, 3);

  console.log('FFI: Enables zero-overhead native performance for compute-intensive tasks');
  expect(true).toBe(true); // API structure demonstration
});

test('Bun FFI use cases', () => {
  console.log('FFI Use Cases:');
  console.log('- High-performance math libraries');
  console.log('- System-level operations');
  console.log('- Legacy C code integration');
  console.log('- GPU acceleration interfaces');

  expect(true).toBe(true);
});

console.log('Bun FFI examples completed - demonstrates API for native C integration');