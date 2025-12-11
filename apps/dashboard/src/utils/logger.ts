/**
 * Enhanced Logging Utilities
 * Demonstrating Bun v1.3.4+ console.log %j format specifier
 */

export class BunLogger {
  private static formatValue(value: any): string {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  static info(message: string, ...args: any[]): void {
    console.log(`ℹ️  ${message}`, ...args);
  }

  static success(message: string, data?: any): void {
    if (data !== undefined) {
      console.log(`✅ ${message}: %j`, data);
    } else {
      console.log(`✅ ${message}`);
    }
  }

  static error(message: string, error?: any): void {
    if (error !== undefined) {
      console.log(`❌ ${message}: %j`, error);
    } else {
      console.log(`❌ ${message}`);
    }
  }

  static debug(label: string, data: any): void {
    console.log(`🔍 ${label}: %j`, data);
  }

  static performance(label: string, duration: number, metadata?: any): void {
    const perfData = {
      label,
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    console.log(`⚡ Performance: %j`, perfData);
  }

  static api(endpoint: string, method: string, status: number, duration: number): void {
    const apiData = {
      endpoint,
      method,
      status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    console.log(`🌐 API: %j`, apiData);
  }
}

// Example usage demonstrating %j format specifier
export function demonstrateConsoleLogging(): void {
  const user = { id: 123, name: 'Alice', role: 'admin' };
  const config = { theme: 'dark', language: 'en', features: ['api', 'dashboard'] };
  const error = { code: 'VALIDATION_ERROR', message: 'Invalid input', field: 'email' };

  console.log('User data: %j', user);
  console.log('Configuration: %j', config);
  console.log('Error details: %j', error);
  console.log('Mixed logging: %s %j %d', 'Status:', { ready: true }, 200);

  // Using the logger utility
  BunLogger.success('Operation completed', { result: 'success', items: 42 });
  BunLogger.error('Validation failed', error);
  BunLogger.debug('Component state', { mounted: true, loading: false });
  BunLogger.performance('Data fetch', 145.67, { endpoint: '/api/data', cached: false });
  BunLogger.api('/api/users', 'GET', 200, 89);
}