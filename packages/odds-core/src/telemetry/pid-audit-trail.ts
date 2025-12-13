/**
 * @fileoverview PID Audit Trail System
 * @description Immutable audit trail for all PID operations with cryptographic integrity
 * @author Odds Protocol Team
 * @version 1.0.0
 * @since 2024
 *
 * @see {@link MarketTelemetry} - Generates audit events for all telemetry operations
 * @see {@link PIDContext} - Provides process context for audit entries
 * @see {@link IntegrityError} - Cryptographic verification error handling
 * @see {@link rapidHash} - Cryptographic hashing for integrity verification
 * @see {@link AuditEntry} - Audit entry data structure
 */

/**
 * [CORE][TELEMETRY][CLASS][META:{singleton,audit}][PIDAuditTrail][#REF:PIDContext,TelemetryEvent,IntegrityError]
 *
 * Immutable audit trail for all PID operations
 * Every telemetry event is logged with cryptographic integrity
 */

import { generateId, rapidHash } from '../utils/index-streamlined';
import { PIDContext } from './pid-context';
import type {
  TelemetryEvent,
  TelemetryContext
} from './telemetry-types';
import { IntegrityError } from './telemetry-types';

export interface AuditEntry {
  id: string;
  timestamp: number;
  pid: number;
  event: string;
  data: any;
  context?: TelemetryContext;
  integrity_hash: string;
  sequence_number: number;
}

export class PIDAuditTrail {
  private static instance: PIDAuditTrail;
  private readonly entries: AuditEntry[] = [];
  private sequenceCounter = 0;
  private readonly maxEntries = 10000; // Keep last 10k entries in memory

  static getInstance(): PIDAuditTrail {
    if (!PIDAuditTrail.instance) {
      PIDAuditTrail.instance = new PIDAuditTrail();
    }
    return PIDAuditTrail.instance;
  }

  /**
   * Record an audit event with integrity verification
   */
  record(
    pid: number,
    event: string,
    data: any,
    context?: TelemetryContext
  ): AuditEntry {
    const entry: AuditEntry = {
      id: generateId('audit'),
      timestamp: Date.now(),
      pid,
      event,
      data,
      context,
      integrity_hash: '',
      sequence_number: ++this.sequenceCounter
    };

    // Generate integrity hash
    entry.integrity_hash = this.computeIntegrityHash(entry);

    // Add to in-memory store
    this.entries.push(entry);

    // Maintain size limit
    if (this.entries.length > this.maxEntries) {
      this.entries.shift(); // Remove oldest
    }

    // Log to console for development
    console.log(`[AUDIT][PID:${pid}] ${event}`, {
      id: entry.id,
      sequence: entry.sequence_number,
      context: context?.requestId
    });

    return entry;
  }

  /**
   * Verify integrity of an audit entry
   */
  verifyIntegrity(entry: AuditEntry): boolean {
    const expectedHash = this.computeIntegrityHash(entry);
    return expectedHash === entry.integrity_hash;
  }

  /**
   * Get audit entries for a specific PID
   */
  getEntriesForPid(pid: number, limit = 100): AuditEntry[] {
    return this.entries
      .filter(entry => entry.pid === pid)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get audit entries by event type
   */
  getEntriesByEvent(event: string, limit = 100): AuditEntry[] {
    return this.entries
      .filter(entry => entry.event === event)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get audit entries within time range
   */
  getEntriesInRange(startTime: number, endTime: number): AuditEntry[] {
    return this.entries.filter(
      entry => entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  /**
   * Get audit entries by request ID
   */
  getEntriesByRequestId(requestId: string): AuditEntry[] {
    return this.entries.filter(
      entry => entry.context?.requestId === requestId
    );
  }

  /**
   * Export audit trail to JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      metadata: {
        export_timestamp: Date.now(),
        total_entries: this.entries.length,
        sequence_range: {
          min: Math.min(...this.entries.map(e => e.sequence_number)),
          max: Math.max(...this.entries.map(e => e.sequence_number))
        }
      },
      entries: this.entries
    }, null, 2);
  }

  /**
   * Import audit trail from JSON
   */
  importFromJSON(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      // Verify integrity of imported entries
      for (const entry of data.entries) {
        if (!this.verifyIntegrity(entry)) {
          throw new IntegrityError(
            `Integrity check failed for audit entry ${entry.id}`,
            { entry }
          );
        }
      }

      // Merge entries
      this.entries.push(...data.entries);

      // Sort by sequence number
      this.entries.sort((a, b) => a.sequence_number - b.sequence_number);

      // Update sequence counter
      if (this.entries.length > 0) {
        this.sequenceCounter = Math.max(
          this.sequenceCounter,
          this.entries[this.entries.length - 1].sequence_number
        );
      }

      // Maintain size limit
      if (this.entries.length > this.maxEntries) {
        this.entries.splice(0, this.entries.length - this.maxEntries);
      }

    } catch (error) {
      throw new IntegrityError(
        `Failed to import audit trail: ${(error as Error).message}`,
        { jsonData: jsonData.substring(0, 100) }
      );
    }
  }

  /**
   * Clear audit trail (for testing only)
   */
  clear(): void {
    this.entries.length = 0;
    this.sequenceCounter = 0;
  }

  /**
   * Get audit statistics
   */
  getStatistics(): {
    totalEntries: number;
    entriesByPid: Record<number, number>;
    entriesByEvent: Record<string, number>;
    timeRange: { start: number; end: number };
  } {
    const entriesByPid: Record<number, number> = {};
    const entriesByEvent: Record<string, number> = {};

    for (const entry of this.entries) {
      entriesByPid[entry.pid] = (entriesByPid[entry.pid] || 0) + 1;
      entriesByEvent[entry.event] = (entriesByEvent[entry.event] || 0) + 1;
    }

    const timestamps = this.entries.map(e => e.timestamp);
    const timeRange = {
      start: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      end: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };

    return {
      totalEntries: this.entries.length,
      entriesByPid,
      entriesByEvent,
      timeRange
    };
  }

  /**
   * Compute integrity hash for audit entry
   */
  private computeIntegrityHash(entry: Omit<AuditEntry, 'integrity_hash'>): string {
    // Create canonical representation
    const canonical = {
      id: entry.id,
      timestamp: entry.timestamp,
      pid: entry.pid,
      event: entry.event,
      data: JSON.stringify(entry.data),
      context: entry.context ? JSON.stringify(entry.context) : '',
      sequence_number: entry.sequence_number
    };

    return rapidHash(JSON.stringify(canonical)).toString(16);
  }
}

// Export singleton instance
export const AuditTrail = PIDAuditTrail.getInstance();