/**
 * @fileoverview Telegram Integration Service
 * @description Comprehensive Telegram bot and notification system for team collaboration
 * @author Bun Telegram Team
 * @version 1.0.0
 * @since 2025
 */

export interface TelegramConfig {
  botToken: string;
  defaultChatId?: string;
  webhookUrl?: string;
  pollingInterval?: number;
  rateLimit: {
    maxMessages: number;
    windowMs: number;
  };
}

export interface TelegramMessage {
  chatId: string | number;
  text: string;
  parseMode?: 'Markdown' | 'HTML';
  replyMarkup?: any;
  disableNotification?: boolean;
  retryCount?: number;
}

export interface TelegramUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  isBot: boolean;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  description?: string;
}

export interface TelegramUpdate {
  updateId: number;
  message?: {
    messageId: number;
    from?: TelegramUser;
    chat: TelegramChat;
    date: number;
    text?: string;
    entities?: any[];
  };
  callbackQuery?: {
    id: string;
    from: TelegramUser;
    data: string;
  };
}

export interface NotificationTemplate {
  type: 'auth' | 'team' | 'system' | 'pr' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actions?: string[];
  metadata?: Record<string, any>;
}

export class TelegramService {
  private config: TelegramConfig;
  private baseUrl: string;
  private lastUpdateId = 0;
  private messageQueue: TelegramMessage[] = [];
  private rateLimit: {
    messages: number[];
    lastReset: number;
  } = { messages: [], lastReset: Date.now() };

  constructor(config: TelegramConfig) {
    this.config = config;
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;

    // Start message processing queue
    this.startMessageProcessor();

    // Start polling if no webhook
    if (!config.webhookUrl) {
      this.startPolling();
    }
  }

  /**
   * Send a message to Telegram
   */
  async sendMessage(message: TelegramMessage): Promise<any> {
    // Check rate limits
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    // Queue message for processing
    this.messageQueue.push(message);

    return { queued: true };
  }

  /**
   * Send notification using template
   */
  async sendNotification(template: NotificationTemplate, chatId?: string): Promise<any> {
    const targetChatId = chatId || this.config.defaultChatId;
    if (!targetChatId) {
      throw new Error('No chat ID specified');
    }

    const emoji = this.getPriorityEmoji(template.priority);
    const formattedMessage = this.formatNotificationMessage(template, emoji);

    return this.sendMessage({
      chatId: targetChatId,
      text: formattedMessage,
      parseMode: 'Markdown',
      disableNotification: template.priority === 'low'
    });
  }

