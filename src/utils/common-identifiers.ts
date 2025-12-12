#!/usr/bin/env bun

/**
 * 🆔 Common Identifiers Utility
 *
 * Utility functions for managing common identifier properties across data structures
 */

import { BunUUIDGenerator } from './bun-uuid';

const uuidGenerator = new BunUUIDGenerator();

/**
 * Generate a property identifier for type-specific categorization
 */
export function generatePropterid(type: string, context?: string): string {
  const base = `${type}-${Date.now()}`;
  return context ? `${base}-${context}` : base;
}

/**
 * Generate a cross-reference identifier for linking related entities
 */
export function generateCrossReferenceId(source: string, target: string, relationship: string): string {
  return `xref-${source}-${target}-${relationship}-${uuidGenerator.generate().slice(0, 8)}`;
}

/**
 * Generate a log identifier for tracing operations and events
 */
export function generateLogId(component: string, operation: string): string {
  return `log-${component}-${operation}-${uuidGenerator.generate().slice(0, 8)}`;
}

/**
 * Add common identifiers to an object
 */
export function addCommonIdentifiers<T extends Record<string, any>>(
  obj: T,
  options: {
    propterid?: string | { type: string; context?: string };
    crossReferenceId?: string | { source: string; target: string; relationship: string };
    logId?: string | { component: string; operation: string };
  } = {}
): T & { propterid?: string; crossReferenceId?: string; logId?: string } {
  const result = { ...obj } as T & { propterid?: string; crossReferenceId?: string; logId?: string };

  if (options.propterid) {
    if (typeof options.propterid === 'string') {
      result.propterid = options.propterid;
    } else {
      result.propterid = generatePropterid(options.propterid.type, options.propterid.context);
    }
  }

  if (options.crossReferenceId) {
    if (typeof options.crossReferenceId === 'string') {
      result.crossReferenceId = options.crossReferenceId;
    } else {
      result.crossReferenceId = generateCrossReferenceId(
        options.crossReferenceId.source,
        options.crossReferenceId.target,
        options.crossReferenceId.relationship
      );
    }
  }

  if (options.logId) {
    if (typeof options.logId === 'string') {
      result.logId = options.logId;
    } else {
      result.logId = generateLogId(options.logId.component, options.logId.operation);
    }
  }

  return result;
}

/**
 * Create a fully identified object with all common properties
 */
export function createIdentifiedObject<T extends Record<string, any>>(
  obj: T,
  type: string,
  component: string,
  operation: string,
  context?: string
): T & { propterid: string; crossReferenceId?: string; logId: string } {
  const result = addCommonIdentifiers(obj, {
    propterid: { type, context },
    logId: { component, operation }
  }) as T & { propterid: string; crossReferenceId?: string; logId: string };

  // Ensure required properties are present
  if (!result.propterid) {
    result.propterid = generatePropterid(type, context);
  }
  if (!result.logId) {
    result.logId = generateLogId(component, operation);
  }

  return result;
}

/**
 * Extract identifiers from an object for logging or debugging
 */
export function extractIdentifiers(obj: any): {
  propterid?: string;
  crossReferenceId?: string;
  logId?: string;
} {
  return {
    propterid: obj.propterid,
    crossReferenceId: obj.crossReferenceId,
    logId: obj.logId
  };
}

/**
 * Check if an object has common identifiers
 */
export function hasCommonIdentifiers(obj: any): boolean {
  return !!(obj.propterid || obj.crossReferenceId || obj.logId);
}

/**
 * Validate identifier format
 */
export function validateIdentifier(id: string, type: 'propterid' | 'crossReferenceId' | 'logId'): boolean {
  const patterns = {
    propterid: /^[\w-]+-\d+(-[\w-]+)?$/,
    crossReferenceId: /^xref-[\w-]+-[\w-]+-[\w-]+-[a-f0-9]{8}$/,
    logId: /^log-[\w-]+-[\w-]+-[a-f0-9]{8}$/
  };

  return patterns[type].test(id);
}