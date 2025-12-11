// apps/dashboard/src/components/__tests__/edge-cases.test.tsx
import { describe, test, expect, beforeAll } from 'bun:test';
import { SIZE_CONSTANTS } from '../../constants';
import { HeaderDisplay } from '../HeaderDisplay';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Setup DOM environment for this test
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
});

describe('Basic Edge Cases Test Suite', () => {
  test('HeaderDisplay handles empty headers object', () => {
    const { container } = render(<HeaderDisplay headers={{}} />);
    // Should render empty header groups
    const headerGroups = container.querySelector('.header-groups');
    expect(headerGroups).toBeInTheDocument();
    expect(headerGroups?.children.length).toBe(0);
  });

  test('HeaderDisplay handles headers with special characters', () => {
    const specialHeaders = {
      'x-custom-header': 'value with spaces & symbols !@#$%^&*()',
      'content-type': 'application/vnd.api+json; charset=utf-8'
    };

    const { getByText } = render(<HeaderDisplay headers={specialHeaders} />);
    expect(getByText('value with spaces & symbols !@#$%^&*()')).toBeInTheDocument();
    expect(getByText('application/vnd.api+json; charset=utf-8')).toBeInTheDocument();
  });

  test('HeaderDisplay handles extremely long header values', () => {
    const longValue = 'x'.repeat(SIZE_CONSTANTS.LONG_STRING_LENGTH);
    const headers = {
      'x-long-header': longValue
    };

    const { getByText } = render(<HeaderDisplay headers={headers} />);
    // Should truncate long values
    expect(getByText('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...')).toBeInTheDocument();
  });

  test('HeaderDisplay handles sensitive header masking correctly', () => {
    const sensitiveHeaders = {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      'x-api-key': 'sk-1234567890abcdef',
      'normal-header': 'normal-value'
    };

    const { getByText, getAllByText } = render(<HeaderDisplay headers={sensitiveHeaders} />);
    // Should have multiple masked values (both auth and api key)
    const maskedValues = getAllByText('••••••••');
    expect(maskedValues).toHaveLength(2);
    // Normal headers should be visible
    expect(getByText('normal-value')).toBeInTheDocument();
    // Should show auth headers group
    expect(getByText('Auth Headers')).toBeInTheDocument();
    // Should show API headers group
    expect(getByText('Api Headers')).toBeInTheDocument();
  });
});