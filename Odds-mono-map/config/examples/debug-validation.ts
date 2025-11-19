#!/usr/bin/env bun

/**
 * 🔍 Debug Validation Issues
 */

const configYaml = `
timeout: 5000
retries: 3
api:
  url: https://api.example.com
  key: secret_key_12345
logging:
  level: info
  pretty: false
`;

console.log("🔍 Debugging YAML parsing and validation:");
console.log("Original YAML:");
console.log(configYaml);

const data = Bun.YAML.parse(configYaml);
console.log("\nParsed data:");
console.log(JSON.stringify(data, null, 2));

console.log("\nAPI URL value:");
console.log(`Type: ${typeof (data as any).api.url}`);
console.log(`Value: "${(data as any).api.url}"`);

// Test URL validation
try {
    const url = new URL((data as any).api.url);
    console.log(`\nURL parsing successful:`);
    console.log(`Protocol: ${url.protocol}`);
    console.log(`Valid HTTP/HTTPS: ${["http:", "https:"].includes(url.protocol)}`);
} catch (error) {
    console.log(`\nURL parsing failed: ${(error as Error).message}`);
}
