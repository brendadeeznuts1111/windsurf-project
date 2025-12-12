#!/usr/bin/env bun

/**
 * 📢 Telegram Alert Generator - Usage Examples
 *
 * Demonstrates various ways to use the Telegram alert generator
 * for system monitoring, error tracking, and custom notifications.
 */

import {
  TelegramAlertGenerator,
  createHealthAlert,
  createErrorAlert,
  createPerformanceAlert,
  createCustomAlert
} from './telegram-alert-generator';

// Example 1: Basic Setup and Health Monitoring
async function exampleBasicSetup() {
  console.log('🚀 Setting up Telegram Alert Generator...\n');

  // Create generator with configuration
  const alertGenerator = new TelegramAlertGenerator({
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    enableEmoji: true,
    maxMessageLength: 4096,
    rateLimitMs: 2000 // 2 seconds between alerts
  });

  // Generate and display a health alert
  console.log('📊 Generating health alert...');
  const healthAlert = await alertGenerator.generateHealthAlert();
  console.log('Health Alert:', JSON.stringify(healthAlert, null, 2));

  // Format for Telegram
  const formattedMessage = alertGenerator.formatForTelegram(healthAlert);
  console.log('\n📱 Formatted Telegram Message:');
  console.log(formattedMessage);

  // Send alert (only if configured)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    console.log('\n📤 Sending alert to Telegram...');
    const sent = await alertGenerator.sendAlert(healthAlert);
    console.log(sent ? '✅ Alert sent successfully!' : '❌ Failed to send alert');
  } else {
    console.log('\n⚠️  Telegram not configured - skipping send');
  }
}

// Example 2: Performance Monitoring
async function examplePerformanceMonitoring() {
  console.log('\n⚡ Performance Monitoring Example\n');

  // Simulate different performance scenarios
  const scenarios = [
    { operation: 'fast-db-query', duration: 50, threshold: 100 },
    { operation: 'slow-api-call', duration: 250, threshold: 200 },
    { operation: 'critical-db-query', duration: 500, threshold: 100 }
  ];

  for (const scenario of scenarios) {
    const alert = await createPerformanceAlert(
      scenario.operation,
      scenario.duration,
      scenario.threshold
    );

    console.log(`📊 ${scenario.operation}:`);
    console.log(`   Duration: ${scenario.duration}ms`);
    console.log(`   Threshold: ${scenario.threshold}ms`);
    console.log(`   Alert Type: ${alert.type}`);
    console.log(`   Message: ${alert.message}\n`);
  }
}

// Example 3: Error Tracking
function exampleErrorTracking() {
  console.log('❌ Error Tracking Example\n');

  // Simulate different error scenarios
  const errors = [
    new Error('Database connection timeout'),
    new Error('API rate limit exceeded'),
    new TypeError('Cannot read property of undefined')
  ];

  const contexts = ['user-login', 'payment-processing', 'data-sync'];

  for (let i = 0; i < errors.length; i++) {
    const alert = createErrorAlert(errors[i], contexts[i]);

    console.log(`🚨 Error Alert ${i + 1}:`);
    console.log(`   Type: ${alert.type}`);
    console.log(`   Title: ${alert.title}`);
    console.log(`   Source: ${alert.source}`);
    console.log(`   Has Stack Trace: ${alert.message.includes('Stack Trace')}\n`);
  }
}

// Example 4: Custom Alerts
function exampleCustomAlerts() {
  console.log('🎯 Custom Alerts Example\n');

  const customAlerts = [
    createCustomAlert(
      'success',
      'Deployment Completed',
      'Version 1.2.3 deployed successfully to production',
      'ci-cd-pipeline',
      { version: '1.2.3', environment: 'production' }
    ),
    createCustomAlert(
      'warning',
      'High Memory Usage',
      'Memory usage at 85% - consider scaling',
      'system-monitor',
      { memoryUsage: 85, threshold: 80, server: 'web-01' }
    ),
    createCustomAlert(
      'info',
      'New User Registration',
      '1000th user registered this month!',
      'user-service',
      { userCount: 1000, milestone: true }
    )
  ];

  customAlerts.forEach((alert, index) => {
    console.log(`📢 Custom Alert ${index + 1}:`);
    console.log(`   Type: ${alert.type}`);
    console.log(`   Title: ${alert.title}`);
    console.log(`   Message: ${alert.message}`);
    console.log(`   Metadata: ${JSON.stringify(alert.metadata)}\n`);
  });
}

// Example 5: Integration with System Monitoring
async function exampleSystemIntegration() {
  console.log('🔗 System Integration Example\n');

  const generator = new TelegramAlertGenerator();

  // Simulate system monitoring loop
  console.log('Starting system monitoring simulation...\n');

  for (let i = 0; i < 3; i++) {
    console.log(`📊 Monitoring cycle ${i + 1}/3`);

    // Generate health alert
    const healthAlert = await generator.generateHealthAlert();
    console.log(`   Health: ${healthAlert.type} - ${healthAlert.title}`);

    // Generate metrics summary
    const metricsAlert = await generator.generateMetricsSummaryAlert();
    console.log(`   Metrics: ${metricsAlert.title}`);

    // Simulate some "events" by creating custom alerts
    if (i === 1) { // Simulate a warning condition
      const warningAlert = createCustomAlert(
        'warning',
        'Simulated Warning',
        'This is a simulated system warning for demonstration',
        'monitoring-simulation',
        { simulation: true, cycle: i + 1 }
      );
      console.log(`   Warning: ${warningAlert.title}`);
    }

    // Wait between cycles
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ System monitoring simulation completed');
}

// Example 6: Alert Statistics and Configuration
function exampleAlertStatistics() {
  console.log('📈 Alert Statistics Example\n');

  const generator = new TelegramAlertGenerator({
    enableEmoji: false, // Disable emojis for this example
    maxMessageLength: 1000,
    rateLimitMs: 500
  });

  const stats = generator.getAlertStats();

  console.log('Alert Generator Configuration:');
  console.log(`   Emojis Enabled: ${stats.config.enableEmoji}`);
  console.log(`   Max Message Length: ${stats.config.maxMessageLength}`);
  console.log(`   Rate Limit: ${stats.config.rateLimitMs}ms`);
  console.log(`   Last Alert: ${stats.lastAlertTime ? new Date(stats.lastAlertTime).toLocaleString() : 'None'}`);

  console.log('\nAvailable Alert Templates:');
  Object.entries(stats.templates).forEach(([type, template]) => {
    console.log(`   ${type}: ${template.emoji} "${template.prefix}" (${template.color})`);
  });
}

// Main execution
async function runExamples() {
  console.log('📢 Telegram Alert Generator - Usage Examples\n');
  console.log('=' .repeat(50) + '\n');

  try {
    await exampleBasicSetup();
    await examplePerformanceMonitoring();
    exampleErrorTracking();
    exampleCustomAlerts();
    await exampleSystemIntegration();
    exampleAlertStatistics();

    console.log('\n🎉 All examples completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables');
    console.log('   2. Configure alerts in your application');
    console.log('   3. Integrate with your monitoring systems');
    console.log('   4. Set up automated alerting for critical events');

  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Run examples if this file is executed directly
if (import.meta.main) {
  runExamples();
}

export {
  exampleBasicSetup,
  examplePerformanceMonitoring,
  exampleErrorTracking,
  exampleCustomAlerts,
  exampleSystemIntegration,
  exampleAlertStatistics
};