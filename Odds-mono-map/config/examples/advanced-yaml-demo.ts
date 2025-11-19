#!/usr/bin/env bun

/**
 * 🎯 Advanced YAML Features Demo
 * 
 * Comprehensive demonstration of Bun's full YAML 1.2 specification support
 * including anchors, aliases, tags, multi-line strings, and error handling
 */

export { }; // Make this file a module for top-level await

console.log("🎯 Advanced YAML Features Demo");
console.log("===============================");

// Example 1: Basic YAML with anchors and aliases
console.log("\n🔗 Example 1: Anchors and Aliases");
console.log("------------------------------------");

const yamlWithAnchors = `
# Employee record
employee: &emp
  name: Jane Smith
  department: Engineering
  skills:
    - JavaScript
    - TypeScript
    - React

manager: *emp  # Reference to employee

config: !!str 123  # Explicit string type

description: |
  This is a multi-line
  literal string that preserves
  line breaks and spacing.

summary: >
  This is a folded string
  that joins lines with spaces
  unless there are blank lines.
`;

const data = Bun.YAML.parse(yamlWithAnchors) as {
    employee: { name: string; department: string; skills: string[] };
    manager: { name: string; department: string; skills: string[] };
    config: string;
    description: string;
    summary: string;
};

console.log("✅ Parsed YAML with anchors and aliases:");
console.log("   Employee:", data.employee.name);
console.log("   Manager:", data.manager.name); // Same reference
console.log("   Config (string):", data.config, typeof data.config);
console.log("   Description (literal):");
console.log(data.description);
console.log("   Summary (folded):", data.summary);

// Example 2: Advanced features from file
console.log("\n📁 Example 2: Advanced Features from File");
console.log("-----------------------------------------");

const advancedContent = await Bun.file("./yaml-features.yaml").text();
const advancedData = Bun.YAML.parse(advancedContent) as {
    employee: { name: string; department: string; skills: string[]; active: boolean; salary: number; join_date: string };
    manager: { name: string; department: string; skills: string[]; active: boolean; salary: number; join_date: string };
    config: { port: number; debug: boolean; timeout: string; version: string };
    description: string;
    summary: string;
    company: {
        name: string;
        founded: number;
        employees: Array<{ name: string; role: string; skills: string[] }>;
        teams: {
            frontend: Array<{ name: string; role: string; skills: string[] }>;
            backend: Array<{ name: string; role: string; skills: string[] }>;
            fullstack: Array<{ name: string; role: string; skills: string[] }>;
        };
    };
    mixed_data: {
        string_value: string;
        number_value: number;
        float_value: number;
        boolean_value: boolean;
        null_value: null;
        array_value: any[];
        object_value: Record<string, any>;
    };
    flow_arrays: {
        compact: string[];
        nested: any[][];
    };
    flow_objects: {
        compact: Record<string, string>;
        nested: Record<string, any>;
    };
    merge_keys: {
        base: { timeout: number; retries: number; logging: boolean };
        development: { timeout: number; retries: number; logging: boolean; debug: boolean; hot_reload: boolean };
        production: { timeout: number; retries: number; logging: boolean; debug: boolean; monitoring: boolean };
    };
};

console.log("✅ Advanced YAML features loaded:");
console.log("   Employee anchor:", advancedData.employee.name);
console.log("   Manager alias:", advancedData.manager.name);
console.log("   Config types:");
console.log(`     - port: ${advancedData.config.port} (${typeof advancedData.config.port})`);
console.log(`     - debug: ${advancedData.config.debug} (${typeof advancedData.config.debug})`);
console.log(`     - timeout: ${advancedData.config.timeout} (${typeof advancedData.config.timeout})`);

// Example 3: Multi-line string handling
console.log("\n📝 Example 3: Multi-line String Handling");
console.log("----------------------------------------");

console.log("📄 Literal block (|):");
console.log(advancedData.description);

console.log("\n📄 Folded block (>):");
console.log(advancedData.summary);

// Example 4: Complex nested structures
console.log("\n🏗️ Example 4: Complex Nested Structures");
console.log("---------------------------------------");

console.log("🏢 Company data:");
console.log(`   Name: ${advancedData.company.name}`);
console.log(`   Founded: ${advancedData.company.founded}`);
console.log(`   Employees: ${advancedData.company.employees.length}`);

console.log("👥 Employee skills:");
advancedData.company.employees.forEach((emp: any, index: number) => {
    console.log(`   ${index + 1}. ${emp.name}: ${emp.skills.join(", ")}`);
});

console.log("🔧 Team assignments:");
Object.entries(advancedData.company.teams).forEach(([team, members]: [string, any]) => {
    const memberNames = members.map((m: any) => m.name);
    console.log(`   ${team}: ${memberNames.join(", ")}`);
});

