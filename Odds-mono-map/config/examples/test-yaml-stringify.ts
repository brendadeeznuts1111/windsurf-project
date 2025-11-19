#!/usr/bin/env bun

/**
 * 🧪 Test Bun YAML.stringify syntax
 */

import { YAML } from "bun";

const obj = {
    name: "Test",
    items: [1, 2, 3],
    nested: {
        key: "value"
    }
};

console.log("Testing YAML.stringify syntax:");

// Test different syntax variations
try {
    console.log("\n1. YAML.stringify(obj):");
    console.log(YAML.stringify(obj));
} catch (error) {
    console.log("❌ Error:", (error as Error).message);
}

try {
    console.log("\n2. YAML.stringify(obj) - only object parameter:");
    console.log(YAML.stringify(obj));
} catch (error) {
    console.log("❌ Error:", (error as Error).message);
}
