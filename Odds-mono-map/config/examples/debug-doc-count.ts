#!/usr/bin/env bun

/**
 * 🔍 Debug Document Counting
 */

const yaml1 = "name: John";
const yaml2 = "---\nname: Doc1\n---\nname: Doc2";

console.log("Debugging document counting:");

console.log("\nYAML 1:");
console.log(JSON.stringify(yaml1));
console.log("Match 1:", yaml1.match(/^---$/gm));
console.log("Count 1:", (yaml1.match(/^---$/gm) || []).length);

console.log("\nYAML 2:");
console.log(JSON.stringify(yaml2));
console.log("Match 2:", yaml2.match(/^---$/gm));
console.log("Count 2:", (yaml2.match(/^---$/gm) || []).length);

// Test the actual parsing
console.log("\nActual parsing results:");
console.log("YAML 1 parsed:", Bun.YAML.parse(yaml1));
console.log("YAML 2 parsed:", Bun.YAML.parse(yaml2));
