#!/usr/bin/env bun

/**
 * 🔍 Debug Special Characters
 */

import { YAML } from "bun";

const yaml = `
unicode: "Hello 世界"
special: 'Special chars: !@#$%^&*()'
quotes: 'Single '' and double "" quotes'
`;

console.log("Debugging special characters:");
console.log("Original YAML:");
console.log(yaml);

const result = YAML.parse(yaml);
console.log("\nParsed result:");
console.log(JSON.stringify(result as any, null, 2));

console.log("\nIndividual values:");
console.log(`unicode: "${(result as any).unicode}"`);
console.log(`special: "${(result as any).special}"`);
console.log(`quotes: "${(result as any).quotes}"`);
