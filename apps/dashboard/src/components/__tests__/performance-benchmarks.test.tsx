// apps/dashboard/src/components/__tests__/performance-benchmarks.test.tsx
import { describe, test, expect, beforeAll, mock, afterEach } from 'bun:test';
import { PERFORMANCE_CONSTANTS } from '../../constants';

// Import components for performance testing
import { FetchDemo } from '../FetchDemo';
import { HeaderDisplay } from '../HeaderDisplay';
import { MarketTelemetryDemo } from '../MarketTelemetryDemo';
import { TCPDemo } from '../TCPDemo';
import BunV13Demo from '../BunV13Demo';
import { CrossReferenceGuide } from '../CrossReferenceGuide';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Setup DOM environment
beforeAll(() => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000'
  });

  global.window = dom.window as any;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator as any;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLInputElement = dom.window.HTMLInputElement;
  global.HTMLButtonElement = dom.window.HTMLButtonElement;
  global.performance = dom.window.performance;
});

class PerformanceMonitor {
  private measurements: number[] = [];
  private startTime = 0;

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    const duration = performance.now() - this.startTime;
    this.measurements.push(duration);
    return duration;
  }

  getAverage(): number {
    return this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length;
  }

  getMin(): number {
    return Math.min(...this.measurements);
  }

  getMax(): number {
    return Math.max(...this.measurements);
  }

  getP95(): number {
    const sorted = [...this.measurements].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  getCount(): number {
    return this.measurements.length;
  }

  reset(): void {
    this.measurements = [];
    this.startTime = 0;
  }

  getStats() {
    return {
      count: this.getCount(),
      average: this.getAverage(),
      min: this.getMin(),
      max: this.getMax(),
      p95: this.getP95()
    };
  }
}

