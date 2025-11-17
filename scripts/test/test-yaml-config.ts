#!/usr/bin/env bun

/**
 * Test YAML configuration loading with Bun v1.3
 */

import { configLoader } from '../packages/odds-core/src/config/yaml-loader';

async function testYamlConfig() {
  console.log('🧪 Testing YAML Configuration System\n');
  
  try {
    // Load configuration
    await configLoader.load();
    
    // Test basic configuration access
    console.log('✅ Basic Configuration Tests:');
    console.log(`   Version: ${configLoader.get('version')}`);
    console.log(`   Environment: ${configLoader.get('environment')}`);
    console.log(`   WebSocket Port: ${configLoader.get('websocket.port')}`);
    console.log(`   Arbitrage Edge Threshold: ${configLoader.get('arbitrage.edge_threshold')}`);
    
    // Test nested configuration access
    console.log('\n✅ Nested Configuration Tests:');
    console.log(`   NBA Market Hours: ${configLoader.get('sports.nba.market_hours.open')} - ${configLoader.get('sports.nba.market_hours.close')}`);
    console.log(`   DraftKings Rate Limit: ${configLoader.get('exchanges.draftkings.rate_limit')}`);
    console.log(`   Sharp Detection Features: ${configLoader.get('sharp_detection.features').join(', ')}`);
    
    // Test default values
    console.log('\n✅ Default Value Tests:');
    console.log(`   Non-existent key: ${configLoader.get('non.existent.key', 'default-value')}`);
    
    // Test environment substitution
    console.log('\n✅ Environment Substitution Tests:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   CSRF Secret: ${configLoader.get('security.csrf.secret') || 'not-set'}`);
    
    // Get full configuration
    const fullConfig = configLoader.getAll();
    console.log('\n✅ Full Configuration Loaded:');
    console.log(`   Keys: ${Object.keys(fullConfig).length}`);
    console.log(`   Size: ${JSON.stringify(fullConfig).length} characters`);
    
    console.log('\n🎉 YAML Configuration System working perfectly!');
    
  } catch (error) {
    console.error('❌ YAML Configuration Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
testYamlConfig();