// Example 5: Type tags and explicit typing
console.log("\n🏷️ Example 5: Type Tags and Explicit Typing");
console.log("-------------------------------------------");

console.log("🔧 Configuration with explicit types:");
Object.entries(advancedData.config).forEach(([key, value]: [string, any]) => {
    console.log(`   ${key}: ${value} (${typeof value})`);
});

console.log("🎯 Mixed data types:");
Object.entries(advancedData.mixed_data).forEach(([key, value]: [string, any]) => {
    console.log(`   ${key}: ${value} (${typeof value})`);
});

// Example 6: Flow style collections
console.log("\n🌊 Example 6: Flow Style Collections");
console.log("--------------------------------------");

console.log("📊 Flow arrays:");
console.log(`   Compact: ${advancedData.flow_arrays.compact.join(", ")}`);
console.log(`   Nested: ${JSON.stringify(advancedData.flow_arrays.nested)}`);

console.log("📦 Flow objects:");
console.log(`   Compact: ${JSON.stringify(advancedData.flow_objects.compact)}`);
console.log(`   Nested: ${JSON.stringify(advancedData.flow_objects.nested)}`);

// Example 7: YAML 1.2 specific features
console.log("\n🆕 Example 7: YAML 1.2 Specific Features");
console.log("----------------------------------------");

console.log("🔧 Flow style collections working perfectly:");
console.log(`   Arrays: ${advancedData.flow_arrays.compact.join(", ")}`);
console.log(`   Objects: ${JSON.stringify(advancedData.flow_objects.compact)}`);

// Example 8: Merge keys (YAML 1.1 compatibility)
console.log("\n🔀 Example 8: Merge Keys");
console.log("-------------------------");

console.log("⚙️ Configuration with merge keys:");
Object.entries(advancedData.merge_keys).forEach(([env, config]: [string, any]) => {
    console.log(`   ${env}:`);
    Object.entries(config).forEach(([key, value]: [string, any]) => {
        if (key !== "<<") { // Skip merge directive
            console.log(`     ${key}: ${value}`);
        }
    });
});

// Example 9: Error handling
console.log("\n❌ Example 9: Error Handling");
console.log("----------------------------");

const invalidYamlExamples = [
    "invalid: yaml: content:",
    "unbalanced: [1, 2, 3",
    "bad: {key: value",
    "missing: \"quote"
];

invalidYamlExamples.forEach((invalid, index) => {
    try {
        Bun.YAML.parse(invalid);
        console.log(`   ${index + 1}. Unexpected success`);
    } catch (error) {
        console.log(`   ${index + 1}. ✅ Caught error: ${error instanceof Error ? error.message : String(error)}`);
    }
});

// Example 10: Performance with complex YAML
console.log("\n🏎️ Example 10: Performance with Complex YAML");
console.log("--------------------------------------------");

const iterations = 1000;
const startTime = performance.now();

for (let i = 0; i < iterations; i++) {
    Bun.YAML.parse(advancedContent);
}

const endTime = performance.now();
const avgTime = (endTime - startTime) / iterations;

console.log(`📊 Performance test (${iterations} iterations):`);
console.log(`   Total time: ${(endTime - startTime).toFixed(2)}ms`);
console.log(`   Average per parse: ${avgTime.toFixed(3)}ms`);
console.log(`   Parses per second: Math.round(1000 / avgTime)}`);

// Example 11: Practical application
console.log("\n💼 Example 11: Practical Application");
console.log("------------------------------------");

function createApplicationConfig(yamlString: string) {
    try {
        const config = Bun.YAML.parse(yamlString) as {
            server: { port: number; host: string };
            database: { url: string; pool: number };
            features: { auth: boolean; logging: boolean };
            deployment: { environment: string; replicas: number };
        };

        return {
            success: true,
            config,
            connectionString: `postgresql://${config.database.url}?pool_size=${config.database.pool}`,
            serverUrl: `http://${config.server.host}:${config.server.port}`,
            isProduction: config.deployment.environment === "production"
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

const appConfigYaml = `
server:
  port: !!int 3000
  host: localhost

database:
  url: localhost:5432/myapp
  pool: !!int 10

features:
  auth: !!bool true
  logging: !!bool true

deployment:
  environment: !!str development
  replicas: !!int 1
`;

const appResult = createApplicationConfig(appConfigYaml);
console.log("🚀 Application configuration:");
if (appResult.success) {
    console.log(`   ✅ Server: ${appResult.serverUrl}`);
    console.log(`   ✅ Database: ${appResult.connectionString}`);
    console.log(`   ✅ Production: ${appResult.isProduction}`);
} else {
    console.log(`   ❌ Error: ${appResult.error}`);
}

console.log("\n✅ Advanced YAML features demonstration complete!");
console.log("💡 Bun supports the full YAML 1.2 specification with excellent performance!");