describe('Enhanced Performance Benchmarks', () => {
  const monitor = new PerformanceMonitor();

  afterEach(() => {
    monitor.reset();
  });

  describe('Component Render Performance', () => {
    test('FetchDemo render performance', () => {
      monitor.start();
      render(<FetchDemo />);
      const renderTime = monitor.end();

      console.log(`FetchDemo render: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(100); // Should render within 100ms
    });

    test('HeaderDisplay render performance', () => {
      const headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer token',
        'x-custom': 'value1',
        'x-another': 'value2'
      };

      monitor.start();
      render(<HeaderDisplay headers={headers} />);
      const renderTime = monitor.end();

      console.log(`HeaderDisplay render: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(50);
    });

    test('MarketTelemetryDemo render performance', () => {
      monitor.start();
      render(<MarketTelemetryDemo />);
      const renderTime = monitor.end();

      console.log(`MarketTelemetryDemo render: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(100);
    });

    test('TCPDemo render performance', () => {
      monitor.start();
      render(<TCPDemo />);
      const renderTime = monitor.end();

      console.log(`TCPDemo render: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(100);
    });

    test('BunV13Demo render performance', () => {
      monitor.start();
      render(<BunV13Demo />);
      const renderTime = monitor.end();

      console.log(`BunV13Demo render: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(100);
    });

    test('CrossReferenceGuide render performance', () => {
      monitor.start();
      render(<CrossReferenceGuide />);
      const renderTime = monitor.end();

      console.log(`CrossReferenceGuide render: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(150); // More complex component
    });
  });

  describe('Component Interaction Performance', () => {
    test('FetchDemo interaction performance', async () => {
      render(<FetchDemo />);

      monitor.start();
      const runButton = screen.getAllByText('Run Example')[0];
      fireEvent.click(runButton);

      await waitFor(() => {
        expect(screen.getByText('PID Operations Monitor')).toBeInTheDocument();
      });

      const interactionTime = monitor.end();

      console.log(`FetchDemo interaction: ${interactionTime.toFixed(2)}ms`);
      expect(interactionTime).toBeLessThan(500);
    });

    test('HeaderDisplay interaction performance', () => {
      const headers = { 'authorization': 'Bearer token' };
      render(<HeaderDisplay headers={headers} />);

      monitor.start();
      const revealButton = screen.getByTitle('Show sensitive data');
      fireEvent.click(revealButton);
      const interactionTime = monitor.end();

      console.log(`HeaderDisplay interaction: ${interactionTime.toFixed(2)}ms`);
      expect(interactionTime).toBeLessThan(100);
    });

    test('TCPDemo connection performance', async () => {
      render(<TCPDemo />);

      monitor.start();
      const connectButton = screen.getByText('🔗 Connect Client');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('connected')).toBeInTheDocument();
      });

      const connectionTime = monitor.end();

      console.log(`TCPDemo connection: ${connectionTime.toFixed(2)}ms`);
      expect(connectionTime).toBeLessThan(PERFORMANCE_CONSTANTS.MAX_CONNECTION_TIME_MS);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    test('component memory efficiency', () => {
      // This would require more sophisticated memory monitoring
      // For now, just verify components render without issues
      render(<MarketTelemetryDemo />);
      render(<TCPDemo />);
      render(<CrossReferenceGuide />);

      // Should not cause memory issues
      expect(screen.getByText('📈 ORCA Market Telemetry Demo')).toBeInTheDocument();
      expect(screen.getByText('🔌 Bun TCP API Interactive Demo')).toBeInTheDocument();
      expect(screen.getByText('🔗 Cross-Reference Guide')).toBeInTheDocument();
    });
  });

  describe('Concurrent Operation Performance', () => {
    test('multiple component interactions', async () => {
      render(<MarketTelemetryDemo />);

      monitor.start();

      // Perform multiple operations concurrently
      const startButton = screen.getByText('▶️ Start Telemetry');
      const batchButton = screen.getByText('📊 Process Batch');
      const subscribeButton = screen.getByText('📡 Subscribe');

      fireEvent.click(startButton);
      fireEvent.click(batchButton);
      fireEvent.click(subscribeButton);

      await waitFor(() => {
        expect(screen.getByText('Status: Running')).toBeInTheDocument();
      });

      const concurrentTime = monitor.end();

      console.log(`Concurrent operations: ${concurrentTime.toFixed(2)}ms`);
      expect(concurrentTime).toBeLessThan(PERFORMANCE_CONSTANTS.MAX_CONCURRENT_TIME_MS);
    });
  });

  describe('Scalability Benchmarks', () => {
    test('large data set handling', () => {
      // Test HeaderDisplay with many headers
      const largeHeaders: Record<string, string> = {};
      for (let i = 0; i < 100; i++) {
        largeHeaders[`x-header-${i}`] = `value-${i}`;
      }

      monitor.start();
      render(<HeaderDisplay headers={largeHeaders} />);
      const renderTime = monitor.end();

      console.log(`Large headers render: ${renderTime.toFixed(2)}ms`);
      expect(renderTime).toBeLessThan(200);
    });

    test('rapid state changes', () => {
      render(<MarketTelemetryDemo />);

      monitor.start();

      // Rapidly change market symbols
      const select = screen.getByDisplayValue('ESZ4');
      const symbols = ['NQZ4', 'ESZ4', 'CLZ4', 'GCZ4'];

      symbols.forEach(symbol => {
        fireEvent.change(select, { target: { value: symbol } });
      });

      const stateChangeTime = monitor.end();

      console.log(`Rapid state changes: ${stateChangeTime.toFixed(2)}ms`);
      expect(stateChangeTime).toBeLessThan(100);
    });
  });

  describe('Performance Regression Detection', () => {
    const baselineMetrics = {
      componentRender: 50, // ms
      interaction: 200,    // ms
      largeDataset: 150,   // ms
    };

    test('component render regression check', () => {
      monitor.reset();

      // Test multiple renders
      for (let i = 0; i < 5; i++) {
        render(<FetchDemo />);
        monitor.end();
      }

      const avgRenderTime = monitor.getAverage();
      console.log(`Average render time: ${avgRenderTime.toFixed(2)}ms`);

      // Should not be significantly slower than baseline
      expect(avgRenderTime).toBeLessThan(baselineMetrics.componentRender * 2);
    });

    test('interaction performance regression', async () => {
      render(<TCPDemo />);

      monitor.reset();

      // Test multiple interactions
      for (let i = 0; i < 3; i++) {
        const connectButton = screen.getByText('🔗 Connect Client');
        fireEvent.click(connectButton);

        await waitFor(() => {
          expect(screen.getByText('connected')).toBeInTheDocument();
        });

        monitor.end();
      }

      const avgInteractionTime = monitor.getAverage();
      console.log(`Average interaction time: ${avgInteractionTime.toFixed(2)}ms`);

      expect(avgInteractionTime).toBeLessThan(baselineMetrics.interaction * 2);
    });
  });

  describe('Performance Report Generation', () => {
    test('generates comprehensive performance report', () => {
      // Collect performance data from all tests
      const report = {
        timestamp: new Date().toISOString(),
        environment: {
          userAgent: navigator.userAgent,
          platform: 'test',
          memory: 'N/A (test environment)'
        },
        benchmarks: {
          componentRenders: monitor.getStats(),
          totalTestsRun: monitor.getCount(),
          performanceGrade: monitor.getAverage() < 100 ? 'Excellent' :
                           monitor.getAverage() < 200 ? 'Good' : 'Needs Optimization'
        },
        recommendations: []
      };

      // Generate recommendations based on performance
      if (monitor.getAverage() > 200) {
        report.recommendations.push('Consider optimizing component re-renders');
      }
      if (monitor.getMax() > 500) {
        report.recommendations.push('Investigate performance outliers');
      }
      if (monitor.getP95() > 300) {
        report.recommendations.push('Review 95th percentile performance');
      }

      console.log('Performance Report:', JSON.stringify(report, null, 2));

      // Should have valid performance data
      expect(report.benchmarks.totalTestsRun).toBeGreaterThan(0);
      expect(report.benchmarks.performanceGrade).toBeDefined();
    });
  });
});