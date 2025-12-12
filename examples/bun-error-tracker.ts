import { logger } from "./logging/bun-logger";

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
  details?: Record<string, any>;
}

export interface ErrorReport {
  summary: {
    total_errors: number;
    total_warnings: number;
    unique_error_types: number;
    sources_affected: number;
  };
  breakdown: {
    by_type: Record<string, number>;
    by_source: Record<string, number>;
  };
  performance: {
    avg_duration: number;
    min_duration: number;
    max_duration: number;
  };
}

export class ErrorTracker {
  private metrics = {
    totalErrors: 0,
    totalWarnings: 0,
    errorTypes: new Map<string, number>(),
    sources: new Map<string, number>(),
    performance: [] as number[],
  };

  trackError(error: ValidationError, source: string): void {
    const startTime = performance.now();

    this.metrics.totalErrors++;

    // Track error types
    const count = this.metrics.errorTypes.get(error.code) || 0;
    this.metrics.errorTypes.set(error.code, count + 1);

    // Track sources
    const sourceCount = this.metrics.sources.get(source) || 0;
    this.metrics.sources.set(source, sourceCount + 1);

    const duration = performance.now() - startTime;
    this.metrics.performance.push(duration);

    logger.error(`Validation error tracked`, {
      code: error.code,
      source,
      total_errors: this.metrics.totalErrors,
      message: error.message,
      field: error.field,
      duration: `${duration.toFixed(3)}μs`
    });
  }

  trackWarning(message: string, source: string, details?: Record<string, any>): void {
    this.metrics.totalWarnings++;

    logger.warn(`Warning tracked`, {
      source,
      message,
      total_warnings: this.metrics.totalWarnings,
      ...details
    });
  }

  generateReport(): ErrorReport {
    const report = {
      summary: {
        total_errors: this.metrics.totalErrors,
        total_warnings: this.metrics.totalWarnings,
        unique_error_types: this.metrics.errorTypes.size,
        sources_affected: this.metrics.sources.size,
      },
      breakdown: {
        by_type: Object.fromEntries(this.metrics.errorTypes),
        by_source: Object.fromEntries(this.metrics.sources),
      },
      performance: {
        avg_duration: this.metrics.performance.length > 0
          ? this.metrics.performance.reduce((a, b) => a + b, 0) / this.metrics.performance.length
          : 0,
        min_duration: this.metrics.performance.length > 0
          ? Math.min(...this.metrics.performance)
          : 0,
        max_duration: this.metrics.performance.length > 0
          ? Math.max(...this.metrics.performance)
          : 0,
      },
    };

    logger.info("Error tracking report generated", {
      ...report.summary,
      report_size: JSON.stringify(report).length,
    });

    return report;
  }

  reset(): void {
    this.metrics = {
      totalErrors: 0,
      totalWarnings: 0,
      errorTypes: new Map<string, number>(),
      sources: new Map<string, number>(),
      performance: [] as number[],
    };

    logger.info("Error tracker metrics reset");
  }

  getMetrics() {
    return {
      totalErrors: this.metrics.totalErrors,
      totalWarnings: this.metrics.totalWarnings,
      errorTypes: Object.fromEntries(this.metrics.errorTypes),
      sources: Object.fromEntries(this.metrics.sources),
      performance: [...this.metrics.performance],
    };
  }
}