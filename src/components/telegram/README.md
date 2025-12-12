# 📢 Telegram Alert Generator

A comprehensive Telegram alert generation system for Bun-based applications. Generates formatted alerts for system monitoring, performance metrics, errors, and custom notifications with full Telegram Bot API integration.

## Features

- 🚨 **Multiple Alert Types**: Info, warning, error, critical, and success alerts
- 📊 **System Integration**: Health monitoring, performance metrics, error tracking
- 🤖 **Telegram Bot API**: Direct integration with Telegram for instant notifications
- 🎨 **Rich Formatting**: Markdown formatting with emojis and structured messages
- ⚡ **Rate Limiting**: Built-in rate limiting to prevent spam
- 🆔 **Common Identifiers**: Integrated with Windsurf's common identifier system
- 📏 **Message Truncation**: Automatic message length management
- 🔄 **Real-time Updates**: Live system monitoring and alerting

## Quick Start

```typescript
import { TelegramAlertGenerator } from './telegram-alert-generator';

// Create generator with bot configuration
const alertGenerator = new TelegramAlertGenerator({
  botToken: 'your-bot-token',
  chatId: 'your-chat-id',
  enableEmoji: true,
  maxMessageLength: 4096,
  rateLimitMs: 1000
});

// Generate and send a health alert
const healthAlert = await alertGenerator.generateHealthAlert();
await alertGenerator.sendAlert(healthAlert);
```

## Alert Types

### System Health Alerts
```typescript
const healthAlert = await alertGenerator.generateHealthAlert();
// Automatically determines severity based on tension scoring
```

### Performance Alerts
```typescript
const perfAlert = await alertGenerator.generatePerformanceAlert(
  'database_query',
  150,  // actual duration
  100   // threshold
);
// Automatically categorizes as info/warning/critical
```

### Error Alerts
```typescript
const errorAlert = alertGenerator.generateErrorAlert(
  new Error('Database connection failed'),
  'user-authentication'
);
// Includes stack trace and context information
```

### Custom Alerts
```typescript
const customAlert = alertGenerator.generateCustomAlert(
  'warning',
  'High Memory Usage',
  'Memory usage at 85%',
  'system-monitor',
  { memoryUsage: 85, threshold: 80 }
);
```

### Metrics Summary
```typescript
const summaryAlert = await alertGenerator.generateMetricsSummaryAlert();
// Daily/periodic system overview
```

## Configuration

```typescript
interface AlertConfig {
  botToken?: string;        // Telegram bot token
  chatId?: string;          // Target chat ID
  enableEmoji: boolean;     // Include emojis in messages (default: true)
  maxMessageLength: number; // Max message length (default: 4096)
  rateLimitMs: number;      // Minimum time between alerts (default: 1000)
}
```

## Message Formatting

Alerts are automatically formatted for Telegram with:

- **Markdown Support**: Bold, italic, code blocks
- **Emoji Indicators**: Visual severity indicators
- **Structured Layout**: Consistent formatting across all alert types
- **Metadata Inclusion**: Timestamps, source, and IDs
- **Length Management**: Automatic truncation for long messages

### Example Formatted Message
```
🚨 *CRITICAL* System Alert

System tension at 85% (Critical threshold exceeded)

📊 System Metrics:
• Events: 12
• Peak Tension: 95%
• Systems Monitored: 3

🕒 12/12/2025, 10:15:30 AM
🔍 Source: health-monitor
🆔 ID: 019b120a
```

## Telegram Bot Setup

### 1. Create a Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Save the bot token

