// examples/runtime/module-missing.ts - ModuleNotFoundError Example
// Demonstrates module resolution error with missing packages

// Try importing a non-installed package
import 'missing-package'; // Or: const mod = require('missing-package');
console.log('This will not print');

export {}; // Make this a module