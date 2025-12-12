import { describe, expect, test } from "bun:test";
import { ErrorTracker, ValidationError } from "./bun-error-tracker";

describe("Bun Error Tracker", () => {
  test("tracks validation errors correctly", () => {
    const tracker = new ErrorTracker();

    const error1: ValidationError = {
      code: "REQUIRED_FIELD",
      message: "Email field is required",
      field: "email"
    };

    const error2: ValidationError = {
      code: "INVALID_FORMAT",
      message: "Email format is invalid",
      field: "email",
      value: "invalid-email"
    };

    const error3: ValidationError = {
      code: "REQUIRED_FIELD",
      message: "Name field is required",
      field: "name"
    };

    // Track errors from different sources
    tracker.trackError(error1, "user-registration");
    tracker.trackError(error2, "user-registration");
    tracker.trackError(error3, "profile-update");

    const metrics = tracker.getMetrics();

    expect(metrics.totalErrors).toBe(3);
    expect(metrics.errorTypes["REQUIRED_FIELD"]).toBe(2);
    expect(metrics.errorTypes["INVALID_FORMAT"]).toBe(1);
    expect(metrics.sources["user-registration"]).toBe(2);
    expect(metrics.sources["profile-update"]).toBe(1);
  });

  test("tracks warnings correctly", () => {
    const tracker = new ErrorTracker();

    tracker.trackWarning("Deprecated API usage", "legacy-service", { api: "v1/users" });
    tracker.trackWarning("Rate limit approaching", "api-gateway", { limit: 1000, current: 950 });

    const metrics = tracker.getMetrics();
    expect(metrics.totalWarnings).toBe(2);
  });

  test("generates comprehensive reports", () => {
    const tracker = new ErrorTracker();

    // Add various errors
    tracker.trackError({
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      field: "username"
    }, "auth-service");

    tracker.trackError({
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      field: "password"
    }, "auth-service");

    tracker.trackError({
      code: "NETWORK_ERROR",
      message: "Connection timeout",
      details: { timeout: 5000 }
    }, "api-client");

    tracker.trackWarning("High memory usage", "system-monitor", { usage: "85%" });

    const report = tracker.generateReport();

    expect(report.summary.total_errors).toBe(3);
    expect(report.summary.total_warnings).toBe(1);
    expect(report.summary.unique_error_types).toBe(2);
    expect(report.summary.sources_affected).toBe(2);

    expect(report.breakdown.by_type["VALIDATION_ERROR"]).toBe(2);
    expect(report.breakdown.by_type["NETWORK_ERROR"]).toBe(1);
    expect(report.breakdown.by_source["auth-service"]).toBe(2);
    expect(report.breakdown.by_source["api-client"]).toBe(1);

    expect(report.performance.avg_duration).toBeGreaterThan(0);
    expect(report.performance.min_duration).toBeGreaterThan(0);
    expect(report.performance.max_duration).toBeGreaterThan(0);
  });

  test("handles performance tracking", () => {
    const tracker = new ErrorTracker();

    // Track multiple errors to build performance data
    for (let i = 0; i < 10; i++) {
      tracker.trackError({
        code: `ERROR_${i}`,
        message: `Test error ${i}`
      }, "performance-test");
    }

    const report = tracker.generateReport();

    expect(report.performance.avg_duration).toBeGreaterThan(0);
    expect(report.performance.min_duration).toBeLessThanOrEqual(report.performance.avg_duration);
    expect(report.performance.max_duration).toBeGreaterThanOrEqual(report.performance.avg_duration);
  });

  test("resets metrics correctly", () => {
    const tracker = new ErrorTracker();

    tracker.trackError({
      code: "TEST_ERROR",
      message: "Test error"
    }, "test-source");

    tracker.trackWarning("Test warning", "test-source");

    let metrics = tracker.getMetrics();
    expect(metrics.totalErrors).toBe(1);
    expect(metrics.totalWarnings).toBe(1);

    tracker.reset();

    metrics = tracker.getMetrics();
    expect(metrics.totalErrors).toBe(0);
    expect(metrics.totalWarnings).toBe(0);
    expect(Object.keys(metrics.errorTypes).length).toBe(0);
    expect(Object.keys(metrics.sources).length).toBe(0);
    expect(metrics.performance.length).toBe(0);
  });

  test("handles complex error details", () => {
    const tracker = new ErrorTracker();

    const complexError: ValidationError = {
      code: "COMPLEX_VALIDATION",
      message: "Multiple validation failures",
      field: "user",
      value: { name: "", email: "invalid", age: -5 },
      details: {
        name: { required: true, minLength: 2 },
        email: { format: "email", required: true },
        age: { min: 0, max: 150 }
      }
    };

    tracker.trackError(complexError, "complex-validation");

    const metrics = tracker.getMetrics();
    expect(metrics.totalErrors).toBe(1);
    expect(metrics.errorTypes["COMPLEX_VALIDATION"]).toBe(1);
    expect(metrics.sources["complex-validation"]).toBe(1);
  });

  test("handles empty error tracking gracefully", () => {
    const tracker = new ErrorTracker();

    const report = tracker.generateReport();

    expect(report.summary.total_errors).toBe(0);
    expect(report.summary.total_warnings).toBe(0);
    expect(report.summary.unique_error_types).toBe(0);
    expect(report.summary.sources_affected).toBe(0);

    expect(report.performance.avg_duration).toBe(0);
    expect(report.performance.min_duration).toBe(0);
    expect(report.performance.max_duration).toBe(0);
  });

  test("performance benchmark - error tracking", () => {
    const tracker = new ErrorTracker();
    const ITERATIONS = 1000;

    const startTime = performance.now();

    for (let i = 0; i < ITERATIONS; i++) {
      tracker.trackError({
        code: `BENCH_ERROR_${i % 10}`,
        message: `Benchmark error ${i}`,
        field: `field_${i % 5}`
      }, `source_${i % 3}`);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / ITERATIONS;

    console.log(`📊 Error Tracking Performance (${ITERATIONS} errors):`);
    console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per error: ${(avgTime * 1000).toFixed(3)}μs`);

    expect(avgTime).toBeLessThan(1); // Should be sub-millisecond

    const report = tracker.generateReport();
    expect(report.summary.total_errors).toBe(ITERATIONS);
    expect(report.summary.unique_error_types).toBe(10);
    expect(report.summary.sources_affected).toBe(3);
  });
});