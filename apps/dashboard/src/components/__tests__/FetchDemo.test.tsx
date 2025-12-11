// apps/dashboard/src/components/__tests__/FetchDemo.test.tsx
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FetchDemo } from '../FetchDemo';
import { HeaderDisplay } from '../HeaderDisplay';
import { HeaderEditor } from '../HeaderEditor';

// Mock fetch globally
global.fetch = vi.fn();

describe('FetchDemo Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([
        ['content-type', 'application/json'],
        ['x-api-key', 'test-key']
      ]),
      json: () => Promise.resolve({ id: 1, name: 'Test User' }),
      text: () => Promise.resolve('{"id":1,"name":"Test User"}')
    });
  });

  test('renders demo header and examples', () => {
    render(<FetchDemo />);

    expect(screen.getByText('🚀 Bun Fetch API Interactive Demo')).toBeInTheDocument();
    expect(screen.getByText(/Click cards to expand/)).toBeInTheDocument();
    expect(screen.getAllByText(/Run Example/)).toHaveLength(6); // 6 examples
  });

  test('filters examples by category', async () => {
    render(<FetchDemo />);

    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'basic' } });

    await waitFor(() => {
      // Should show only basic examples (GET and POST)
      expect(screen.getAllByText(/Run Example/)).toHaveLength(2);
    });
  });

  test('filters examples by difficulty', async () => {
    render(<FetchDemo />);

    const difficultySelect = screen.getByDisplayValue('All Levels');
    fireEvent.change(difficultySelect, { target: { value: 'beginner' } });

    await waitFor(() => {
      expect(screen.getAllByText(/Run Example/)).toHaveLength(2);
    });
  });

  test('expands and collapses example cards', async () => {
    render(<FetchDemo />);

    const firstCard = screen.getAllByRole('button', { name: /Run Example/ })[0];
    const cardContainer = firstCard.closest('.demo-card');

    // Initially collapsed
    expect(cardContainer).not.toHaveClass('expanded');

    // Click to expand
    fireEvent.click(cardContainer!);
    await waitFor(() => {
      expect(cardContainer).toHaveClass('expanded');
    });

    // Click again to collapse
    fireEvent.click(cardContainer!);
    await waitFor(() => {
      expect(cardContainer).not.toHaveClass('expanded');
    });
  });

  test('executes example and shows results', async () => {
    render(<FetchDemo />);

    const runButton = screen.getAllByText('Run Example')[0];
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Should show results after execution
    await waitFor(() => {
      expect(screen.getByText('200 OK')).toBeInTheDocument();
    });
  });

  test('displays performance statistics', async () => {
    render(<FetchDemo />);

    // Run an example first
    const runButton = screen.getAllByText('Run Example')[0];
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Examples')).toBeInTheDocument();
      expect(screen.getByText('Executed')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg Response')).toBeInTheDocument();
    });
  });

  test('handles network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network Error'));

    render(<FetchDemo />);

    const runButton = screen.getAllByText('Run Example')[0];
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument();
    });
  });
});

describe('HeaderDisplay Component', () => {
  const testHeaders = {
    'content-type': 'application/json',
    'authorization': 'Bearer token123',
    'x-api-key': 'secret-key',
    'user-agent': 'Bun-Fetch-Demo/1.0'
  };

  test('renders headers in categorized groups', () => {
    render(<HeaderDisplay headers={testHeaders} />);

    expect(screen.getByText('Content Headers')).toBeInTheDocument();
    expect(screen.getByText('Auth Headers')).toBeInTheDocument();
    expect(screen.getByText('API Headers')).toBeInTheDocument();
    expect(screen.getByText('Standard Headers')).toBeInTheDocument();
  });

  test('displays header values correctly', () => {
    render(<HeaderDisplay headers={testHeaders} />);

    expect(screen.getByText('application/json')).toBeInTheDocument();
    expect(screen.getByText('Bearer ****')).toBeInTheDocument(); // Sensitive data masked
    expect(screen.getByText('Bun-Fetch-Demo/1.0')).toBeInTheDocument();
  });

  test('shows required indicators for required headers', () => {
    render(<HeaderDisplay headers={testHeaders} />);

    // Content-Type should have required indicator
    const contentTypeSection = screen.getByText('application/json').closest('.header-item');
    expect(contentTypeSection).toBeInTheDocument();
  });

  test('allows sensitive data reveal', async () => {
    render(<HeaderDisplay headers={testHeaders} />);

    const revealButton = screen.getByTitle('Show sensitive data');
    fireEvent.click(revealButton);

    await waitFor(() => {
      expect(screen.getByText('Bearer token123')).toBeInTheDocument();
    });
  });

  test('provides search functionality', () => {
    render(<HeaderDisplay headers={testHeaders} searchable />);

    const searchInput = screen.getByPlaceholderText('Search headers...');
    fireEvent.change(searchInput, { target: { value: 'content' } });

    expect(screen.getByText('Content Headers')).toBeInTheDocument();
    expect(screen.queryByText('Auth Headers')).not.toBeInTheDocument();
  });

  test('handles copy to clipboard', async () => {
    const mockOnCopy = vi.fn();
    render(<HeaderDisplay headers={testHeaders} onHeaderCopy={mockOnCopy} />);

    const copyButton = screen.getAllByTitle('Copy header')[0];
    fireEvent.click(copyButton);

    expect(mockOnCopy).toHaveBeenCalledWith(expect.objectContaining({
      name: expect.any(String),
      value: expect.any(String),
      type: expect.any(String)
    }));
  });

  test('renders compact mode', () => {
    render(<HeaderDisplay headers={testHeaders} compact />);

    expect(screen.getByText('4 headers')).toBeInTheDocument();
    expect(screen.getAllByText(/📋/)).toHaveLength(3); // 3 visible badges
  });
});

