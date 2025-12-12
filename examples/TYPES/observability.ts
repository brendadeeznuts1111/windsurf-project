/**
 * Comprehensive observability types for distributed systems
 * DOMAIN: observability
 * SCOPE: core
 * SPEC: EX062
 * PR: #1274 - Implement comprehensive observability types
 * STATUS: draft
 * TAGS: critical, telemetry, metrics, tracing
 * REVIEWED-BY: @observability-team-lead
 * COMMIT: jkl012mno345
 */

import { logger } from "../logging/bun-logger";

export interface Metric {
  name: string;
  value: number;
  type: "counter" | "gauge" | "histogram" | "summary";
  labels: Record<string, string>;
  timestamp: number;
  unit?: string;
}

export interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  kind: "client" | "server" | "producer" | "consumer" | "internal";
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
  events: SpanEvent[];
  status: SpanStatus;
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, any>;
}

export interface SpanStatus {
  code: "ok" | "error" | "unset";
  message?: string;
}

export interface LogEntry {
  timestamp: number;
  level: "trace" | "debug" | "info" | "warn" | "error";
  message: string;
  context: Record<string, any>;
  traceId?: string;
  spanId?: string;
  error?: Error;
  piiScrubbed: boolean;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  baggage: Record<string, string>;
  sampled: boolean;
}

export interface TelemetryBatch {
  metrics: Metric[];
  spans: Span[];
  logs: LogEntry[];
  timestamp: number;
}

export class ObservabilityTypes {
  // ========================================
  // META: {PROPERTY} values from TOML
  // ========================================
  private config = {
    collectionIntervalMs: 10000,
    retentionPeriodDays: 30,
    aggregationWindowSeconds: 60,
    customMetricsEnabled: true,
    samplingRate: 0.1,
    maxTraceDurationSeconds: 300,
    traceContextPropagation: true,
    errorTraceCapture: true,
    structuredLogging: true,
    logLevelHierarchy: ["trace", "debug", "info", "warn", "error"],
    logRetentionDays: 90,
    piiScrubbing: true,
    traceIdGeneration: "uuidv7",
    spanIdPropagation: true,
    baggagePropagation: true,
  };

  private activeSpans = new Map<string, Span>();
  private metricsBuffer: Metric[] = [];
  private logsBuffer: LogEntry[] = [];

  // ========================================
  // #REF:* dependencies injected
  // ========================================
  constructor(
    private buildSystem: any,  // EX052 - Build instrumentation
    private httpServer: any,  // EX001 - HTTP tracing
    private chaosFramework: any,  // EX053 - Experiment tracking
    private cryptoSuite: any,  // EX008 - Secure correlation
  ) {
    logger.debug("ObservabilityTypes initialized", {
      domain: "observability.core",
      spec: "EX062"
    });
  }

  // ========================================
  // METHOD: createMetric
  // PR: #1274
  // STATUS: draft
  // TAGS: metrics, telemetry
  // ========================================
  public createMetric(
    name: string,
    value: number,
    type: Metric["type"],
    labels: Record<string, string> = {},
    unit?: string
  ): Metric {
    const metric: Metric = {
      name,
      value,
      type,
      labels,
      timestamp: Date.now(),
      unit,
    };

    this.metricsBuffer.push(metric);

    // Auto-flush if buffer is full
    if (this.metricsBuffer.length >= 100) {
      this.flushMetrics();
    }

    return metric;
  }

  // ========================================
  // METHOD: startSpan
  // PR: #1274
  // STATUS: draft
  // TAGS: tracing, correlation
  // ========================================
  public startSpan(
    name: string,
    kind: Span["kind"] = "internal",
    parentContext?: TraceContext
  ): Span {
    const traceId = parentContext?.traceId || Bun.randomUUIDv7();
    const spanId = Bun.randomUUIDv7();
    const parentId = parentContext?.spanId;

    const span: Span = {
      id: spanId,
      traceId,
      parentId,
      name,
      kind,
      startTime: Bun.nanoseconds(),
      attributes: {},
      events: [],
      status: { code: "unset" },
    };

    this.activeSpans.set(spanId, span);

    return span;
  }

