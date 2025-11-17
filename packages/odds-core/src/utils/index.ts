// Utility functions
export { formatTimestamp } from './time';
export { calculateSpread } from './math';
export { compressMessage } from './compression';
export { generateId } from './id';

// Metadata utilities
export { 
  MetadataBuilder, 
  TopicAnalyzer, 
  QualityAssessor, 
  MetadataValidator,
  MetadataUtils 
} from './metadata';

// Performance and single responsibility utilities
export {
  LazyQualityAssessor,
  QuickQualityAssessor,
  QualityAssessorFactory,
  LazyQualityUtils
} from './lazy-quality';

export {
  TopicMapper,
  TopicValidator,
  TopicAnalysisService,
  TopicServiceFactory,
  TopicServiceUtils
} from './topic-services';

// Polished utilities with comprehensive documentation
export {
  MetadataBuilder as DocumentedMetadataBuilder,
  TopicAnalyzer as DocumentedTopicAnalyzer
} from './documented-metadata';

// Defensive programming utilities
export {
  SafeTypeChecker,
  SafePropertyAccess,
  SafeArrayOperations,
  SafeStringOperations,
  SafeMathOperations,
  SafeObjectOperations,
  DefensiveMetadataWrapper
} from './defensive';

// Performance monitoring and benchmarking
export {
  PerformanceMonitor,
  PerformanceBenchmark,
  PerformanceCache,
  PerformanceUtils,
  performanceMonitor
} from './performance';
