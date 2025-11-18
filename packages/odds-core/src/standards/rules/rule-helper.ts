// packages/odds-core/src/standards/rules/rule-helper.ts
import type { RuleViolation } from '../rule-enforcement.js';

export function createViolation(
  rule: string,
  file: string,
  message: string,
  severity: 'error' | 'warning' = 'error',
  line?: number,
  suggestion?: string
): RuleViolation {
  return {
    rule,
    file,
    line,
    message,
    severity,
    suggestion: suggestion || getDefaultSuggestion(rule)
  };
}

function getDefaultSuggestion(rule: string): string {
  const suggestions: Record<string, string> = {
    'Use Bun Builtins': 'Replace with Bun builtin API',
    'Track API Usage': 'Wrap with apiTracker.track()',
    'Error Handling': 'Implement try-catch with retry logic',
    'Type Safety': 'Add proper TypeScript types',
    'Memory Monitoring': 'Add memory usage tracking',
    'Performance Testing': 'Add performance boundaries',
    'Resource Management': 'Use DisposableStack for cleanup',
    'Bun Optimizations': 'Apply Bun-specific optimizations',
    'Logging & Monitoring': 'Add comprehensive logging',
    'Stay Updated': 'Update to latest Bun version'
  };

  return suggestions[rule] || 'Follow the golden rule guidelines';
}
