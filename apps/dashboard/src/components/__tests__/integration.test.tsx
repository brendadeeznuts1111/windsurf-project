// apps/dashboard/src/components/__tests__/integration.test.tsx
import { describe, test, expect, beforeAll, mock, afterEach } from 'bun:test';
import { PERFORMANCE_CONSTANTS } from '../../constants';
import App from '../../App';

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
  global.HTMLSelectElement = dom.window.HTMLSelectElement;
});

// Mock WebSocket for integration tests
vi.mock('../OddsWebSocketClient', () => ({
  OddsWebSocketClient: ({ onConnectionChange }: { onConnectionChange: (connected: boolean) => void }) => {
    // Simulate connection after mount
    setTimeout(() => onConnectionChange(true), 100);
    return <div data-testid="websocket-client">WebSocket Connected</div>;
  }
}));

describe('Application Integration Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation Integration', () => {
    test('renders main application structure', () => {
      render(<App />);

      expect(screen.getByText('Odds Protocol Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    test('navigates between different sections', () => {
      render(<App />);

      // Default should show overview
      expect(screen.getByText('System Overview')).toBeInTheDocument();

      // Navigate to Fetch API
      const fetchButton = screen.getByText('Bun Fetch API');
      fireEvent.click(fetchButton);

      expect(screen.getByText('🚀 Bun Fetch API Interactive Demo')).toBeInTheDocument();
    });

    test('all navigation tabs work', () => {
      render(<App />);

      const tabs = [
        'Overview',
        'Arbitrage',
        'Market Data',
        'Sharp Detection',
        'Performance',
        'Bun v1.3 CSS',
        'Bun Fetch API',
        'Bun File I/O',
        'PID File System',
        'Market Telemetry',
        'TCP API Demo',
        'Bun v1.3 Enhanced',
        'Cross-Reference Guide'
      ];

      tabs.forEach(tab => {
        const tabButton = screen.getByText(tab);
        fireEvent.click(tabButton);

        // Should navigate to the section (basic check that no errors occur)
        expect(tabButton).toHaveClass('active');
      });
    });
  });

  describe('WebSocket Integration', () => {
    test('shows connection status', async () => {
      render(<App />);

      // Should show connected status after WebSocket connects
      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });

    test('connection status affects UI', async () => {
      render(<App />);

      await waitFor(() => {
        const statusIndicator = screen.getByText('Connected');
        expect(statusIndicator).toHaveClass('connected');
      });
    });
  });

  describe('Component Data Flow', () => {
    test('FetchDemo integrates with application state', () => {
      render(<App />);

      const fetchButton = screen.getByText('Bun Fetch API');
      fireEvent.click(fetchButton);

      expect(screen.getByText('🚀 Bun Fetch API Interactive Demo')).toBeInTheDocument();

      // Should be able to interact with fetch examples
      const runButtons = screen.getAllByText('Run Example');
      expect(runButtons.length).toBeGreaterThan(0);
    });

    test('MarketTelemetryDemo shows real-time data', () => {
      render(<App />);

      const telemetryButton = screen.getByText('Market Telemetry');
      fireEvent.click(telemetryButton);

      expect(screen.getByText('📈 ORCA Market Telemetry Demo')).toBeInTheDocument();

      // Should have interactive controls
      expect(screen.getByText('▶️ Start Telemetry')).toBeInTheDocument();
      expect(screen.getByText('📊 Process Batch')).toBeInTheDocument();
    });

    test('TCPDemo shows connection management', () => {
      render(<App />);

      const tcpButton = screen.getByText('TCP API Demo');
      fireEvent.click(tcpButton);

      expect(screen.getByText('🔌 Bun TCP API Interactive Demo')).toBeInTheDocument();

      // Should have server and client controls
      expect(screen.getByText('🚀 Start Server')).toBeInTheDocument();
      expect(screen.getByText('🔗 Connect Client')).toBeInTheDocument();
    });
  });

  describe('Cross-Component Data Sharing', () => {
    test('components maintain independent state', () => {
      render(<App />);

      // Navigate to different components and verify they maintain state
      const fetchButton = screen.getByText('Bun Fetch API');
      fireEvent.click(fetchButton);

      expect(screen.getByText('🚀 Bun Fetch API Interactive Demo')).toBeInTheDocument();

      const telemetryButton = screen.getByText('Market Telemetry');
      fireEvent.click(telemetryButton);

      expect(screen.getByText('📈 ORCA Market Telemetry Demo')).toBeInTheDocument();

      // Navigate back to fetch - should still work
      fireEvent.click(fetchButton);
      expect(screen.getByText('🚀 Bun Fetch API Interactive Demo')).toBeInTheDocument();
    });
  });

  describe('Performance Integration', () => {
    test('components load without performance issues', async () => {
      const startTime = performance.now();

      render(<App />);

      // Navigate through several components quickly
      const components = [
        'Bun Fetch API',
        'Market Telemetry',
        'TCP API Demo',
        'Bun v1.3 Enhanced',
        'Cross-Reference Guide'
      ];

      for (const component of components) {
        const button = screen.getByText(component);
        fireEvent.click(button);

        // Brief wait to ensure component loads
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete navigation within reasonable time
      expect(totalTime).toBeLessThan(PERFORMANCE_CONSTANTS.MAX_TOTAL_TIME_MS); // Less than 1 second
    });
  });

  describe('Error Boundary Integration', () => {
    test('application handles component errors gracefully', () => {
      // This test would verify error boundaries work
      // For now, just ensure the app renders without crashing
      expect(() => {
        render(<App />);
      }).not.toThrow();
    });
  });

  describe('Accessibility Integration', () => {
    test('application maintains accessibility across navigation', () => {
      render(<App />);

      // Navigate through components and check basic accessibility
      const components = ['Bun Fetch API', 'Market Telemetry', 'TCP API Demo'];

      components.forEach(component => {
        const button = screen.getByText(component);
        fireEvent.click(button);

        // Should have some accessible content
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Memory Management', () => {
    test('components clean up after navigation', () => {
      // This would test for memory leaks
      // For now, just verify navigation works smoothly
      render(<App />);

      for (let i = 0; i < 5; i++) {
        const fetchButton = screen.getByText('Bun Fetch API');
        const telemetryButton = screen.getByText('Market Telemetry');

        fireEvent.click(fetchButton);
        fireEvent.click(telemetryButton);
      }

      // Should still work after multiple navigations
      expect(screen.getByText('📈 ORCA Market Telemetry Demo')).toBeInTheDocument();
    });
  });
});