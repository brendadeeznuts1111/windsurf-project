// packages/odds-core/src/utils/metadata.ts - Metadata handling utilities

import type {
    EnhancedMetadata,
    DataSource,
    MarketContext,
    DataQuality,
    ProcessingMetadata,
    TopicAnalysis
} from '../types/topics';

import {
    MarketTopic,
    DataCategory
} from '../types/topics';

/**
 * Metadata builder class for creating enhanced metadata
 */
export class MetadataBuilder {
    private metadata: Partial<EnhancedMetadata> = {};

    constructor(id?: string) {
        if (id) {
            this.metadata.id = id;
        }
    }

    /**
     * Set basic identification
     */
    setId(id: string): MetadataBuilder {
        this.metadata.id = id;
        return this;
    }

    setVersion(version: string): MetadataBuilder {
        this.metadata.version = version;
        return this;
    }

    setTimestamp(timestamp?: number): MetadataBuilder {
        this.metadata.timestamp = timestamp || Date.now();
        return this;
    }

    /**
     * Set data source information
     */
    setSource(source: DataSource): MetadataBuilder {
        this.metadata.source = source;
        return this;
    }

    /**
     * Set market context
     */
    setMarket(market: MarketContext): MetadataBuilder {
        this.metadata.market = market;
        return this;
    }

    /**
     * Set classification
     */
    setTopics(topics: MarketTopic[]): MetadataBuilder {
        this.metadata.topics = topics;
        return this;
    }

    setCategory(category: DataCategory): MetadataBuilder {
        this.metadata.category = category;
        return this;
    }

    setTags(tags: string[]): MetadataBuilder {
        this.metadata.tags = tags;
        return this;
    }

    /**
     * Set quality metrics
     */
    setQuality(quality: DataQuality): MetadataBuilder {
        this.metadata.quality = quality;
        return this;
    }

    /**
     * Set processing metadata
     */
    setProcessing(processing: ProcessingMetadata): MetadataBuilder {
        this.metadata.processing = processing;
        return this;
    }

    /**
     * Set business context
     */
    setBusiness(business: EnhancedMetadata['business']): MetadataBuilder {
        this.metadata.business = business;
        return this;
    }

    /**
     * Set technical metadata
     */
    setTechnical(technical: EnhancedMetadata['technical']): MetadataBuilder {
        this.metadata.technical = technical;
        return this;
    }

    /**
     * Set relationships
     */
    setRelationships(relationships: EnhancedMetadata['relationships']): MetadataBuilder {
        this.metadata.relationships = relationships;
        return this;
    }

    /**
     * Build the final metadata
     */
    build(): EnhancedMetadata {
        // Set defaults for required fields
        const metadata: EnhancedMetadata = {
            id: this.metadata.id || this.generateId(),
            timestamp: this.metadata.timestamp || Date.now(),
            version: this.metadata.version || '1.0.0',
            source: this.metadata.source || this.createDefaultSource(),
            market: this.metadata.market || this.createDefaultMarket(),
            topics: this.metadata.topics || [],
            category: this.metadata.category || DataCategory.MARKET_DATA,
            tags: this.metadata.tags || [],
            quality: this.metadata.quality || this.createDefaultQuality(),
            processing: this.metadata.processing || this.createDefaultProcessing(),
            business: this.metadata.business || this.createDefaultBusiness(),
            technical: this.metadata.technical || this.createDefaultTechnical(),
            relationships: this.metadata.relationships || this.createDefaultRelationships()
        };

        return metadata;
    }

