import { describe, it, expect } from "bun:test";
import { SmoothPatternWeaver, weavePatterns, glideTransition, createAdaptivePattern } from "./smooth-pattern-weaver";

describe("Smooth Pattern Weaver", () => {
  it("should initialize with base patterns", () => {
    const weaver = new SmoothPatternWeaver();
    const analytics = weaver.getWeaveAnalytics();
    expect(analytics.totalPatterns).toBeGreaterThan(0);
    expect(analytics.patternTypes.api).toBeDefined();
    expect(analytics.patternTypes.config).toBeDefined();
    expect(analytics.patternTypes.performance).toBeDefined();
  });

  it("should weave patterns together", async () => {
    const weaver = new SmoothPatternWeaver();
    const result = await weaver.weavePatterns(['http-server-advanced', 'build-pipeline-advanced']);

    expect(result.pattern.id).toContain('composite-');
    expect(result.pattern.name).toContain('Composite');
    expect(result.transitions).toHaveLength(1);
    expect(result.smoothness).toBe(0.8);
    expect(result.performance.weaveTime).toBeGreaterThan(0);
    expect(result.performance.compatibilityScore).toBeGreaterThan(0);
  });

  it("should handle single pattern weave", async () => {
    const weaver = new SmoothPatternWeaver();
    const result = await weaver.weavePatterns(['http-server-advanced']);

    expect(result.pattern.id).toBe('http-server-advanced');
    expect(result.transitions).toHaveLength(0);
    expect(result.performance.compatibilityScore).toBe(1.0);
  });

  it("should execute glide transitions", async () => {
    const weaver = new SmoothPatternWeaver();
    const transition = await weaver.glideTransition(
      'http-server-advanced',
      'build-pipeline-advanced',
      { glideFactor: 0.9, duration: 100 }
    );

    expect(transition.from).toBe('http-server-advanced');
    expect(transition.to).toBe('build-pipeline-advanced');
    expect(transition.glideFactor).toBe(0.9);
    expect(transition.duration).toBe(100);
  });

  it("should create adaptive patterns", async () => {
    const weaver = new SmoothPatternWeaver();
    const adaptive = await weaver.createAdaptivePattern('http-server-advanced', {
      loadLevel: 'high',
      memoryPressure: 'medium'
    });

    expect(adaptive.id).toContain('adaptive-');
    expect(adaptive.name).toContain('Adaptive');
    expect(adaptive.metadata.optimizationLevel).toBe('maximum');
    expect(adaptive.metadata.cachingEnabled).toBe(true);
  });

  it("should provide weave analytics", () => {
    const weaver = new SmoothPatternWeaver();
    const analytics = weaver.getWeaveAnalytics();

    expect(analytics.totalPatterns).toBeGreaterThan(0);
    expect(analytics.activeWeaves).toBe(0);
    expect(analytics.patternTypes).toBeDefined();
    expect(analytics.compatibilityMatrix).toBeDefined();
  });

  it("should handle invalid pattern IDs", async () => {
    const weaver = new SmoothPatternWeaver();
    await expect(weaver.weavePatterns(['invalid-pattern'])).rejects.toThrow('Pattern not found');
  });

  it("should handle invalid glide transitions", async () => {
    const weaver = new SmoothPatternWeaver();
    await expect(weaver.glideTransition('invalid', 'also-invalid')).rejects.toThrow('Pattern not found');
  });

  it("should handle invalid adaptive pattern base", async () => {
    const weaver = new SmoothPatternWeaver();
    await expect(weaver.createAdaptivePattern('invalid-base')).rejects.toThrow('Base pattern not found');
  });

  it("should support utility functions", async () => {
    const result = await weavePatterns(['http-server-advanced']);
    expect(result.pattern.id).toBe('http-server-advanced');

    const transition = await glideTransition('http-server-advanced', 'build-pipeline-advanced');
    expect(transition.from).toBe('http-server-advanced');

    const adaptive = await createAdaptivePattern('http-server-advanced', {});
    expect(adaptive.name).toContain('Adaptive');
  });

  it("should calculate compatibility scores correctly", async () => {
    const weaver = new SmoothPatternWeaver();
    // Test with compatible patterns
    const result1 = await weaver.weavePatterns(['http-server-advanced', 'build-pipeline-advanced']);
    expect(result1.performance.compatibilityScore).toBeGreaterThan(0);

    // Test with single pattern (perfect compatibility)
    const result2 = await weaver.weavePatterns(['http-server-advanced']);
    expect(result2.performance.compatibilityScore).toBe(1.0);
  });
});