// packages/odds-core/src/utils/test-time-helpers.ts - Date/Time Testing Utilities

import { setSystemTime, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";

/**
 * Time testing configuration
 */
export interface TimeTestConfig {
  fixedDate?: Date;
  timezone?: string;
  useFakeTimers?: boolean;
  autoReset?: boolean;
}

/**
 * Time testing helper class
 */
export class TimeTestHelper {
  private originalDate: typeof Date;
  private originalNow: typeof Date.now;
  private timezone?: string;
  private config: TimeTestConfig;

  constructor(config: TimeTestConfig = {}) {
    this.config = {
      autoReset: true,
      useFakeTimers: false,
      ...config
    };
    
    this.originalDate = Date;
    this.originalNow = Date.now;
  }

  /**
   * Setup fixed time for testing
   */
  setupFixedTime(date: Date | string): void {
    const fixedDate = typeof date === 'string' ? new Date(date) : date;
    setSystemTime(fixedDate);
  }

  /**
   * Setup timezone for testing
   */
  setupTimezone(timezone: string): void {
    this.timezone = timezone;
    Bun.env.TZ = timezone;
  }


  /**
   * Reset all time modifications
   */
  reset(): void {
    setSystemTime(); // Reset to real time
    if (this.timezone) {
      delete Bun.env.TZ;
    }
  }

  /**
   * Get current mocked time (Bun only)
   */
  getCurrentTime(): number {
    return Date.now();
  }

  /**
   * Note: Time advancement requires external implementation
   * Bun doesn't have built-in timer advancement like Jest
   */
  advanceTime(ms: number): void {
    console.warn('Time advancement not available in Bun - use setSystemTime() for specific time points');
  }

  /**
   * Setup complete test environment
   */
  setupEnvironment(): void {
    if (this.config.fixedDate) {
      this.setupFixedTime(this.config.fixedDate);
    }
    if (this.config.timezone) {
      this.setupTimezone(this.config.timezone);
    }
  }

  /**
   * Create lifecycle hooks for automatic setup/teardown
   */
  createLifecycleHooks() {
    return {
      beforeAll: () => {
        this.setupEnvironment();
      },
      afterAll: () => {
        if (this.config.autoReset) {
          this.reset();
        }
      },
      beforeEach: () => {
        // Re-setup before each test to ensure consistency
        this.setupEnvironment();
      },
      afterEach: () => {
        if (this.config.autoReset) {
          this.reset();
          this.setupEnvironment(); // Re-setup for next test
        }
      }
    };
  }
}

/**
 * Predefined test dates for consistent testing
 */
export const TEST_DATES = {
  Y2020_START: new Date("2020-01-01T00:00:00.000Z"),
  Y2023_START: new Date("2023-01-01T00:00:00.000Z"),
  Y2024_START: new Date("2024-01-01T00:00:00.000Z"),
  MARKET_OPEN: new Date("2024-01-15T09:30:00.000Z"), // Monday market open
  MARKET_CLOSE: new Date("2024-01-15T16:00:00.000Z"), // Monday market close
  WEEKEND: new Date("2024-01-13T12:00:00.000Z"), // Saturday
  FUTURE_DATE: new Date("2025-01-01T00:00:00.000Z"),
  PAST_DATE: new Date("2022-01-01T00:00:00.000Z")
} as const;

/**
 * Predefined timezones for testing
 */
export const TEST_TIMEZONES = {
  UTC: 'UTC',
  NEW_YORK: 'America/New_York',
  LOS_ANGELES: 'America/Los_Angeles',
  LONDON: 'Europe/London',
  TOKYO: 'Asia/Tokyo',
  SYDNEY: 'Australia/Sydney'
} as const;

/**
 * Quick setup functions for common scenarios
 */

/**
 * Setup standard business time testing
 */
export function setupBusinessTimeTesting() {
  const helper = new TimeTestHelper({
    fixedDate: TEST_DATES.MARKET_OPEN,
    timezone: TEST_TIMEZONES.NEW_YORK,
    autoReset: true
  });

  const hooks = helper.createLifecycleHooks();
  beforeAll(hooks.beforeAll);
  afterAll(hooks.afterAll);
  beforeEach(hooks.beforeEach);
  afterEach(hooks.afterEach);

  return helper;
}

/**
 * Setup UTC time testing
 */
export function setupUTCTimeTesting(date?: Date) {
  const helper = new TimeTestHelper({
    fixedDate: date || TEST_DATES.Y2024_START,
    timezone: TEST_TIMEZONES.UTC,
    autoReset: true
  });

  const hooks = helper.createLifecycleHooks();
  beforeAll(hooks.beforeAll);
  afterAll(hooks.afterAll);
  beforeEach(hooks.beforeEach);
  afterEach(hooks.afterEach);

  return helper;
}

/**
 * Setup fake timers for time-advancement testing
 */
export function setupFixedTimeTesting(startDate?: Date) {
  const helper = new TimeTestHelper({
    fixedDate: startDate || TEST_DATES.Y2024_START,
    timezone: TEST_TIMEZONES.UTC,
    autoReset: true
  });

  const hooks = helper.createLifecycleHooks();
  beforeAll(hooks.beforeAll);
  afterAll(hooks.afterAll);
  beforeEach(hooks.beforeEach);
  afterEach(hooks.afterEach);

  return helper;
}

/**
 * Metadata-specific time testing utilities
 */

/**
 * Create test metadata with consistent timestamps
 */
export function createTestMetadataWithTimestamp(
  id: string,
  timestampOffset: number = 0,
  baseDate: Date = TEST_DATES.Y2024_START
) {
  const timestamp = baseDate.getTime() + timestampOffset;
  
  return {
    id,
    timestamp,
    version: '1.0.0',
    source: { provider: 'test', reliability: 0.9 },
    market: { session: 'test', liquidity: 'high' },
    topics: [],
    category: 'market_data' as any,
    tags: ['test'],
    quality: { 
      overall: 0.85, 
      completeness: 0.9, 
      accuracy: 0.8, 
      freshness: 0.9, 
      consistency: 0.85, 
      validity: 0.9 
    },
    realtime: {
      lastUpdated: timestamp,
      updateFrequency: 1,
      dataFreshness: 0.9,
      streamId: `test_stream_${id}`,
      timestamp
    },
    stream: {
      source: 'test',
      latency: 25,
      isLive: true,
      quality: {
        bandwidth: 1000,
        packetLoss: 0,
        jitter: 0,
        reliability: 0.95,
        status: 'excellent'
      }
    }
  };
}

/**
 * Create a series of test metadata with time progression
 */
export function createTimeSeriesMetadata(
  baseId: string,
  count: number,
  intervalMs: number = 1000,
  startDate: Date = TEST_DATES.Y2024_START
) {
  return Array.from({ length: count }, (_, i) => 
    createTestMetadataWithTimestamp(
      `${baseId}_${i}`,
      i * intervalMs,
      startDate
    )
  );
}

/**
 * Test time-based lifecycle operations
 */
export class LifecycleTimeTester {
  private helper: TimeTestHelper;

  constructor(config: TimeTestConfig = {}) {
    this.helper = new TimeTestHelper(config);
  }

  /**
   * Test metadata aging scenarios
   */
  testAgingScenarios() {
    const scenarios = [
      { name: 'fresh', age: 0, expectedState: 'active' },
      { name: 'middle-aged', age: 7 * 24 * 60 * 60 * 1000, expectedState: 'active' }, // 7 days
      { name: 'old', age: 30 * 24 * 60 * 60 * 1000, expectedState: 'deprecated' }, // 30 days
      { name: 'very-old', age: 90 * 24 * 60 * 60 * 1000, expectedState: 'archived' } // 90 days
    ];

    return scenarios.map(scenario => ({
      ...scenario,
      testDate: new Date(TEST_DATES.Y2024_START.getTime() + scenario.age),
      metadata: createTestMetadataWithTimestamp(
        `test_${scenario.name}`,
        -scenario.age, // Negative offset to create "old" metadata
        TEST_DATES.Y2024_START
      )
    }));
  }

  /**
   * Test time-based transitions
   */
  testTimeBasedTransitions() {
    this.helper.setupEnvironment();
    
    const transitions = [
      { from: 'created', to: 'active', delay: 0 },
      { from: 'active', to: 'deprecated', delay: 30 * 24 * 60 * 60 * 1000 },
      { from: 'deprecated', to: 'archiving', delay: 7 * 24 * 60 * 60 * 1000 },
      { from: 'archiving', to: 'archived', delay: 5 * 60 * 1000 }
    ];

    return transitions;
  }
}

/**
 * Assertion helpers for time-based tests
 */
export class TimeAssertions {
  /**
   * Assert metadata is within expected age range
   */
  static assertMetadataAge(
    metadata: any,
    maxAgeMs: number,
    currentTime: number = Date.now()
  ) {
    const age = currentTime - metadata.timestamp;
    expect(age).toBeLessThanOrEqual(maxAgeMs);
  }

  /**
   * Assert timestamp progression
   */
  static assertTimestampProgression(
    metadataList: any[],
    intervalMs: number,
    toleranceMs: number = 100
  ) {
    for (let i = 1; i < metadataList.length; i++) {
      const actualInterval = metadataList[i].timestamp - metadataList[i-1].timestamp;
      expect(Math.abs(actualInterval - intervalMs)).toBeLessThanOrEqual(toleranceMs);
    }
  }

  /**
   * assert timezone behavior
   */
  static assertTimezoneBehavior(
    date: Date,
    expectedTimezone: string,
    expectedOffset?: number
  ) {
    expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(expectedTimezone);
    
    if (expectedOffset !== undefined) {
      expect(date.getTimezoneOffset()).toBe(expectedOffset);
    }
  }
}