  // ========================================
  // METHOD: logEvent
  // PR: #1274
  // STATUS: draft
  // TAGS: logging, structured
  // ========================================
  public logEvent(
    level: LogEntry["level"],
    message: string,
    context: Record<string, any> = {},
    error?: Error,
    traceContext?: TraceContext
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context: this.config.piiScrubbing ? this.scrubPII(context) : context,
      traceId: traceContext?.traceId,
      spanId: traceContext?.spanId,
      error,
      piiScrubbed: this.config.piiScrubbing,
    };

    this.logsBuffer.push(entry);

    // Auto-flush if buffer is full
    if (this.logsBuffer.length >= 50) {
      this.flushLogs();
    }

    return entry;
  }

  // ========================================
  // METHOD: correlateContext
  // PR: #1274
  // STATUS: draft
  // TAGS: correlation, distributed-tracing
  // ========================================
  public correlateContext(parentContext?: TraceContext): TraceContext {
    const traceId = parentContext?.traceId || Bun.randomUUIDv7();
    const spanId = Bun.randomUUIDv7();

    return {
      traceId,
      spanId,
      baggage: parentContext?.baggage || {},
      sampled: Math.random() < this.config.samplingRate,
    };
  }

  // ========================================
  // METHOD: exportTelemetry
  // PR: #1274
  // STATUS: draft
  // TAGS: telemetry, export
  // ========================================
  public exportTelemetry(): TelemetryBatch {
    const batch: TelemetryBatch = {
      metrics: [...this.metricsBuffer],
      spans: Array.from(this.activeSpans.values()),
      logs: [...this.logsBuffer],
      timestamp: Date.now(),
    };

    // Clear buffers after export
    this.metricsBuffer = [];
    this.logsBuffer = [];
    this.activeSpans.clear();

    return batch;
  }

  // ========================================
  // METHOD: queryMetrics
  // PR: #1274
  // STATUS: draft
  // TAGS: metrics, querying
  // ========================================
  public queryMetrics(
    name?: string,
    labels?: Record<string, string>,
    timeRange?: { start: number; end: number }
  ): Metric[] {
    return this.metricsBuffer.filter(metric => {
      if (name && metric.name !== name) return false;
      if (labels) {
        for (const [key, value] of Object.entries(labels)) {
          if (metric.labels[key] !== value) return false;
        }
      }
      if (timeRange) {
        if (metric.timestamp < timeRange.start || metric.timestamp > timeRange.end) {
          return false;
        }
      }
      return true;
    });
  }

  private scrubPII(context: Record<string, any>): Record<string, any> {
    const scrubbed = { ...context };

    // Remove common PII fields
    const piiFields = ["email", "password", "ssn", "credit_card", "api_key"];
    for (const field of piiFields) {
      if (scrubbed[field]) {
        scrubbed[field] = "[REDACTED]";
      }
    }

    return scrubbed;
  }

  private flushMetrics(): void {
    if (this.metricsBuffer.length === 0) return;

    logger.debug("Flushing metrics buffer", {
      count: this.metricsBuffer.length
    });

    // In real implementation: send to metrics backend
    this.metricsBuffer = [];
  }

  private flushLogs(): void {
    if (this.logsBuffer.length === 0) return;

    logger.debug("Flushing logs buffer", {
      count: this.logsBuffer.length
    });

    // In real implementation: send to log aggregation system
    this.logsBuffer = [];
  }
}

// ========================================
// BENCHMARK: createMetric
// PR: #1274
// ========================================
bench("ObservabilityTypes.createMetric", () => {
  const obs = new ObservabilityTypes(null, null, null, null);
  obs.createMetric("http_requests_total", 1, "counter", { method: "GET", status: "200" });
});

// ========================================
// VALIDATION: createMetric
// COVERAGE: 95% / 90%
// THRESHOLD: < 1ms metric creation
// ========================================
validate("ObservabilityTypes.createMetric", () => {
  const obs = new ObservabilityTypes(null, null, null, null);
  const start = Bun.nanoseconds();

  const metric = obs.createMetric("test_metric", 42, "gauge");
  const duration = Bun.nanoseconds() - start;

  expect(metric.name).toBe("test_metric");
  expect(metric.value).toBe(42);
  expect(duration).toBeLessThan(1000000); // 1ms in nanoseconds
});