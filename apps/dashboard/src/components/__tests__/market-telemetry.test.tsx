// apps/dashboard/src/components/__tests__/market-telemetry.test.tsx
/// <reference lib="dom" />

/**
 * @fileoverview Market Telemetry Component Tests
 * @description Comprehensive test suite for MarketTelemetryDemo component
 */

import { describe, test, expect, beforeAll, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarketTelemetryDemo } from '../MarketTelemetryDemo';
import { PROCESS_CONSTANTS } from '../../constants';

// Mock telemetry for testing
mock.module('../core/telemetry/MarketTelemetry', () => ({
  default: {
    getInstance: mock.fn().mockReturnValue({
      recordTick: mock.fn().mockResolvedValue({
        success: true,
        tickId: 'test-tick-1'
      }),
      recordBatch: mock.fn().mockResolvedValue([
        { success: true, tickId: 'batch-1' },
        { success: true, tickId: 'batch-2' }
      ]),
      subscribe: mock.fn().mockReturnValue({
        unsubscribe: mock.fn()
      })
    })
  }
}));

describe('MarketTelemetryDemo Component', () => {
  afterEach(() => {
    mock.restore();
  });

  describe('Component Rendering', () => {
    test('renders component with correct title', () => {
      render(<MarketTelemetryDemo />);
      expect(screen.getByText('📈 ORCA Market Telemetry Demo')).toBeInTheDocument();
    });

    test('renders all control elements', () => {
      render(<MarketTelemetryDemo />);

      expect(screen.getByText('Market Symbol:')).toBeInTheDocument();
      expect(screen.getByText('Tick Rate (per second):')).toBeInTheDocument();
      expect(screen.getByText('▶️ Start Telemetry')).toBeInTheDocument();
      expect(screen.getByText('📊 Process Batch')).toBeInTheDocument();
      expect(screen.getByText('📡 Subscribe')).toBeInTheDocument();
    });

    test('renders initial state correctly', () => {
      render(<MarketTelemetryDemo />);

      // Should show stopped state
      expect(screen.getByText('▶️ Start Telemetry')).toBeInTheDocument();
      expect(screen.getByText('Status: Stopped')).toBeInTheDocument();

      // Should show empty operations list
      expect(screen.getByText('No telemetry operations yet.')).toBeInTheDocument();
    });
  });

  describe('Telemetry Controls', () => {
    test('starts telemetry generation', async () => {
      render(<MarketTelemetryDemo />);

      const startButton = screen.getByText('▶️ Start Telemetry');
      fireEvent.click(startButton);

      // Should show running state
      await waitFor(() => {
        expect(screen.getByText('Status: Running')).toBeInTheDocument();
      });

      // Should show stop button
      expect(screen.getByText('⏹️ Stop Telemetry')).toBeInTheDocument();
    });

    test('stops telemetry generation', async () => {
      render(<MarketTelemetryDemo />);

      // Start telemetry
      const startButton = screen.getByText('▶️ Start Telemetry');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Status: Running')).toBeInTheDocument();
      });

      // Stop telemetry
      const stopButton = screen.getByText('⏹️ Stop Telemetry');
      fireEvent.click(stopButton);

      // Should show stopped state
      await waitFor(() => {
        expect(screen.getByText('Status: Stopped')).toBeInTheDocument();
      });
    });

    test('changes market symbol', () => {
      render(<MarketTelemetryDemo />);

      const select = screen.getByDisplayValue('ESZ4');
      fireEvent.change(select, { target: { value: 'NQZ4' } });

      expect(screen.getByDisplayValue('NQZ4')).toBeInTheDocument();
    });

    test('changes tick rate', () => {
      render(<MarketTelemetryDemo />);

      const input = screen.getByDisplayValue('10');
      fireEvent.change(input, { target: { value: '20' } });

      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    });
  });

  describe('Batch Processing', () => {
    test('processes batch of ticks', async () => {
      render(<MarketTelemetryDemo />);

      const batchButton = screen.getByText('📊 Process Batch');
      fireEvent.click(batchButton);

      // Should show batch operation in operations list
      await waitFor(() => {
        expect(screen.getByText('batch')).toBeInTheDocument();
      });
    });
  });

  describe('Market Subscription', () => {
    test('subscribes to market data', async () => {
      render(<MarketTelemetryDemo />);

      const subscribeButton = screen.getByText('📡 Subscribe');
      fireEvent.click(subscribeButton);

      // Should show subscription operation
      await waitFor(() => {
        expect(screen.getByText('subscription')).toBeInTheDocument();
      });

      // Should show unsubscribe button
      expect(screen.getByText('🔇 Unsubscribe')).toBeInTheDocument();
    });

    test('unsubscribes from market data', async () => {
      render(<MarketTelemetryDemo />);

      // Subscribe first
      const subscribeButton = screen.getByText('📡 Subscribe');
      fireEvent.click(subscribeButton);

      await waitFor(() => {
        expect(screen.getByText('🔇 Unsubscribe')).toBeInTheDocument();
      });

      // Unsubscribe
      const unsubscribeButton = screen.getByText('🔇 Unsubscribe');
      fireEvent.click(unsubscribeButton);

      // Should show subscribe button again
      expect(screen.getByText('📡 Subscribe')).toBeInTheDocument();
    });
  });

  describe('Operations Display', () => {
    test('displays telemetry operations', async () => {
      render(<MarketTelemetryDemo />);

      // Start telemetry to generate operations
      const startButton = screen.getByText('▶️ Start Telemetry');
      fireEvent.click(startButton);

      // Wait a bit for operations to accumulate
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show operations in the list
      const operationsList = screen.getByTestId('operations-list');
      expect(operationsList).toBeInTheDocument();
    });

    test('clears operations list', async () => {
      render(<MarketTelemetryDemo />);

      // Generate some operations
      const startButton = screen.getByText('▶️ Start Telemetry');
      fireEvent.click(startButton);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Clear operations
      const clearButton = screen.getByText('🗑️ Clear Operations');
      fireEvent.click(clearButton);

      // Should show empty state
      expect(screen.getByText('No telemetry operations yet.')).toBeInTheDocument();
    });
  });

  describe('Performance Metrics', () => {
    test('displays performance statistics', () => {
      render(<MarketTelemetryDemo />);

      expect(screen.getByText('Total Operations:')).toBeInTheDocument();
      expect(screen.getByText('Active Subscriptions:')).toBeInTheDocument();
      expect(screen.getByText('Avg Latency:')).toBeInTheDocument();
    });

    test('updates metrics when operations occur', async () => {
      render(<MarketTelemetryDemo />);

      // Initially should show zeros
      expect(screen.getByText('0')).toBeInTheDocument();

      // Generate operations
      const batchButton = screen.getByText('📊 Process Batch');
      fireEvent.click(batchButton);

      await waitFor(() => {
        // Should show updated counts
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles telemetry errors gracefully', async () => {
      // Mock telemetry to throw error
      const mockTelemetry = require('../core/telemetry/MarketTelemetry').MarketTelemetry;
      mockTelemetry.getInstance().recordTick.mockRejectedValue(new Error('Network error'));

      render(<MarketTelemetryDemo />);

      const startButton = screen.getByText('▶️ Start Telemetry');
      fireEvent.click(startButton);

      // Should continue running despite errors
      await waitFor(() => {
        expect(screen.getByText('Status: Running')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<MarketTelemetryDemo />);

      // Check for accessible form controls
      const select = screen.getByDisplayValue('ESZ4');
      expect(select).toHaveAttribute('aria-label', 'Market Symbol');

      const input = screen.getByDisplayValue('10');
      expect(input).toHaveAttribute('aria-label', 'Tick Rate');
    });

    test('buttons have accessible names', () => {
      render(<MarketTelemetryDemo />);

      const startButton = screen.getByText('▶️ Start Telemetry');
      expect(startButton).toHaveAttribute('aria-label', 'Start telemetry generation');
    });
  });
});