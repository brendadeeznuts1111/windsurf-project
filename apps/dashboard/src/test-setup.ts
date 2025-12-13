import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Register happy-dom globals for DOM testing
GlobalRegistrator.register();

// Add any global test configuration here
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock other APIs as needed for Bun native testing
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Bun native testing utilities
export const mockFunction = (implementation?: (...args: any[]) => any) => {
  const calls: any[][] = [];
  const mock = (...args: any[]) => {
    calls.push(args);
    return implementation?.(...args);
  };
  mock.calls = calls;
  mock.mockClear = () => { calls.length = 0; };
  mock.mockReturnValue = (value: any) => { implementation = () => value; };
  return mock;
};