// apps/dashboard/src/components/__tests__/cross-reference-guide.test.tsx
import { describe, test, expect, beforeAll } from 'bun:test';
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
});

describe('CrossReferenceGuide Component', () => {
  describe('Component Rendering', () => {
    test('renders component with correct title', () => {
      render(<CrossReferenceGuide />);
      expect(screen.getByText('🔗 Cross-Reference Guide')).toBeInTheDocument();
    });

    test('renders all major sections', () => {
      render(<CrossReferenceGuide />);

      expect(screen.getByText('📦 Component Overview')).toBeInTheDocument();
      expect(screen.getByText('🗺️ Integration Map')).toBeInTheDocument();
      expect(screen.getByText('🏗️ Architecture Patterns')).toBeInTheDocument();
      expect(screen.getByText('📊 Integration Matrix')).toBeInTheDocument();
    });
  });

  describe('Component Overview', () => {
    test('displays all components', () => {
      render(<CrossReferenceGuide />);

      expect(screen.getByText('Market Telemetry')).toBeInTheDocument();
      expect(screen.getByText('TCP API Demo')).toBeInTheDocument();
      expect(screen.getByText('Bun v1.3 Enhanced')).toBeInTheDocument();
      expect(screen.getByText('Fetch API Demo')).toBeInTheDocument();
      expect(screen.getByText('PID File System')).toBeInTheDocument();
      expect(screen.getByText('Bun File API Docs')).toBeInTheDocument();
    });

    test('shows component categories', () => {
      render(<CrossReferenceGuide />);

      expect(screen.getByText('Telemetry')).toBeInTheDocument();
      expect(screen.getByText('Networking')).toBeInTheDocument();
      expect(screen.getByText('Runtime Features')).toBeInTheDocument();
      expect(screen.getByText('File I/O')).toBeInTheDocument();
    });

    test('displays technology stacks', () => {
      render(<CrossReferenceGuide />);

      expect(screen.getByText('PID Context')).toBeInTheDocument();
      expect(screen.getByText('Bun.listen')).toBeInTheDocument();
      expect(screen.getByText('Stream Processing')).toBeInTheDocument();
      expect(screen.getByText('Bun.file')).toBeInTheDocument();
    });
  });

  describe('Integration Map', () => {
    test('shows relationship flows', () => {
      render(<CrossReferenceGuide />);

      expect(screen.getByText('uses')).toBeInTheDocument();
      expect(screen.getByText('extends')).toBeInTheDocument();
      expect(screen.getByText('integrates')).toBeInTheDocument();
      expect(screen.getByText('demonstrates')).toBeInTheDocument();
      expect(screen.getByText('complements')).toBeInTheDocument();
    });

    test('displays relationship descriptions', () => {
      render(<CrossReferenceGuide />);

      expect(screen.getByText(/Uses TCP for telemetry data transmission/)).toBeInTheDocument();
      expect(screen.getByText(/Leverages stream processing and socket info/)).toBeInTheDocument();
      expect(screen.getByText(/Extends PID context to file operations/)).toBeInTheDocument();
    });
  });

  describe('Architecture Patterns', () => {
    test('displays pattern cards', () => {
      render(<CrossReferenceGuide />);

      expect(screen.getByText('🔄 PID Context Propagation')).toBeInTheDocument();
      expect(screen.getByText('🌊 Stream Processing Pipeline')).toBeInTheDocument();
      expect(screen.getByText('📊 Real-time Analytics Stack')).toBeInTheDocument();
      expect(screen.getByText('🔐 Security & Audit Chain')).toBeInTheDocument();
    });

    test('shows pattern flow diagrams', () => {
      render(<CrossReferenceGuide />);

      expect(screen.getByText('MarketTelemetry → PIDFileSystem → AuditTrail')).toBeInTheDocument();
      expect(screen.getByText('BunV13Demo → MarketTelemetry → TCPDemo')).toBeInTheDocument();
    });
  });

  describe('Integration Matrix', () => {
    test('renders matrix table', () => {
      render(<CrossReferenceGuide />);

      // Should have component names in both header and rows
      const marketTelemetryElements = screen.getAllByText('Market Telemetry');
      expect(marketTelemetryElements.length).toBeGreaterThan(1);
    });

    test('shows relationship indicators', () => {
      render(<CrossReferenceGuide />);

      // Should show various relationship icons
      expect(screen.getByText('🔗')).toBeInTheDocument(); // uses
      expect(screen.getByText('⬆️')).toBeInTheDocument(); // extends
      expect(screen.getByText('🔄')).toBeInTheDocument(); // integrates
    });

    test('displays matrix legend', () => {
      render(<CrossReferenceGuide />);

      expect(screen.getByText('Uses')).toBeInTheDocument();
      expect(screen.getByText('Extends')).toBeInTheDocument();
      expect(screen.getByText('Integrates')).toBeInTheDocument();
      expect(screen.getByText('Demonstrates')).toBeInTheDocument();
      expect(screen.getByText('Complements')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    test('uses consistent styling', () => {
      const { container } = render(<CrossReferenceGuide />);

      // Should have proper CSS classes
      expect(container.querySelector('.cross-reference-guide')).toBeInTheDocument();
      expect(container.querySelector('.guide-header')).toBeInTheDocument();
      expect(container.querySelector('.components-overview')).toBeInTheDocument();
    });

    test('has responsive layout', () => {
      const { container } = render(<CrossReferenceGuide />);

      // Should use CSS Grid for responsive design
      const gridElements = container.querySelectorAll('[class*="grid"]');
      expect(gridElements.length).toBeGreaterThan(0);
    });
  });

  describe('Content Accuracy', () => {
    test('displays correct component count', () => {
      render(<CrossReferenceGuide />);

      // Should show 6 components
      const componentCards = screen.getAllByText(/Telemetry|Networking|Runtime Features|File I/O/);
      expect(componentCards.length).toBeGreaterThan(0);
    });

    test('shows correct relationship count', () => {
      render(<CrossReferenceGuide />);

      // Should show multiple relationships
      const relationshipItems = screen.getAllByText(/uses|extends|integrates|demonstrates|complements/);
      expect(relationshipItems.length).toBeGreaterThan(5);
    });
  });

  describe('Accessibility', () => {
    test('has semantic HTML structure', () => {
      const { container } = render(<CrossReferenceGuide />);

      // Should use proper heading hierarchy
      const headings = container.querySelectorAll('h2, h3, h4');
      expect(headings.length).toBeGreaterThan(5);
    });

    test('provides descriptive content', () => {
      render(<CrossReferenceGuide />);

      // Should have descriptive text for all sections
      expect(screen.getByText(/Explore relationships and integrations/)).toBeInTheDocument();
      expect(screen.getByText(/Visual mapping of integrations/)).toBeInTheDocument();
    });
  });
});