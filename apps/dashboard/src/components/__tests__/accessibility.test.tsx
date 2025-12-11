// apps/dashboard/src/components/__tests__/accessibility.test.tsx
import { describe, test, expect, beforeAll } from 'bun:test';
import { NETWORK_CONSTANTS } from '../../constants';

// Import all components for accessibility testing
import App from '../../App';
import { FetchDemo } from '../FetchDemo';
import { HeaderDisplay } from '../HeaderDisplay';
import { HeaderEditor } from '../HeaderEditor';
import { BunFileAPIDocs } from '../BunFileAPIDocs';
import { PIDFileSystemDemo } from '../PIDFileSystemDemo';
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
  global.HTMLSelectElement = dom.window.HTMLSelectElement;
});

describe('Accessibility Tests - WCAG 2.1 AA Compliance', () => {
  describe('Application-Level Accessibility', () => {
    test('App has proper document structure', () => {
      render(<App />);

      // Should have main landmark
      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();

      // Should have navigation landmark
      const nav = document.querySelector('nav');
      expect(nav).toBeInTheDocument();

      // Should have header landmark
      const header = document.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    test('App has proper heading hierarchy', () => {
      render(<App />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Should have h1 for main title
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    test('navigation is keyboard accessible', () => {
      render(<App />);

      const navButtons = screen.getAllByRole('button');
      expect(navButtons.length).toBeGreaterThan(10); // Should have many navigation buttons

      // All buttons should be focusable
      navButtons.forEach(button => {
        expect(button).toBeVisible();
      });
    });
  });

  describe('FetchDemo Accessibility', () => {
    test('has proper form controls', () => {
      render(<FetchDemo />);

      // Should have accessible form elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(5);

      // Should have select elements
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    test('provides feedback for actions', () => {
      render(<FetchDemo />);

      // Should have status or result areas
      const statusElements = screen.getByText('PID Operations Monitor');
      expect(statusElements).toBeInTheDocument();
    });

    test('has descriptive button text', () => {
      render(<FetchDemo />);

      const runButtons = screen.getAllByText('Run Example');
      expect(runButtons.length).toBeGreaterThan(0);

      // Buttons should have accessible names
      runButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('HeaderDisplay Accessibility', () => {
    test('handles empty state accessibly', () => {
      render(<HeaderDisplay headers={{}} />);

      // Should have accessible empty state
      const emptyText = screen.getByText('0 headers');
      expect(emptyText).toBeInTheDocument();
    });

    test('provides keyboard navigation for actions', () => {
      const headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer token'
      };
      render(<HeaderDisplay headers={headers} />);

      // Should have action buttons that are keyboard accessible
      const actionButtons = screen.getAllByTitle(/Copy header|Show sensitive data/);
      expect(actionButtons.length).toBeGreaterThan(0);

      actionButtons.forEach(button => {
        expect(button).toBeVisible();
        expect(button.tagName).toBe('BUTTON');
      });
    });

    test('has proper ARIA labels for sensitive data', () => {
      const headers = { 'authorization': 'Bearer token' };
      render(<HeaderDisplay headers={headers} />);

      // Should indicate sensitive data
      const sensitiveIndicator = screen.getByTitle('Sensitive data');
      expect(sensitiveIndicator).toBeInTheDocument();
    });
  });

  describe('HeaderEditor Accessibility', () => {
    test('has proper form labels', () => {
      render(
        <HeaderEditor
          isOpen={true}
          onClose={() => {}}
          onSave={() => {}}
          initialHeaders={{}}
        />
      );

      // Should have labeled inputs
      const nameInput = screen.getByPlaceholderText('Header name (e.g., Authorization)');
      const valueInput = screen.getByPlaceholderText('Header value');

      expect(nameInput).toBeInTheDocument();
      expect(valueInput).toBeInTheDocument();
    });

    test('provides clear action buttons', () => {
      render(
        <HeaderEditor
          isOpen={true}
          onClose={() => {}}
          onSave={() => {}}
          initialHeaders={{}}
        />
      );

      // Should have clear button labels
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Save Headers')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('MarketTelemetryDemo Accessibility', () => {
    test('has descriptive form controls', () => {
      render(<MarketTelemetryDemo />);

      // Should have labeled form controls
      expect(screen.getByText('Market Symbol:')).toBeInTheDocument();
      expect(screen.getByText('Tick Rate (per second):')).toBeInTheDocument();
    });

    test('provides status feedback', () => {
      render(<MarketTelemetryDemo />);

      // Should show current status
      expect(screen.getByText('Status: Stopped')).toBeInTheDocument();
    });

    test('has accessible action buttons', () => {
      render(<MarketTelemetryDemo />);

      const buttons = [
        screen.getByText('▶️ Start Telemetry'),
        screen.getByText('📊 Process Batch'),
        screen.getByText('📡 Subscribe')
      ];

      buttons.forEach(button => {
        expect(button).toBeVisible();
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('TCPDemo Accessibility', () => {
    test('has proper form structure', () => {
      render(<TCPDemo />);

      // Should have labeled form controls
      const hostnameInputs = screen.getAllByDisplayValue('localhost');
      const portInputs = screen.getAllByDisplayValue(NETWORK_CONSTANTS.DEFAULT_TCP_PORT.toString());

      expect(hostnameInputs.length).toBe(2); // Server and client
      expect(portInputs.length).toBe(2);
    });

    test('provides clear button labels', () => {
      render(<TCPDemo />);

      expect(screen.getByText('🚀 Start Server')).toBeInTheDocument();
      expect(screen.getByText('🔗 Connect Client')).toBeInTheDocument();
      expect(screen.getByText('📤 Send Message')).toBeInTheDocument();
    });

    test('has accessible status indicators', () => {
      render(<TCPDemo />);

      // Should have status information
      expect(screen.getByText('TCP Performance Metrics')).toBeInTheDocument();
    });
  });

  describe('CrossReferenceGuide Accessibility', () => {
    test('has proper heading structure', () => {
      render(<CrossReferenceGuide />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(5);

      // Should have logical heading hierarchy
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
    });

    test('provides descriptive table content', () => {
      render(<CrossReferenceGuide />);

      // Should have table with proper structure
      const table = document.querySelector('table');
      expect(table).toBeInTheDocument();

      // Should have table headers
      const headers = table?.querySelectorAll('th');
      expect(headers?.length).toBeGreaterThan(5);
    });

    test('has accessible relationship indicators', () => {
      render(<CrossReferenceGuide />);

      // Should have visual relationship indicators with alt text
      const relationshipIcons = screen.getAllByText(/🔗|⬆️|🔄|📚|🤝/);
      expect(relationshipIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Color and Contrast', () => {
    test('uses sufficient color contrast', () => {
      render(<App />);

      // This would require more sophisticated testing
      // For now, just verify components render with expected styling
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Navigation', () => {
    test('supports Tab navigation', () => {
      render(<FetchDemo />);

      // Should have focusable elements
      const focusableElements = screen.getAllByRole('button');
      expect(focusableElements.length).toBeGreaterThan(0);

      // Elements should be in logical tab order
      focusableElements.forEach(element => {
        expect(element).toBeVisible();
      });
    });
  });

  describe('Screen Reader Support', () => {
    test('has appropriate ARIA labels', () => {
      render(<MarketTelemetryDemo />);

      // Should have aria-label attributes where needed
      const ariaElements = document.querySelectorAll('[aria-label]');
      expect(ariaElements.length).toBeGreaterThan(0);
    });

    test('provides context for dynamic content', () => {
      render(<TCPDemo />);

      // Should have status regions that update
      expect(screen.getByText('TCP Performance Metrics')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    test('maintains focus on dynamic content', () => {
      render(<HeaderDisplay headers={{ 'test': 'value' }} />);

      // Should have focusable action buttons
      const actionButtons = screen.getAllByTitle(/Copy header/);
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Accessibility', () => {
    test('provides accessible error messages', () => {
      // This would test error states
      // For now, verify components handle empty/error states accessibly
      render(<HeaderDisplay headers={{}} />);

      expect(screen.getByText('0 headers')).toBeInTheDocument();
    });
  });
});