### 2. Get Chat ID
1. Add your bot to a group or start a private chat
2. Send a message to the bot
3. Use this API to get the chat ID:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```

### 3. Configure Alerts
```typescript
const generator = new TelegramAlertGenerator({
  botToken: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
  chatId: '123456789'
});
```

## Integration Examples

### Health Monitoring
```typescript
// Monitor system health every 5 minutes
setInterval(async () => {
  const alert = await alertGenerator.generateHealthAlert();
  if (alert.type === 'critical' || alert.type === 'warning') {
    await alertGenerator.sendAlert(alert);
  }
}, 5 * 60 * 1000);
```

### Performance Monitoring
```typescript
// Monitor API response times
async function monitorApiCall(operation: string, fn: () => Promise<any>) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (duration > 1000) { // Alert on slow responses
      const alert = await alertGenerator.generatePerformanceAlert(
        operation, duration, 500
      );
      await alertGenerator.sendAlert(alert);
    }

    return result;
  } catch (error) {
    const alert = alertGenerator.generateErrorAlert(error as Error, operation);
    await alertGenerator.sendAlert(alert);
    throw error;
  }
}
```

### Error Tracking
```typescript
// Global error handler
process.on('uncaughtException', (error) => {
  const alert = alertGenerator.generateErrorAlert(error, 'uncaught-exception');
  alertGenerator.sendAlert(alert);
});

process.on('unhandledRejection', (reason, promise) => {
  const alert = alertGenerator.generateErrorAlert(
    new Error(`Unhandled rejection: ${reason}`),
    'unhandled-rejection'
  );
  alertGenerator.sendAlert(alert);
});
```

## Common Identifiers Integration

All alerts include Windsurf's common identifier properties:

```typescript
interface TelegramAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical' | 'success';
  title: string;
  message: string;
  timestamp: number;
  source: string;
  metadata?: Record<string, any>;

  // Common identifier properties
  propterid?: string;        // Property identifier (e.g., "alert-critical")
  crossReferenceId?: string; // Cross-reference for linking alerts
  logId?: string;           // Log identifier for tracing
}
```

## Rate Limiting

Built-in rate limiting prevents alert spam:

- **Default**: 1 alert per second
- **Configurable**: Adjust via `rateLimitMs` config
- **Automatic**: Silently drops alerts that exceed the rate limit

## Testing

```bash
# Run all tests
bun test telegram-alert-generator.test.ts

# Test specific functionality
bun test --grep "health alert"
```

## API Reference

### TelegramAlertGenerator Class

#### Constructor
```typescript
new TelegramAlertGenerator(config?: Partial<AlertConfig>)
```

#### Methods
- `generateHealthAlert(): Promise<TelegramAlert>`
- `generatePerformanceAlert(operation, duration, threshold): Promise<TelegramAlert>`
- `generateErrorAlert(error, context?): TelegramAlert`
- `generateCustomAlert(type, title, message, source, metadata?): TelegramAlert`
- `generateMetricsSummaryAlert(): Promise<TelegramAlert>`
- `formatForTelegram(alert): string`
- `sendAlert(alert): Promise<boolean>`
- `getAlertStats(): AlertStats`

### Utility Functions
- `createHealthAlert(): Promise<TelegramAlert>`
- `createPerformanceAlert(operation, duration, threshold): Promise<TelegramAlert>`
- `createErrorAlert(error, context?): TelegramAlert`
- `createCustomAlert(type, title, message, source, metadata?): TelegramAlert`
- `formatAlertForTelegram(alert): string`
- `sendAlertToTelegram(alert): Promise<boolean>`

## Dependencies

- **Bun Runtime**: Native WebSocket and fetch APIs
- **Metrics Collector**: System metrics integration
- **Tension Engine**: Health scoring integration
- **UUID Generator**: Alert ID generation

## Error Handling

- **Network Failures**: Automatic retry logic for Telegram API calls
- **Rate Limiting**: Graceful handling of rate limit violations
- **Configuration Errors**: Clear error messages for missing bot tokens/chat IDs
- **Message Truncation**: Automatic handling of overly long messages

## Security Considerations

- **Token Protection**: Never commit bot tokens to version control
- **Chat ID Validation**: Ensure alerts only go to authorized chats
- **Message Sanitization**: Automatic escaping of special characters
- **Rate Limiting**: Prevents abuse and spam

## Performance

- **Low Latency**: Sub-millisecond alert generation
- **Memory Efficient**: Minimal memory footprint
- **Non-blocking**: Asynchronous alert sending
- **Scalable**: Handles high-frequency alert generation

## License

MIT License - see project LICENSE file for details.