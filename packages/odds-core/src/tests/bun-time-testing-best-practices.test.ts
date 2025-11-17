// packages/odds-core/src/tests/bun-time-testing-best-practices.test.ts - Bun Date/Time Testing Examples

import { test, describe, expect, beforeAll, afterAll, beforeEach, afterEach, setSystemTime, jest } from 'bun:test';
import { 
  TimeTestHelper,
  TEST_DATES,
  TEST_TIMEZONES,
  setupBusinessTimeTesting,
  setupUTCTimeTesting,
  setupFakeTimerTesting,
  createTestMetadataWithTimestamp,
  createTimeSeriesMetadata,
  LifecycleTimeTester,
  TimeAssertions
} from '../utils/test-time-helpers';
import { MetadataLifecycleManager } from '../utils/lifecycle-manager';
import { InMemoryLifecycleStorage } from '../utils/lifecycle-storage';
import { MetadataLifecycleState } from '../types/lifecycle';

describe('Bun Date/Time Testing Best Practices', () => {

  describe('1. Basic setSystemTime Usage', () => {
    test('should set fixed time for deterministic tests', () => {
      // Setup specific date
      const testDate = new Date('2024-01-15T09:30:00.000Z');
      setSystemTime(testDate);

      // Test deterministic behavior
      const now = new Date();
      expect(now.getFullYear()).toBe(2024);
      expect(now.getMonth()).toBe(0); // January
      expect(now.getDate()).toBe(15);
      expect(now.getHours()).toBe(9);
      expect(now.getMinutes()).toBe(30);

      // Reset after test
      setSystemTime();
    });

    test('should handle timestamp consistency', () => {
      const testDate = new Date('2024-01-15T09:30:00.000Z');
      setSystemTime(testDate);

      const timestamp1 = Date.now();
      const timestamp2 = new Date().getTime();
      const timestamp3 = testDate.getTime();

      expect(timestamp1).toBe(timestamp2);
      expect(timestamp2).toBe(timestamp3);

      setSystemTime();
    });
  });

  describe('2. Jest Compatibility Functions', () => {
    test('should use jest.useFakeTimers() and jest.setSystemTime()', () => {
      // Use Jest-compatible fake timers
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));

      expect(new Date().getFullYear()).toBe(2020);
      expect(Date.now()).toBe(1577836800000); // Jan 1, 2020 timestamp
      expect(jest.now()).toBe(1577836800000); // Same value

      // Reset timers
      jest.useRealTimers();
    });

    test('should preserve Date constructor in Bun (unlike Jest)', () => {
      const OriginalDate = Date;
      const OriginalNow = Date.now;

      jest.useFakeTimers();
      
      // In Bun, Date constructor doesn't change (unlike Jest)
      expect(Date).toBe(OriginalDate);
      expect(Date.now).toBe(OriginalNow);

      jest.useRealTimers();
    });

    test('should advance time with fake timers', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const initialTime = jest.now();
      expect(initialTime).toBe(1704067200000); // Jan 1, 2024

      // Advance time by 1 hour
      jest.advanceTimersByTime(60 * 60 * 1000);
      
      expect(jest.now()).toBe(initialTime + 60 * 60 * 1000);
      expect(new Date().getHours()).toBe(1);

      jest.useRealTimers();
    });
  });

  describe('3. Timezone Testing', () => {
    test('should handle timezone changes at runtime', () => {
      // Test New York timezone
      process.env.TZ = 'America/New_York';
      expect(new Date().getTimezoneOffset()).toBe(240); // EST offset (UTC-4 in summer)
      expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/New_York');

      // Test Los Angeles timezone
      process.env.TZ = 'America/Los_Angeles';
      expect(new Date().getTimezoneOffset()).toBe(420); // PST offset (UTC-7 in summer)
      expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles');
    });

    test('should test timezone-dependent business logic', () => {
      setSystemTime(new Date('2024-01-15T14:30:00.000Z')); // 2:30 PM UTC
      
      // New York time should be 9:30 AM (market open)
      process.env.TZ = 'America/New_York';
      const nyTime = new Date();
      expect(nyTime.getHours()).toBe(9); // 9:30 AM in NY
      
      // London time should be 2:30 PM
      process.env.TZ = 'Europe/London';
      const londonTime = new Date();
      expect(londonTime.getHours()).toBe(14); // 2:30 PM in London
    });
  });

  describe('4. TimeTestHelper Usage', () => {
    let timeHelper: TimeTestHelper;

    beforeEach(() => {
      timeHelper = new TimeTestHelper({
        fixedDate: TEST_DATES.Y2024_START,
        timezone: TEST_TIMEZONES.UTC,
        autoReset: true
      });
    });

    test('should setup complete test environment', () => {
      timeHelper.setupEnvironment();
      
      const now = new Date();
      expect(now.getFullYear()).toBe(2024);
      expect(now.getMonth()).toBe(0);
      expect(now.getDate()).toBe(1);
      
      expect(process.env.TZ).toBe('UTC');
    });

    test('should reset environment properly', () => {
      timeHelper.setupEnvironment();
      expect(new Date().getFullYear()).toBe(2024);
      
      timeHelper.reset();
      expect(new Date().getFullYear()).toBeGreaterThan(2024); // Back to real time
    });

    test('should create lifecycle hooks automatically', () => {
      const hooks = timeHelper.createLifecycleHooks();
      
      expect(hooks.beforeAll).toBeInstanceOf(Function);
      expect(hooks.afterAll).toBeInstanceOf(Function);
      expect(hooks.beforeEach).toBeInstanceOf(Function);
      expect(hooks.afterEach).toBeInstanceOf(Function);
    });
  });

  describe('5. Predefined Setup Functions', () => {
    test('setupBusinessTimeTesting should configure market hours', () => {
      const helper = setupBusinessTimeTesting();
      
      // Should be set to market open time in New York
      const now = new Date();
      expect(now.getHours()).toBe(9); // 9:30 AM rounded
      expect(now.getMinutes()).toBe(30);
      expect(process.env.TZ).toBe('America/New_York');
    });

    test('setupUTCTimeTesting should configure UTC', () => {
      const helper = setupUTCTimeTesting();
      
      const now = new Date();
      expect(now.getFullYear()).toBe(2024);
      expect(process.env.TZ).toBe('UTC');
    });

    test('setupFakeTimerTesting should enable time advancement', () => {
      const helper = setupFakeTimerTesting();
      
      const initialTime = jest.now();
      jest.advanceTimersByTime(5000); // 5 seconds
      
      expect(jest.now()).toBe(initialTime + 5000);
    });
  });

  describe('6. Metadata-Specific Time Testing', () => {
    beforeEach(() => {
      setSystemTime(TEST_DATES.Y2024_START);
    });

    afterEach(() => {
      setSystemTime();
    });

    test('should create test metadata with consistent timestamps', () => {
      const metadata = createTestMetadataWithTimestamp('test_1', 1000);
      
      expect(metadata.timestamp).toBe(TEST_DATES.Y2024_START.getTime() + 1000);
      expect(metadata.realtime.lastUpdated).toBe(metadata.timestamp);
      expect(metadata.realtime.timestamp).toBe(metadata.timestamp);
    });

    test('should create time series metadata with progression', () => {
      const series = createTimeSeriesMetadata('series', 5, 1000);
      
      expect(series).toHaveLength(5);
      
      series.forEach((item, index) => {
        expect(item.id).toBe(`series_${index}`);
        expect(item.timestamp).toBe(TEST_DATES.Y2024_START.getTime() + (index * 1000));
      });
      
      // Test timestamp progression
      TimeAssertions.assertTimestampProgression(series, 1000);
    });
  });

  describe('7. Lifecycle Time Testing', () => {
    let lifecycleManager: MetadataLifecycleManager;
    let storage: InMemoryLifecycleStorage;
    let timeTester: LifecycleTimeTester;

    beforeEach(() => {
      storage = new InMemoryLifecycleStorage();
      lifecycleManager = new MetadataLifecycleManager(storage);
      timeTester = new LifecycleTimeTester({
        fixedDate: TEST_DATES.Y2024_START,
        timezone: TEST_TIMEZONES.UTC
      });
    });

    afterEach(async () => {
      if (lifecycleManager) {
        await lifecycleManager.stop();
      }
      setSystemTime();
    });

    test('should test aging scenarios', () => {
      const scenarios = timeTester.testAgingScenarios();
      
      scenarios.forEach(scenario => {
        expect(scenario.testDate).toBeInstanceOf(Date);
        expect(scenario.metadata).toBeDefined();
        expect(scenario.name).toBeDefined();
        expect(scenario.expectedState).toBeDefined();
      });
    });

    test('should handle time-based lifecycle transitions', async () => {
      await lifecycleManager.start();
      
      const metadata = createTestMetadataWithTimestamp('lifecycle_test');
      const lifecycle = await lifecycleManager.createLifecycle(metadata);
      
      // Test initial state
      expect(lifecycle.currentState).toBe(MetadataLifecycleState.ACTIVE);
      
      // Test time-based assertions
      TimeAssertions.assertMetadataAge(metadata, 1000, TEST_DATES.Y2024_START.getTime());
      
      await lifecycleManager.stop();
    });
  });

  describe('8. Advanced Time Testing Patterns', () => {
    test('should test time-based business rules', () => {
      // Test market hours detection
      const marketOpen = new Date('2024-01-15T09:30:00.000Z');
      const marketClose = new Date('2024-01-15T16:00:00.000Z');
      const afterHours = new Date('2024-01-15T18:00:00.000Z');
      const weekend = new Date('2024-01-13T12:00:00.000Z');

      const isMarketHours = (date: Date) => {
        const hours = date.getUTCHours();
        const day = date.getUTCDay();
        return day >= 1 && day <= 5 && hours >= 14 && hours < 21; // 9:30 AM - 4:00 PM EST in UTC
      };

      setSystemTime(marketOpen);
      expect(isMarketHours(new Date())).toBe(true);

      setSystemTime(marketClose);
      expect(isMarketHours(new Date())).toBe(false); // Exactly close time

      setSystemTime(afterHours);
      expect(isMarketHours(new Date())).toBe(false);

      setSystemTime(weekend);
      expect(isMarketHours(new Date())).toBe(false);

      setSystemTime();
    });

    test('should test time-based cache expiration', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      interface CacheItem<T> {
        data: T;
        expiresAt: number;
      }

      class TimedCache<T> {
        private cache = new Map<string, CacheItem<T>>();

        set(key: string, data: T, ttlMs: number): void {
          this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlMs
          });
        }

        get(key: string): T | null {
          const item = this.cache.get(key);
          if (!item) return null;
          
          if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
          }
          
          return item.data;
        }
      }

      const cache = new TimedCache<string>();
      cache.set('test', 'value', 5000); // 5 second TTL

      // Should be available immediately
      expect(cache.get('test')).toBe('value');

      // Advance time by 6 seconds
      jest.advanceTimersByTime(6000);

      // Should be expired
      expect(cache.get('test')).toBeNull();

      jest.useRealTimers();
    });

    test('should test time-based rate limiting', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      class RateLimiter {
        private requests: number[] = [];
        private readonly maxRequests: number;
        private readonly windowMs: number;

        constructor(maxRequests: number, windowMs: number) {
          this.maxRequests = maxRequests;
          this.windowMs = windowMs;
        }

        canMakeRequest(): boolean {
          const now = Date.now();
          this.requests = this.requests.filter(time => now - time < this.windowMs);
          
          if (this.requests.length < this.maxRequests) {
            this.requests.push(now);
            return true;
          }
          
          return false;
        }
      }

      const rateLimiter = new RateLimiter(5, 60000); // 5 requests per minute

      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.canMakeRequest()).toBe(true);
      }

      // 6th request should be denied
      expect(rateLimiter.canMakeRequest()).toBe(false);

      // Advance time by 1 minute
      jest.advanceTimersByTime(60000);

      // Should allow requests again
      expect(rateLimiter.canMakeRequest()).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('9. Performance Testing with Time', () => {
    test('should benchmark time-sensitive operations', () => {
      setSystemTime(TEST_DATES.Y2024_START);

      const startTime = performance.now();
      
      // Simulate time-sensitive operation
      const results = Array.from({ length: 1000 }, (_, i) => {
        const metadata = createTestMetadataWithTimestamp(`perf_${i}`, i * 10);
        return metadata.timestamp;
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(results).toHaveLength(1000);
      expect(processingTime).toBeLessThan(100); // Should process in under 100ms
      expect(results[999]).toBe(TEST_DATES.Y2024_START.getTime() + 9990);

      setSystemTime();
    });
  });

  describe('10. Error Handling and Edge Cases', () => {
    test('should handle invalid dates gracefully', () => {
      expect(() => {
        setSystemTime(new Date('invalid'));
      }).toThrow();

      // Should still work after error
      setSystemTime(TEST_DATES.Y2024_START);
      expect(new Date().getFullYear()).toBe(2024);
      setSystemTime();
    });

    test('should handle timezone edge cases', () => {
      // Test invalid timezone
      process.env.TZ = 'Invalid/Timezone';
      
      // Should not crash, but may not work as expected
      const date = new Date();
      expect(date).toBeInstanceOf(Date);

      // Reset to valid timezone
      process.env.TZ = 'UTC';
      expect(new Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('UTC');
    });

    test('should handle timer edge cases', () => {
      jest.useFakeTimers();
      
      // Test very large time advancement
      jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
      const initialTime = jest.now();
      
      jest.advanceTimersByTime(Number.MAX_SAFE_INTEGER);
      
      // Should handle gracefully (may wrap around or error)
      const finalTime = jest.now();
      expect(typeof finalTime).toBe('number');

      jest.useRealTimers();
    });
  });
});