  /**
   * Send team-specific notification
   */
  async sendTeamNotification(
    teamKey: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<any> {
    const chatId = this.getTeamChatId(teamKey);
    if (!chatId) {
      console.warn(`No Telegram chat configured for team: ${teamKey}`);
      return null;
    }

    const emoji = this.getPriorityEmoji(priority);
    const formattedMessage = `${emoji} *${teamKey.toUpperCase()} Team*\n${message}`;

    return this.sendMessage({
      chatId,
      text: formattedMessage,
      parseMode: 'Markdown',
      disableNotification: priority === 'low'
    });
  }

  /**
   * Send authentication event notification
   */
  async sendAuthNotification(
    event: 'login' | 'logout' | 'failed_login' | 'token_refresh',
    userId: string,
    details?: any
  ): Promise<any> {
    const emoji = event === 'failed_login' ? '🚨' : event === 'logout' ? '👋' : '🔐';
    const eventText = event.replace('_', ' ').toUpperCase();

    let message = `${emoji} *Authentication Event*\n`;
    message += `Event: ${eventText}\n`;
    message += `User: ${userId}\n`;

    if (details?.ip) message += `IP: ${details.ip}\n`;
    if (details?.userAgent) message += `Agent: ${details.userAgent}\n`;
    if (details?.timestamp) message += `Time: ${new Date(details.timestamp).toISOString()}\n`;

    return this.sendNotification({
      type: 'auth',
      priority: event === 'failed_login' ? 'high' : 'medium',
      title: 'Authentication Event',
      message,
      metadata: { event, userId, details }
    });
  }

  /**
   * Send system alert
   */
  async sendSystemAlert(
    alertType: 'error' | 'warning' | 'info',
    title: string,
    message: string,
    metadata?: any
  ): Promise<any> {
    const emoji = alertType === 'error' ? '🚨' : alertType === 'warning' ? '⚠️' : 'ℹ️';

    let formattedMessage = `${emoji} *System Alert: ${title}*\n\n${message}`;

    if (metadata) {
      formattedMessage += '\n\n*Details:*\n';
      for (const [key, value] of Object.entries(metadata)) {
        formattedMessage += `• ${key}: ${value}\n`;
      }
    }

    return this.sendNotification({
      type: 'system',
      priority: alertType === 'error' ? 'critical' : alertType === 'warning' ? 'high' : 'medium',
      title,
      message: formattedMessage,
      metadata
    });
  }

  /**
   * Send PR review notification
   */
  async sendPRNotification(
    prNumber: number,
    title: string,
    author: string,
    reviewers: string[],
    priority: 'low' | 'medium' | 'high' | 'critical',
    teams: string[]
  ): Promise<any> {
    const emoji = this.getPriorityEmoji(priority);

    let message = `${emoji} *Pull Request Review Required*\n\n`;
    message += `📋 PR #${prNumber}: ${title}\n`;
    message += `👤 Author: ${author}\n`;
    message += `👥 Teams: ${teams.join(', ')}\n`;
    message += `🔍 Reviewers: ${reviewers.join(', ')}\n`;
    message += `⚡ Priority: ${priority.toUpperCase()}\n\n`;

    if (reviewers.length > 0) {
      message += `*Please review:* ${reviewers.map(r => `@${r}`).join(' ')}\n`;
    }

    // Send to each affected team
    const results = [];
    for (const team of teams) {
      try {
        const result = await this.sendTeamNotification(team, message, priority);
        results.push(result);
      } catch (error) {
        console.error(`Failed to send PR notification to team ${team}:`, error);
      }
    }

    return results;
  }

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<any> {
    return this.apiCall('getMe');
  }

  /**
   * Set webhook URL
   */
  async setWebhook(url: string): Promise<any> {
    return this.apiCall('setWebhook', { url });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(): Promise<any> {
    return this.apiCall('deleteWebhook');
  }

  /**
   * Get webhook info
   */
  async getWebhookInfo(): Promise<any> {
    return this.apiCall('getWebhookInfo');
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async apiCall(method: string, params?: any): Promise<any> {
    const url = `${this.baseUrl}/${method}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: params ? JSON.stringify(params) : undefined
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as { ok: boolean; result: any; description?: string };

      if (!result.ok) {
        throw new Error(`Telegram API error: ${result.description}`);
      }

      return result.result;
    } catch (error) {
      console.error(`Telegram API call failed (${method}):`, error);
      throw error;
    }
  }

  private async startMessageProcessor(): Promise<void> {
    setInterval(async () => {
      if (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          try {
            await this.apiCall('sendMessage', {
              chat_id: message.chatId,
              text: message.text,
              parse_mode: message.parseMode,
              reply_markup: message.replyMarkup,
              disable_notification: message.disableNotification
            });
          } catch (error) {
            console.error('Failed to send Telegram message:', error);
            // Re-queue message for retry (up to 3 times)
            const currentRetryCount = message.retryCount || 0;
            if (currentRetryCount < 3) {
              message.retryCount = currentRetryCount + 1;
              this.messageQueue.unshift(message);
            }
          }
        }
      }
    }, 100); // Process messages every 100ms
  }

  private async startPolling(): Promise<void> {
    const pollInterval = this.config.pollingInterval || 1000;

    setInterval(async () => {
      try {
        const updates = await this.apiCall('getUpdates', {
          offset: this.lastUpdateId + 1,
          timeout: 30
        });

        for (const update of updates) {
          this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
          await this.handleUpdate(update);
        }
      } catch (error) {
        console.error('Telegram polling error:', error);
      }
    }, pollInterval);
  }

  private async handleUpdate(update: TelegramUpdate): Promise<void> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callbackQuery) {
        await this.handleCallbackQuery(update.callbackQuery);
      }
    } catch (error) {
      console.error('Error handling Telegram update:', error);
    }
  }

  private async handleMessage(message: any): Promise<void> {
    const text = message.text;
    const chatId = message.chat.id;
    const user = message.from;

    if (!text) return;

    // Handle commands
    if (text.startsWith('/')) {
      const command = text.split(' ')[0].substring(1);
      await this.handleCommand(command, text, chatId, user);
    }
  }

  private async handleCommand(command: string, fullText: string, chatId: number, user: TelegramUser): Promise<void> {
    switch (command) {
      case 'start':
        await this.sendMessage({
          chatId,
          text: `👋 Hello! I'm your Bun authentication assistant.\n\nI can help you with:\n• Team notifications\n• System alerts\n• PR reviews\n• Authentication events\n\nUse /help for more commands.`,
          parseMode: 'Markdown'
        });
        break;

      case 'help':
        await this.sendMessage({
          chatId,
          text: `*Available Commands:*\n\n` +
                `🔐 /auth - Authentication status\n` +
                `👥 /teams - Team information\n` +
                `📋 /prs - Recent PRs\n` +
                `⚠️ /alerts - System alerts\n` +
                `📊 /status - System status\n` +
                `❓ /help - This help message`,
          parseMode: 'Markdown'
        });
        break;

      case 'status':
        await this.sendSystemAlert('info', 'System Status Requested',
          `System status requested by ${user.username || user.firstName}`);
        break;

      default:
        await this.sendMessage({
          chatId,
          text: `Unknown command: ${command}. Use /help for available commands.`
        });
    }
  }

  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    // Handle inline keyboard callbacks
    console.log('Callback query:', callbackQuery);
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.rateLimit.windowMs;

