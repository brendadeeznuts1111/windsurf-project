#!/usr/bin/env bun

/**
 * 🧪 Test Validation Functions
 */

// Simple URL validation function
function validateUrl(field: string, data: any): boolean {
    const url = data[field];
    if (typeof url !== "string") return false;
    try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
    } catch {
        return false;
    }
}

// Test data
const testData = {
    api: {
        url: "https://api.example.com",
        key: "secret_key_12345"
    }
};

console.log("🧪 Testing URL validation:");
console.log(`Data: ${JSON.stringify(testData, null, 2)}`);

console.log(`\nDirect URL validation:`);
console.log(`validateUrl("url", testData.api): ${validateUrl("url", testData.api)}`);

console.log(`\nNested URL validation:`);
console.log(`validateUrl("api.url", testData): ${validateUrl("api.url", testData)}`);

// Test nested field access
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

console.log(`\nNested field access:`);
const apiUrl = getNestedValue(testData, "api.url");
console.log(`getNestedValue(testData, "api.url"): ${apiUrl}`);
console.log(`validateUrl("url", { url: apiUrl }): ${validateUrl("url", { url: apiUrl })}`);
