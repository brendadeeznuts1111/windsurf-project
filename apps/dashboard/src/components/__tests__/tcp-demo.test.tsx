// apps/dashboard/src/components/__tests__/tcp-demo.test.tsx
import { describe, test, expect, beforeAll, mock, afterEach } from 'bun:test';
import { NETWORK_CONSTANTS, TIMING_CONSTANTS, PROCESS_CONSTANTS } from '../../constants';
import { TCPDemo } from '../TCPDemo';

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
  global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
});

// Mock process for browser environment
Object.defineProperty(global, 'process', {
  value: { pid: PROCESS_CONSTANTS.TEST_PID, ppid: PROCESS_CONSTANTS.TEST_PPID }
});

describe('TCPDemo Component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders component with correct title', () => {
      render(<TCPDemo />);
      expect(screen.getByText('🔌 Bun TCP API Interactive Demo')).toBeInTheDocument();
    });

    test('renders server and client controls', () => {
      render(<TCPDemo />);

      expect(screen.getByText('TCP Server')).toBeInTheDocument();
      expect(screen.getByText('TCP Client')).toBeInTheDocument();
      expect(screen.getByText('Message Testing')).toBeInTheDocument();
    });

    test('renders initial state correctly', () => {
      render(<TCPDemo />);

      // Should show empty connections list
      expect(screen.getByText('No active TCP connections.')).toBeInTheDocument();

      // Should show default server config
      expect(screen.getByDisplayValue('localhost')).toBeInTheDocument();
      expect(screen.getByDisplayValue(NETWORK_CONSTANTS.DEFAULT_TCP_PORT.toString())).toBeInTheDocument();
    });
  });

  describe('Server Controls', () => {
    test('creates TCP server', async () => {
      render(<TCPDemo />);

      const createButton = screen.getByText('🚀 Start Server');
      fireEvent.click(createButton);

      // Should show server in connections list
      await waitFor(() => {
        expect(screen.getByText('SERVER')).toBeInTheDocument();
      });

      expect(screen.getByText('listening')).toBeInTheDocument();
    });

    test('enables TLS for server', () => {
      render(<TCPDemo />);

      const tlsCheckbox = screen.getAllByDisplayValue('')[0]; // Server TLS checkbox
      fireEvent.click(tlsCheckbox);

      expect(tlsCheckbox).toBeChecked();

      const createButton = screen.getByText('🚀 Start Server 🔒');
      expect(createButton).toBeInTheDocument();
    });

    test('changes server configuration', () => {
      render(<TCPDemo />);

      const hostnameInput = screen.getAllByDisplayValue('localhost')[0];
      const portInput = screen.getByDisplayValue(NETWORK_CONSTANTS.DEFAULT_TCP_PORT.toString());

      fireEvent.change(hostnameInput, { target: { value: '127.0.0.1' } });
      fireEvent.change(portInput, { target: { value: NETWORK_CONSTANTS.DEFAULT_HTTP_PORT.toString() } });

      expect(screen.getByDisplayValue('127.0.0.1')).toBeInTheDocument();
      expect(screen.getByDisplayValue(NETWORK_CONSTANTS.DEFAULT_HTTP_PORT.toString())).toBeInTheDocument();
    });
  });

  describe('Client Controls', () => {
    test('connects single TCP client', async () => {
      render(<TCPDemo />);

      const connectButton = screen.getByText('🔗 Connect Client');
      fireEvent.click(connectButton);

      // Should show client connection
      await waitFor(() => {
        expect(screen.getByText('CLIENT')).toBeInTheDocument();
      });

      expect(screen.getByText('connected')).toBeInTheDocument();
    });

    test('connects multiple concurrent clients', async () => {
      render(<TCPDemo />);

      // Set concurrent clients to 3
      const concurrentInput = screen.getByDisplayValue('1');
      fireEvent.change(concurrentInput, { target: { value: '3' } });

      const connectButton = screen.getByText('🔗 Connect 3 Clients');
      fireEvent.click(connectButton);

      // Should show multiple clients
      await waitFor(() => {
        const clientElements = screen.getAllByText('CLIENT');
        expect(clientElements).toHaveLength(3);
      });
    });

    test('enables TLS for client', () => {
      render(<TCPDemo />);

      const tlsCheckboxes = screen.getAllByDisplayValue('');
      const clientTlsCheckbox = tlsCheckboxes[1]; // Client TLS checkbox
      fireEvent.click(clientTlsCheckbox);

      expect(clientTlsCheckbox).toBeChecked();

      const connectButton = screen.getByText('🔗 Connect Client 🔒');
      expect(connectButton).toBeInTheDocument();
    });
  });

  describe('Message Testing', () => {
    test('sends message to connected client', async () => {
      render(<TCPDemo />);

      // Connect a client first
      const connectButton = screen.getByText('🔗 Connect Client');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('connected')).toBeInTheDocument();
      });

      // Send a message
      const messageTextarea = screen.getByPlaceholderText('Enter message to send...');
      fireEvent.change(messageTextarea, { target: { value: 'Hello TCP!' } });

      const sendButton = screen.getByText('📤 Send Message');
      fireEvent.click(sendButton);

      // Should show send operation
      await waitFor(() => {
        expect(screen.getByText('send')).toBeInTheDocument();
      });
    });

    test('receives echo response', async () => {
      render(<TCPDemo />);

      // Connect client and send message
      const connectButton = screen.getByText('🔗 Connect Client');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('connected')).toBeInTheDocument();
      });

      const messageTextarea = screen.getByPlaceholderText('Enter message to send...');
      fireEvent.change(messageTextarea, { target: { value: 'Test Message' } });

      const sendButton = screen.getByText('📤 Send Message');
      fireEvent.click(sendButton);

      // Should receive echo response
      await waitFor(() => {
        expect(screen.getByText('receive')).toBeInTheDocument();
      });
    });

    test('closes connection', async () => {
      render(<TCPDemo />);

      // Connect client
      const connectButton = screen.getByText('🔗 Connect Client');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('connected')).toBeInTheDocument();
      });

      // Close connection
      const closeButton = screen.getByText('❌ Close Connection');
      fireEvent.click(closeButton);

      // Should show disconnected state
      await waitFor(() => {
        expect(screen.getByText('disconnected')).toBeInTheDocument();
      });
    });
  });

  describe('Load Testing', () => {
    test('executes load test', async () => {
      render(<TCPDemo />);

      const loadTestButton = screen.getByText('⚡ Load Test');
      fireEvent.click(loadTestButton);

      // Should show testing state
      expect(screen.getByText('⏳ Testing...')).toBeInTheDocument();

      // Should complete load test
      await waitFor(() => {
        expect(screen.getByText('⚡ Load Test')).toBeInTheDocument();
      }, { timeout: TIMING_CONSTANTS.TEN_SECONDS });
    });

    test('disables load test during execution', () => {
      render(<TCPDemo />);

      const loadTestButton = screen.getByText('⚡ Load Test');
      fireEvent.click(loadTestButton);

      // Button should be disabled during test
      expect(loadTestButton).toBeDisabled();
    });
  });

  describe('Connection Monitoring', () => {
    test('displays connection details', async () => {
      render(<TCPDemo />);

      // Create server and client
      const createServerButton = screen.getByText('🚀 Start Server');
      fireEvent.click(createServerButton);

      const connectButton = screen.getByText('🔗 Connect Client');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getAllByText(new RegExp(`localhost:${NETWORK_CONSTANTS.DEFAULT_TCP_PORT}`))).toHaveLength(2);
      });
    });

    test('shows connection operations', async () => {
      render(<TCPDemo />);

      const connectButton = screen.getByText('🔗 Connect Client');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('connected')).toBeInTheDocument();
      });

      // Should show connection operations
      expect(screen.getByText('connecting')).toBeInTheDocument();
      expect(screen.getByText('connected')).toBeInTheDocument();
    });

    test('displays heartbeat operations', async () => {
      render(<TCPDemo />);

      const connectButton = screen.getByText('🔗 Connect Client');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('connected')).toBeInTheDocument();
      });

      // Wait for heartbeat
      await new Promise(resolve => setTimeout(resolve, 3500)); // Keep as is for specific test timing

      // Should show heartbeat operations
      expect(screen.getByText('heartbeat')).toBeInTheDocument();
    });
  });

  describe('Performance Metrics', () => {
    test('displays connection statistics', () => {
      render(<TCPDemo />);

      expect(screen.getByText('Active Connections')).toBeInTheDocument();
      expect(screen.getByText('Total Operations')).toBeInTheDocument();
      expect(screen.getByText('Messages Sent')).toBeInTheDocument();
      expect(screen.getByText('Messages Received')).toBeInTheDocument();
    });

    test('updates metrics as operations occur', async () => {
      render(<TCPDemo />);

      // Initially should show zeros
      expect(screen.getAllByText('0')).toHaveLength(4);

      // Create connections and send messages
      const connectButton = screen.getByText('🔗 Connect Client');
      fireEvent.click(connectButton);

      await waitFor(() => {
        // Should show updated metrics
        expect(screen.getByText('1')).toBeInTheDocument(); // Active connections
      });
    });
  });

  describe('Error Handling', () => {
    test('handles connection failures gracefully', async () => {
      // This would test error scenarios in a real implementation
      // For now, just verify the UI handles various states
      render(<TCPDemo />);

      expect(screen.getByText('TCP Performance Metrics')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      render(<TCPDemo />);

      const hostnameInputs = screen.getAllByDisplayValue('localhost');
      const portInputs = screen.getAllByDisplayValue(NETWORK_CONSTANTS.DEFAULT_TCP_PORT.toString());

      expect(hostnameInputs).toHaveLength(2); // Server and client
      expect(portInputs).toHaveLength(2);
    });

    test('buttons have descriptive text', () => {
      render(<TCPDemo />);

      expect(screen.getByText('🚀 Start Server')).toBeInTheDocument();
      expect(screen.getByText('🔗 Connect Client')).toBeInTheDocument();
      expect(screen.getByText('📤 Send Message')).toBeInTheDocument();
    });
  });
});