    // Clean old messages
    this.rateLimit.messages = this.rateLimit.messages.filter(
      timestamp => timestamp > windowStart
    );

    // Check if under limit
    if (this.rateLimit.messages.length >= this.config.rateLimit.maxMessages) {
      return false;
    }

    // Add current message
    this.rateLimit.messages.push(now);
    return true;
  }

  private getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '📢';
    }
  }

  private formatNotificationMessage(template: NotificationTemplate, emoji: string): string {
    let message = `${emoji} *${template.title}*\n\n${template.message}`;

    if (template.actions && template.actions.length > 0) {
      message += '\n\n*Actions:*\n';
      template.actions.forEach(action => {
        message += `• ${action}\n`;
      });
    }

    return message;
  }

  private getTeamChatId(teamKey: string): string | null {
    // Map team keys to Telegram chat IDs
    const teamChats: Record<string, string> = {
      'executive': process.env.TELEGRAM_EXECUTIVE_CHAT_ID || '',
      'engineering': process.env.TELEGRAM_ENGINEERING_CHAT_ID || '',
      'core_api': process.env.TELEGRAM_CORE_API_CHAT_ID || '',
      'frontend': process.env.TELEGRAM_FRONTEND_CHAT_ID || '',
      'quality_assurance': process.env.TELEGRAM_QA_CHAT_ID || '',
      'performance': process.env.TELEGRAM_PERF_CHAT_ID || ''
    };

    return teamChats[teamKey] || null;
  }

  /**
   * Get service statistics
   */
  getStats(): {
    queuedMessages: number;
    rateLimit: {
      current: number;
      max: number;
      windowMs: number;
    };
    lastUpdateId: number;
  } {
    return {
      queuedMessages: this.messageQueue.length,
      rateLimit: {
        current: this.rateLimit.messages.length,
        max: this.config.rateLimit.maxMessages,
        windowMs: this.config.rateLimit.windowMs
      },
      lastUpdateId: this.lastUpdateId
    };
  }
}

export default TelegramService;