    private generateId(): string {
        return `meta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private createDefaultSource(): DataSource {
        return {
            provider: 'unknown',
            feed: 'default',
            latency: 0,
            reliability: 0.5,
            lastUpdate: Date.now(),
            updateFrequency: 1000
        };
    }

    private createDefaultMarket(): MarketContext {
        return {
            session: 'regular' as any,
            liquidity: 'medium' as any,
            volatility: 'medium' as any,
            timeZone: 'UTC',
            marketHours: {
                open: '09:30',
                close: '16:00',
                currentStatus: 'closed'
            },
            relatedMarkets: [],
            correlatedSymbols: []
        };
    }

    private createDefaultQuality(): DataQuality {
        return {
            completeness: 0.5,
            accuracy: 0.5,
            freshness: 0,
            consistency: 0.5,
            validity: 0.5,
            overall: 0.5
        };
    }

    private createDefaultProcessing(): ProcessingMetadata {
        return {
            pipeline: [],
            enrichments: [],
            transformations: [],
            validation: [],
            processingTime: 0,
            version: '1.0.0'
        };
    }

    private createDefaultBusiness(): EnhancedMetadata['business'] {
        return {
            priority: 'medium',
            retention: 30,
            compliance: [],
            sensitivity: 'internal'
        };
    }

    private createDefaultTechnical(): EnhancedMetadata['technical'] {
        return {
            schema: 'unknown',
            encoding: 'utf-8',
            compression: 'none',
            size: 0,
            checksum: ''
        };
    }

    private createDefaultRelationships(): EnhancedMetadata['relationships'] {
        return {
            childIds: [],
            relatedIds: [],
            dependencies: []
        };
    }
}

/**
 * Topic analysis utilities
 */
export class TopicAnalyzer {
    /**
     * Analyze data to determine relevant topics
     */
    static analyzeTopics(data: any): TopicAnalysis {
        const topics = this.extractTopics(data);
        const primaryTopic = this.selectPrimaryTopic(topics);
        const secondaryTopics = topics.filter(t => t !== primaryTopic);
        const confidence = this.calculateTopicConfidence(data, primaryTopic);
        const reasoning = this.generateTopicReasoning(data, primaryTopic);

        return {
            primaryTopic,
            secondaryTopics,
            confidence,
            reasoning,
            detectedAt: Date.now()
        };
    }

    /**
     * Extract potential topics from data
     */
    private static extractTopics(data: any): MarketTopic[] {
        const topics: MarketTopic[] = [];

        // Extract from symbol
        if (data.symbol) {
            const symbolTopics = this.extractTopicsFromSymbol(data.symbol);
            topics.push(...symbolTopics);
        }

        // Extract from exchange
        if (data.exchange) {
            const exchangeTopics = this.extractTopicsFromExchange(data.exchange);
            topics.push(...exchangeTopics);
        }

        // Extract from other properties
        if (data.assetClass) {
            const assetTopics = this.extractTopicsFromAssetClass(data.assetClass);
            topics.push(...assetTopics);
        }

        return [...new Set(topics)]; // Remove duplicates
    }

    /**
     * Extract topics from symbol name
     */
    private static extractTopicsFromSymbol(symbol: string): MarketTopic[] {
        const topics: MarketTopic[] = [];
        const upperSymbol = symbol.toUpperCase();

        // Sports symbols
        if (upperSymbol.includes('NBA') || upperSymbol.includes('BASKETBALL')) {
            topics.push(MarketTopic.SPORTS_BASKETBALL);
        }
        if (upperSymbol.includes('NFL') || upperSymbol.includes('FOOTBALL')) {
            topics.push(MarketTopic.SPORTS_FOOTBALL);
        }
        if (upperSymbol.includes('MLB') || upperSymbol.includes('BASEBALL')) {
            topics.push(MarketTopic.SPORTS_BASEBALL);
        }
        if (upperSymbol.includes('NHL') || upperSymbol.includes('HOCKEY')) {
            topics.push(MarketTopic.SPORTS_HOCKEY);
        }

        // Crypto symbols
        if (upperSymbol.includes('BTC') || upperSymbol.includes('BITCOIN')) {
            topics.push(MarketTopic.CRYPTO_SPOT);
        }
        if (upperSymbol.includes('ETH') || upperSymbol.includes('ETHEREUM')) {
            topics.push(MarketTopic.CRYPTO_SPOT);
        }

        // Forex symbols
        if (upperSymbol.includes('USD') || upperSymbol.includes('EUR') || upperSymbol.includes('GBP')) {
            topics.push(MarketTopic.FOREX_MAJOR);
        }

        return topics;
    }

    /**
     * Extract topics from exchange name
     */
    private static extractTopicsFromExchange(exchange: string): MarketTopic[] {
        const topics: MarketTopic[] = [];
        const upperExchange = exchange.toUpperCase();

        if (upperExchange.includes('BINANCE') || upperExchange.includes('COINBASE')) {
            topics.push(MarketTopic.CRYPTO_SPOT);
        }
        if (upperExchange.includes('NYSE') || upperExchange.includes('NASDAQ')) {
            topics.push(MarketTopic.EQUITIES_US);
        }

        return topics;
    }

    /**
     * Extract topics from asset class
     */
    private static extractTopicsFromAssetClass(assetClass: string): MarketTopic[] {
        const topics: MarketTopic[] = [];
        const upperAssetClass = assetClass.toUpperCase();

        switch (upperAssetClass) {
            case 'CRYPTO':
                topics.push(MarketTopic.CRYPTO_SPOT);
                break;
            case 'EQUITIES':
            case 'STOCKS':
                topics.push(MarketTopic.EQUITIES_US);
                break;
            case 'FOREX':
                topics.push(MarketTopic.FOREX_MAJOR);
                break;
            case 'COMMODITIES':
                topics.push(MarketTopic.COMMODITY_ENERGY);
                break;
        }

        return topics;
    }

    /**
     * Select primary topic from list of topics
     */
    private static selectPrimaryTopic(topics: MarketTopic[]): MarketTopic {
        if (topics.length === 0) {
            return MarketTopic.SPORTS_BASKETBALL; // Default fallback
        }

        // Simple heuristic: return the first topic
        // In a real implementation, this could be more sophisticated
        return topics[0]!; // Non-null assertion since we check length
    }

    /**
     * Calculate confidence in topic assignment
     */
    private static calculateTopicConfidence(data: any, topic: MarketTopic): number {
        // Simple confidence calculation based on data completeness
        let confidence = 0.5; // Base confidence

        if (data.symbol) confidence += 0.2;
        if (data.exchange) confidence += 0.1;
        if (data.price) confidence += 0.1;
        if (data.volume) confidence += 0.1;

        return Math.min(confidence, 1.0);
    }

    /**
     * Generate reasoning for topic assignment
     */
    private static generateTopicReasoning(data: any, topic: MarketTopic): string {
        const reasons: string[] = [];

        if (data.symbol) {
            reasons.push(`symbol "${data.symbol}" indicates ${topic}`);
        }
        if (data.exchange) {
            reasons.push(`exchange "${data.exchange}" supports ${topic}`);
        }
        if (data.assetClass) {
            reasons.push(`asset class "${data.assetClass}" maps to ${topic}`);
        }

        return reasons.join('; ') || `default assignment to ${topic}`;
    }
}

/**
 * Quality assessment utilities
 */
export class QualityAssessor {
    /**
     * Assess data quality based on various metrics
     */
    static assessQuality(data: any): DataQuality {
        const completeness = this.assessCompleteness(data);
        const accuracy = this.assessAccuracy(data);
        const freshness = this.assessFreshness(data);
        const consistency = this.assessConsistency(data);
        const validity = this.assessValidity(data);

        const overall = (completeness + accuracy + freshness + consistency + validity) / 5;

        return {
            completeness,
            accuracy,
            freshness,
            consistency,
            validity,
            overall
        };
    }

    private static assessCompleteness(data: any): number {
        const requiredFields = ['symbol', 'price', 'timestamp'];
        const presentFields = requiredFields.filter(field => data[field] !== undefined && data[field] !== null);
        return presentFields.length / requiredFields.length;
    }

    private static assessAccuracy(data: any): number {
        // Simple accuracy assessment - in real implementation, this would be more sophisticated
        let accuracy = 0.8; // Base accuracy

        if (data.price && (data.price < 0 || !isFinite(data.price))) {
            accuracy -= 0.3;
        }
        if (data.size && (data.size < 0 || !isFinite(data.size))) {
            accuracy -= 0.2;
        }

        return Math.max(0, Math.min(1, accuracy));
    }

    private static assessFreshness(data: any): number {
        if (!data.timestamp) return 0;

        const now = Date.now();
        const age = (now - data.timestamp) / 1000; // Convert to seconds

        // Freshness decreases with age
        if (age < 1) return 1.0;
        if (age < 5) return 0.9;
        if (age < 30) return 0.7;
        if (age < 300) return 0.5;
        return 0.3;
    }

    private static assessConsistency(data: any): number {
        // Simple consistency check
        let consistency = 0.9;

        if (data.bid && data.ask && data.bid >= data.ask) {
            consistency -= 0.4; // Bid should be less than ask
        }

        return Math.max(0, consistency);
    }

    private static assessValidity(data: any): number {
        // Check for valid data types and ranges
        let validity = 0.9;

        if (data.price !== undefined && (typeof data.price !== 'number' || !isFinite(data.price))) {
            validity -= 0.5;
        }
        if (data.size !== undefined && (typeof data.size !== 'number' || !isFinite(data.size))) {
            validity -= 0.3;
        }

        return Math.max(0, validity);
    }
}

/**
 * Metadata validation utilities
 */
export class MetadataValidator {
    /**
     * Validate enhanced metadata structure
     */
    static validate(metadata: EnhancedMetadata): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Required fields
        if (!metadata.id) errors.push('Missing id');
        if (!metadata.timestamp) errors.push('Missing timestamp');
        if (!metadata.version) errors.push('Missing version');
        if (!metadata.source) errors.push('Missing source');
        if (!metadata.market) errors.push('Missing market');
        if (!metadata.topics) errors.push('Missing topics');
        if (!metadata.category) errors.push('Missing category');
        if (!metadata.quality) errors.push('Missing quality');
        if (!metadata.processing) errors.push('Missing processing');
        if (!metadata.business) errors.push('Missing business');
        if (!metadata.technical) errors.push('Missing technical');
        if (!metadata.relationships) errors.push('Missing relationships');

        // Field validation
        if (metadata.topics && !Array.isArray(metadata.topics)) {
            errors.push('Topics must be an array');
        }
        if (metadata.tags && !Array.isArray(metadata.tags)) {
            errors.push('Tags must be an array');
        }
        if (metadata.quality && metadata.quality.overall < 0 || metadata.quality.overall > 1) {
            errors.push('Quality overall score must be between 0 and 1');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate topic assignment
     */
    static validateTopics(topics: MarketTopic[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const validTopics = Object.values(MarketTopic);

        for (const topic of topics) {
            if (!validTopics.includes(topic)) {
                errors.push(`Invalid topic: ${topic}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

/**
 * Utility functions for metadata operations
 */
export const MetadataUtils = {
    /**
     * Create a deep copy of metadata
     */
    clone(metadata: EnhancedMetadata): EnhancedMetadata {
        return JSON.parse(JSON.stringify(metadata));
    },

    /**
     * Merge two metadata objects
     */
    merge(base: EnhancedMetadata, update: Partial<EnhancedMetadata>): EnhancedMetadata {
        return {
            ...base,
            ...update,
            source: { ...base.source, ...update.source },
            market: { ...base.market, ...update.market },
            quality: { ...base.quality, ...update.quality },
            processing: { ...base.processing, ...update.processing },
            business: { ...base.business, ...update.business },
            technical: { ...base.technical, ...update.technical },
            relationships: { ...base.relationships, ...update.relationships }
        };
    },

    /**
     * Update metadata timestamp
     */
    updateTimestamp(metadata: EnhancedMetadata): EnhancedMetadata {
        return {
            ...metadata,
            timestamp: Date.now()
        };
    },

    /**
     * Add topics to metadata
     */
    addTopics(metadata: EnhancedMetadata, topics: MarketTopic[]): EnhancedMetadata {
        const existingTopics = new Set(metadata.topics);
        const newTopics = topics.filter(topic => !existingTopics.has(topic));

        return {
            ...metadata,
            topics: [...metadata.topics, ...newTopics]
        };
    },

    /**
     * Remove topics from metadata
     */
    removeTopics(metadata: EnhancedMetadata, topicsToRemove: MarketTopic[]): EnhancedMetadata {
        return {
            ...metadata,
            topics: metadata.topics.filter(topic => !topicsToRemove.includes(topic))
        };
    }
};
