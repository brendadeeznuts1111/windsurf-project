/**
 * @fileoverview Telegram Notification Handler
 * @description Integrates Telegram notifications with authentication events
 * @author Bun Telegram Integration Team
 * @version 1.0.0
 * @since 2025
 */

import { TelegramService } from './telegram-service';
import { AuthHandlers } from '../auth/login-handlers';
import { BunTeamMapper } from '../bun-team-mapper';

export class TelegramNotificationHandler {
  private telegramService: TelegramService;
  private authHandlers: AuthHandlers;
  private teamMapper: BunTeamMapper;

  constructor(
    telegramService: TelegramService,
    authHandlers: AuthHandlers,
    teamMapper: BunTeamMapper
  ) {
    this.telegramService = telegramService;
    this.authHandlers = authHandlers;
    this.teamMapper = teamMapper;

    this.setupEventListeners();
  }

  /**
   * Set up event listeners for authentication events
   */
  private setupEventListeners(): void {
    // Listen for authentication events (in a real implementation, you'd use an event emitter)
    this.setupAuthEventListeners();
    this.setupSystemEventListeners();
    this.setupTeamEventListeners();
  }

  /**
   * Handle authentication events
   */
  private setupAuthEventListeners(): void {
    // These would be called from your auth handlers when events occur
  }

  /**
   * Handle system events
   */
  private setupSystemEventListeners(): void {
    // Monitor system health and send alerts
    this.startSystemMonitoring();
  }

  /**
   * Handle team events
   */
  private setupTeamEventListeners(): void {
    // Monitor team changes and hierarchy updates
  }

  /**
   * Send notification for successful login
   */
  async notifyLoginSuccess(userId: string, details?: any): Promise<void> {
    try {
      // Get user context to determine team (simplified)
      const userContext = { userId, username: userId, email: '', roles: [], teamId: 'engineering' };

      if (userContext?.teamId) {
        await this.telegramService.sendTeamNotification(
          userContext.teamId,
          `✅ User ${userContext.username} (${userId}) logged in successfully`,
          'low'
        );
      }

      // Send to security channel
      await this.telegramService.sendAuthNotification('login', userId, details);
    } catch (error) {
      console.error('Failed to send login success notification:', error);
    }
  }

  /**
   * Send notification for failed login
   */
  async notifyLoginFailure(userId: string, reason: string, details?: any): Promise<void> {
    try {
      await this.telegramService.sendAuthNotification('failed_login', userId, {
        reason,
        ...details
      });
    } catch (error) {
      console.error('Failed to send login failure notification:', error);
    }
  }

  /**
   * Send notification for logout
   */
  async notifyLogout(userId: string, details?: any): Promise<void> {
    try {
      await this.telegramService.sendAuthNotification('logout', userId, details);
    } catch (error) {
      console.error('Failed to send logout notification:', error);
    }
  }

  /**
   * Send notification for token refresh
   */
  async notifyTokenRefresh(userId: string, details?: any): Promise<void> {
    try {
      await this.telegramService.sendAuthNotification('token_refresh', userId, details);
    } catch (error) {
      console.error('Failed to send token refresh notification:', error);
    }
  }

  /**
   * Send system health alert
   */
  async notifySystemAlert(
    alertType: 'error' | 'warning' | 'info',
    title: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    try {
      await this.telegramService.sendSystemAlert(alertType, title, message, metadata);
    } catch (error) {
      console.error('Failed to send system alert:', error);
    }
  }

  /**
   * Send team hierarchy change notification
   */
  async notifyTeamChange(teamId: string, changeType: string, details?: any): Promise<void> {
    try {
      const message = `👥 Team ${teamId} ${changeType}`;
      await this.telegramService.sendTeamNotification(teamId, message, 'medium');
    } catch (error) {
      console.error('Failed to send team change notification:', error);
    }
  }

  /**
   * Send PR review notification
   */
  async notifyPRReview(
    prNumber: number,
    title: string,
    author: string,
    reviewers: string[],
    priority: 'low' | 'medium' | 'high' | 'critical',
    teams: string[]
  ): Promise<void> {
    try {
      await this.telegramService.sendPRNotification(
        prNumber,
        title,
        author,
        reviewers,
        priority,
        teams
      );
    } catch (error) {
      console.error('Failed to send PR review notification:', error);
    }
  }

  /**
   * Start system monitoring
   */
  private startSystemMonitoring(): void {
    // Check system health every 5 minutes
    setInterval(async () => {
      try {
        await this.checkSystemHealth();
      } catch (error) {
        console.error('System health check failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Check system health and send alerts if needed
   */
  private async checkSystemHealth(): Promise<void> {
    try {
      // Get system metrics (simplified)
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      const memoryMB = Math.round(memUsage.rss / 1024 / 1024);
      const uptimeHours = Math.round(uptime / 3600);

      // Alert if memory usage is high
      if (memoryMB > 500) {
        await this.notifySystemAlert(
          'warning',
          'High Memory Usage',
          `System memory usage is ${memoryMB}MB`,
          { memoryMB, uptimeHours }
        );
      }

      // Alert if uptime is suspiciously low (possible restart)
      if (uptimeHours < 1) {
        await this.notifySystemAlert(
          'info',
          'System Restart Detected',
          `System has been running for ${uptimeHours} hours`,
          { uptimeHours }
        );
      }

    } catch (error) {
      console.error('System health check error:', error);
    }
  }

  /**
   * Send welcome message to new team members
   */
  async sendWelcomeMessage(userId: string, teamId: string): Promise<void> {
    try {
      // Simplified user context for welcome message
      const userContext = { userId, username: userId, email: '' };
      if (!userContext) return;

      const welcomeMessage = `🎉 Welcome ${userContext.username} to the ${teamId} team!\n\n` +
                           `You now have access to:\n` +
                           `• Team-specific channels\n` +
                           `• Project repositories\n` +
                           `• Authentication system\n` +
                           `• RBAC permissions\n\n` +
                           `Use /help in any chat for assistance.`;

      await this.telegramService.sendTeamNotification(teamId, welcomeMessage, 'low');
    } catch (error) {
      console.error('Failed to send welcome message:', error);
    }
  }

  /**
   * Send security alert for suspicious activity
   */
  async sendSecurityAlert(
    alertType: 'brute_force' | 'unusual_login' | 'permission_change',
    userId: string,
    details: any
  ): Promise<void> {
    try {
      const alertTitles = {
        brute_force: '🚨 Brute Force Attack Detected',
        unusual_login: '⚠️ Unusual Login Activity',
        permission_change: '🔐 Permission Change Alert'
      };

      const title = alertTitles[alertType] || 'Security Alert';
      const message = `User: ${userId}\nType: ${alertType}\nDetails: ${JSON.stringify(details)}`;

      await this.telegramService.sendSystemAlert('error', title, message, {
        userId,
        alertType,
        ...details
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  /**
   * Get notification statistics
   */
  getStats(): {
    telegramStats: any;
    recentNotifications: string[];
  } {
    return {
      telegramStats: this.telegramService.getStats(),
      recentNotifications: [] // Would track recent notifications in production
    };
  }
}

export default TelegramNotificationHandler;