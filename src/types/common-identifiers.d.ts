/**
 * 🆔 Common Identification Properties Interface
 *
 * Standard properties for tracking, cross-referencing, and logging across all data structures
 */
export interface CommonIdentifiers {
  /** Property identifier for type-specific categorization */
  propterid?: string;

  /** Cross-reference identifier for linking related entities */
  crossReferenceId?: string;

  /** Log identifier for tracing operations and events */
  logId?: string;
}

/**
 * 🔗 Enhanced Base Interface with Common Identifiers
 *
 * Extends standard interfaces with common identification properties
 */
export interface BaseEntity extends CommonIdentifiers {
  id: string;
  createdAt: string;
  updatedAt: string;
}