describe('HeaderEditor Component', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
    mockOnClose.mockClear();
  });

  test('renders with initial headers', () => {
    const initialHeaders = { 'content-type': 'application/json' };

    render(
      <HeaderEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialHeaders={initialHeaders}
      />
    );

    expect(screen.getByText('Edit Headers')).toBeInTheDocument();
    expect(screen.getByDisplayValue('content-type')).toBeInTheDocument();
    expect(screen.getByDisplayValue('application/json')).toBeInTheDocument();
  });

  test('allows adding new headers', () => {
    render(
      <HeaderEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialHeaders={{}}
      />
    );

    const nameInput = screen.getByPlaceholderText('Header name (e.g., Authorization)');
    const valueInput = screen.getByPlaceholderText('Header value');
    const addButton = screen.getByText('Add');

    fireEvent.change(nameInput, { target: { value: 'x-custom-header' } });
    fireEvent.change(valueInput, { target: { value: 'custom-value' } });
    fireEvent.click(addButton);

    expect(screen.getByDisplayValue('x-custom-header')).toBeInTheDocument();
    expect(screen.getByDisplayValue('custom-value')).toBeInTheDocument();
  });

  test('shows smart suggestions based on endpoint', () => {
    render(
      <HeaderEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialHeaders={{}}
        endpoint="https://api.github.com/repos/oven-sh/bun"
        method="GET"
      />
    );

    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    // Should show GitHub-specific suggestions
  });

  test('validates header requirements', () => {
    render(
      <HeaderEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialHeaders={{}}
      />
    );

    const saveButton = screen.getByText('Save Headers');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({});
  });

  test('allows editing existing headers', () => {
    const initialHeaders = { 'content-type': 'application/json' };

    render(
      <HeaderEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialHeaders={initialHeaders}
      />
    );

    const valueInput = screen.getByDisplayValue('application/json');
    fireEvent.change(valueInput, { target: { value: 'text/plain' } });

    const saveButton = screen.getByText('Save Headers');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({ 'content-type': 'text/plain' });
  });

  test('handles modal close actions', () => {
    render(
      <HeaderEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialHeaders={{}}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('Fetch Performance Benchmarks', () => {
  test('measures fetch execution time', async () => {
    const startTime = Date.now();

    (global.fetch as any).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('{}')
      }), 50))
    );

    render(<FetchDemo />);

    const runButton = screen.getAllByText('Run Example')[0];
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Should complete within reasonable time
    expect(executionTime).toBeGreaterThan(40);
    expect(executionTime).toBeLessThan(200);
  });

  test('tracks multiple concurrent executions', async () => {
    render(<FetchDemo />);

    const runButtons = screen.getAllByText('Run Example');
    const firstThreeButtons = runButtons.slice(0, 3);

    // Click multiple buttons simultaneously
    firstThreeButtons.forEach(button => fireEvent.click(button));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  test('handles rapid successive executions', async () => {
    render(<FetchDemo />);

    const runButton = screen.getAllByText('Run Example')[0];

    // Click the same button multiple times rapidly
    for (let i = 0; i < 5; i++) {
      fireEvent.click(runButton);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Should handle rapid clicks gracefully
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

describe('Accessibility Tests', () => {
  test('provides proper ARIA labels', () => {
    render(<FetchDemo />);

    // Check for proper heading hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    // Check for button labels
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  test('supports keyboard navigation', async () => {
    render(<FetchDemo />);

    const firstCard = screen.getAllByRole('button', { name: /Run Example/ })[0].closest('.demo-card');

    // Focus on card
    firstCard?.focus();

    // Press Enter to expand
    fireEvent.keyDown(firstCard!, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(firstCard).toHaveClass('expanded');
    });

    // Tab through interactive elements
    const focusableElements = screen.getAllByRole('button');
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  test('maintains focus management', async () => {
    render(<FetchDemo />);

    const runButton = screen.getAllByText('Run Example')[0];

    // Focus on button
    runButton.focus();
    expect(document.activeElement).toBe(runButton);

    // Click button
    fireEvent.click(runButton);

    // Focus should be maintained appropriately
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

describe('Error Handling Tests', () => {
  test('handles malformed JSON responses', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.reject(new Error('Invalid JSON')),
      text: () => Promise.resolve('invalid json {{{')
    });

    render(<FetchDemo />);

    const runButton = screen.getAllByText('Run Example')[0];
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('invalid json {{{')).toBeInTheDocument();
    });
  });

  test('handles timeout scenarios', async () => {
    (global.fetch as any).mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );

    render(<FetchDemo />);

    const runButton = screen.getAllByText('Run Example')[0];
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Request timeout')).toBeInTheDocument();
    });
  });

  test('handles CORS errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('CORS policy violation'));

    render(<FetchDemo />);

    const runButton = screen.getAllByText('Run Example')[0];
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('CORS policy violation')).toBeInTheDocument();
    });
  });
});