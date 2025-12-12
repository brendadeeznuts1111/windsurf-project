// examples/runtime/file-not-found.ts - BunFileError: ENOENT Example
// Demonstrates file not found error with Bun.file()

// Minimal repro: Attempt to read a non-existent file
const content = await Bun.file('/nonexistent-file.txt').text();
console.log(content);  // This line never runs

export {}; // Make this a module