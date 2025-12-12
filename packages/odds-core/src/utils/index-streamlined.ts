// packages/odds-core/src/utils/index-streamlined.ts - Streamlined utilities for synthetic arbitrage

// ===== CORE UTILITIES =====
export {
    cleanInput,
    rapidHash,
    generateId,
    americanToImpliedProbability,
    calculateArbitrageEdge,
    calculateTickVelocity,
    // validateOddsTick - not exported from utils
    getMemoryStats,
    forceGarbageCollection
} from '../utils';

// ===== SYNTHETIC ARBITRAGE CORE =====
// Note: These imports have broken @odds-core/* aliases - import directly from the source files
// export { SyntheticArbitrageDetector, SyntheticArbitrageDetectorFactory } from '../detectors/synthetic-arbitrage-detector';
// export type { DetectionCriteria, DetectionResult, MarketOpportunity } from '../detectors/synthetic-arbitrage-detector';

// ===== MULTI-PERIOD PROCESSING =====
// Note: These imports have broken @odds-core/* aliases - import directly from the source files
// export { MultiPeriodStreamProcessor, MultiPeriodStreamProcessorFactory } from '../processors/multi-period-stream-processor';
// export type { MultiPeriodMarketStream, PeriodSyntheticArbitrage, StreamProcessorConfig, ProcessingMetrics } from '../processors/multi-period-stream-processor';

// ===== POSITION TRACKING & RISK MANAGEMENT =====
// Note: These imports have broken @odds-core/* aliases - import directly from the source files
// export { SyntheticPositionTracker, SyntheticPositionTrackerFactory } from '../trackers/synthetic-position-tracker';
// export type { SyntheticPosition, PortfolioMetrics, RiskAlert, PositionTrackerConfig } from '../trackers/synthetic-position-tracker';

// ===== COVARIANCE MATRIX & HEDGE CALCULATION =====
export {
    CovarianceMatrixCalculator,
    HistoricalDataFactory
} from './covariance-matrix';

export type {
    HistoricalDataPoint,
    CovarianceMatrixResult,
    HedgeRatioResult,
    CovariancePerformanceMetrics
} from './covariance-matrix';

// ===== ROTATION NUMBER UTILITIES =====
export {
    RotationNumberUtils
    // RotationNumberRegistry - not exported from rotation-utils
} from './rotation-utils';

// ===== METADATA VALIDATION (ENHANCED) =====
export {
    MetadataBuilder,
    TopicAnalyzer,
    QualityAssessor,
    MetadataValidator,
    MetadataUtils
} from './metadata';

export type {
    ValidationRule,
    ValidationSchema,
    ValidationResult,
    ValidationContext
} from './metadata';

// ===== PERFORMANCE MONITORING =====
export {
    PerformanceMonitor,
    PerformanceBenchmark,
    PerformanceCache,
    PerformanceUtils
} from './performance';

// ===== REAL-TIME PROCESSING =====
export {
    RealtimeMetadataStream,
    RealtimeEventEmitter
    // RealtimeMetadataProcessor - not exported from realtime-stream
} from './realtime-stream';

// ===== PREDICTIVE ANALYTICS =====
export {
    PredictiveAnalyticsEngine
} from './predictive-analytics';

// ===== FACTORY FUNCTIONS =====
// Note: Factory imports moved to @odds-protocol/testing package
// Import directly: import { SyntheticArbitrageV1Factory, ... } from '@odds-protocol/testing';

// ===== CONFIGURATION & CONSTANTS =====
export { DEFAULTS, PERFORMANCE_THRESHOLDS } from '../constants';

// ===== UTILITY CLASSES =====
export {
    LazyQualityAssessor,
    QuickQualityAssessor,
    QualityAssessorFactory
} from './lazy-quality';

export {
    TopicMapper,
    TopicValidator,
    TopicAnalysisService,
    TopicServiceFactory
} from './topic-services';

// ===== TESTING UTILITIES =====
export {
    TimeTestHelper,
    LifecycleTimeTester,
    TimeAssertions,
    TEST_DATES,
    setupBusinessTimeTesting,
    setupUTCTimeTesting,
    createTestMetadataWithTimestamp
} from './test-time-helpers';
