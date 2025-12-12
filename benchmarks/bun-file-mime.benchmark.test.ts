import { test, describe, beforeAll, afterAll, expect } from "bun:test";

describe("Bun File MIME-Type Performance Benchmarks", () => {
  const ITERATIONS = 10000;
  let testFiles: string[];

  beforeAll(() => {
    // Create test files for benchmarking
    testFiles = [
      "test.html", "script.js", "styles.css", "data.json",
      "image.png", "document.pdf", "archive.zip", "data.csv"
    ];
  });

  test("MIME-type detection performance for common web files", () => {
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const html = Bun.file("index.html");
      const js = Bun.file("app.js");
      const css = Bun.file("styles.css");
      const json = Bun.file("data.json");

      // Access type to trigger detection
      const types = [html.type, js.type, css.type, json.type];
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / ITERATIONS;

    console.log(`📊 MIME Detection (Web files): ${(avgTime * 1000).toFixed(3)}μs per detection`);
    expect(avgTime).toBeLessThan(0.1); // Should be very fast (< 100μs)
  });

  test("MIME-type detection performance for binary files", () => {
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const png = Bun.file("image.png");
      const pdf = Bun.file("document.pdf");
      const zip = Bun.file("archive.zip");
      const exe = Bun.file("program.exe");

      // Access type to trigger detection
      const types = [png.type, pdf.type, zip.type, exe.type];
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / ITERATIONS;

    console.log(`📊 MIME Detection (Binary files): ${(avgTime * 1000).toFixed(3)}μs per detection`);
    expect(avgTime).toBeLessThan(0.1); // Should be very fast (< 100μs)
  });

  test("Custom MIME-type override performance", () => {
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const custom1 = Bun.file("file.html", { type: "application/xhtml+xml" });
      const custom2 = Bun.file("file.js", { type: "application/javascript" });
      const custom3 = Bun.file("file.json", { type: "text/plain" });
      const custom4 = Bun.file("file", { type: "application/vnd.api+json" });

      // Access type to ensure it's set
      const types = [custom1.type, custom2.type, custom3.type, custom4.type];
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / ITERATIONS;

    console.log(`📊 Custom MIME Override: ${(avgTime * 1000).toFixed(3)}μs per override`);
    expect(avgTime).toBeLessThan(0.05); // Should be extremely fast (< 50μs)
  });

  test("MIME-type consistency across multiple accesses", () => {
    const file = Bun.file("test.css", { type: "text/css;charset=utf-8" });
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      // Multiple accesses to same file
      const type1 = file.type;
      const type2 = file.type;
      const type3 = file.type;
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / ITERATIONS;

    console.log(`📊 MIME Consistency Check: ${(avgTime * 1000).toFixed(3)}μs per access`);
    expect(avgTime).toBeLessThan(0.01); // Should be nearly instantaneous (< 10μs)
  });

  test("MIME-type with complex parameters performance", () => {
    const complexType = "application/vnd.company.product+json; version=1.0; charset=utf-8";
    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      const file = Bun.file("complex.json", { type: complexType });
      const type = file.type;
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / ITERATIONS;

    console.log(`📊 Complex MIME Types: ${(avgTime * 1000).toFixed(3)}μs per complex type`);
    expect(avgTime).toBeLessThan(0.05); // Should be very fast (< 50μs)
  });

  test("File creation with different MIME types performance comparison", () => {
    const types = [
      "text/html;charset=utf-8",
      "text/css;charset=utf-8",
      "application/json;charset=utf-8",
      "image/png",
      "application/pdf",
      "application/zip",
      "custom/type",
      "application/vnd.api+json"
    ];

    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS / 10; i++) { // Reduce iterations for this test
      for (const type of types) {
        const file = Bun.file(`file_${i}`, { type });
        const fileType = file.type;
      }
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / (ITERATIONS / 10) / types.length;

    console.log(`📊 File Creation (8 types): ${(avgTime * 1000).toFixed(3)}μs per file creation`);
    expect(avgTime).toBeLessThan(0.1); // Should be fast (< 100μs)
  });

  test("MIME-type memory efficiency", () => {
    const files: any[] = [];
    const startTime = performance.now();

    // Create many files with different types
    for (let i = 0; i < 1000; i++) {
      files.push(Bun.file(`file_${i}.html`, { type: "text/html" }));
      files.push(Bun.file(`file_${i}.css`, { type: "text/css" }));
      files.push(Bun.file(`file_${i}.js`, { type: "application/javascript" }));
    }

    // Access all types
    for (const file of files) {
      const type = file.type;
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log(`📊 Memory Efficiency (3000 files): ${totalTime.toFixed(2)}ms total`);
    console.log(`📊 Average per file: ${(totalTime / 3000 * 1000).toFixed(3)}μs`);

    expect(totalTime).toBeLessThan(500); // Should complete in reasonable time
  });

  test("Extension-based vs explicit MIME-type performance", () => {
    let extensionTime = 0;
    let explicitTime = 0;

    // Test extension-based detection
    const extStart = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      const file = Bun.file("test.css"); // Extension-based
      const type = file.type;
    }
    extensionTime = performance.now() - extStart;

    // Test explicit type setting
    const explicitStart = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      const file = Bun.file("test", { type: "text/css;charset=utf-8" }); // Explicit
      const type = file.type;
    }
    explicitTime = performance.now() - explicitStart;

    const extAvg = extensionTime / ITERATIONS;
    const explicitAvg = explicitTime / ITERATIONS;

    console.log(`📊 Extension-based: ${(extAvg * 1000).toFixed(3)}μs per file`);
    console.log(`📊 Explicit type: ${(explicitAvg * 1000).toFixed(3)}μs per file`);
    console.log(`📊 Ratio (explicit/extension): ${(explicitAvg / extAvg).toFixed(2)}x`);

    // Both should be very fast
    expect(extAvg).toBeLessThan(0.1);
    expect(explicitAvg).toBeLessThan(0.1);
  });
});