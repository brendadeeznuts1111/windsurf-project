/**
 * Unified API Hub Client - Interactive Dashboard Functionality
 * Handles real-time updates, service monitoring, and user interactions
 */

interface ServiceInfo {
    id: string;
    name: string;
    internalPort: number;
    externalPath: string;
    url: string;
    status: 'healthy' | 'unhealthy' | 'unreachable' | 'unknown';
    lastHealthCheck: number;
    responseTime: number;
}

interface HealthStatus {
    healthy: boolean;
    statusCode: number;
    responseTime: number;
    lastCheck: number;
    message: string;
}

interface HubData {
    hub: {
        name: string;
        domain: string;
        version: string;
        services: number;
    };
    services: ServiceInfo[];
}

interface HealthData {
    status: string;
    timestamp: string;
    services: {
        total: number;
        healthy: number;
        unhealthy: number;
        unreachable: number;
    };
    healthDetails: Record<string, HealthStatus>;
}

class UnifiedAPIHubClient {
    private hubUrl: string = window.location.origin;
    private refreshInterval: number = 30000; // 30 seconds
    private refreshTimer: number | null = null;
    private currentView: string = 'overview';

    // DOM elements
    private totalServicesEl: HTMLElement;
    private healthyServicesEl: HTMLElement;
    private responseTimeEl: HTMLElement;
    private servicesGrid: HTMLElement;
    private servicesTableBody: HTMLElement;
    private healthList: HTMLElement;
    private logsContent: HTMLElement;

    constructor() {
        this.initializeDOM();
        this.initializeEventListeners();
        this.startAutoRefresh();
        this.loadInitialData();
    }

    private initializeDOM(): void {
        this.totalServicesEl = document.getElementById('total-services')!;
        this.healthyServicesEl = document.getElementById('healthy-services')!;
        this.responseTimeEl = document.getElementById('response-time')!;
        this.servicesGrid = document.getElementById('services-grid')!;
        this.servicesTableBody = document.getElementById('services-table-body')!;
        this.healthList = document.getElementById('health-list')!;
        this.logsContent = document.getElementById('logs-content')!;
    }

    private initializeEventListeners(): void {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = (e.target as HTMLElement).dataset.view!;
                this.switchView(view);
            });
        });

        // Action buttons
        document.getElementById('refresh-btn')?.addEventListener('click', () => {
            this.manualRefresh();
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('clear-logs')?.addEventListener('click', () => {
            this.clearLogs();
        });

        // Log level filter
        document.getElementById('log-level')?.addEventListener('change', (e) => {
            this.filterLogs((e.target as HTMLSelectElement).value);
        });
    }

    private async loadInitialData(): Promise<void> {
        try {
            await Promise.all([
                this.loadServicesData(),
                this.loadHealthData()
            ]);
            this.addLogEntry('info', 'Dashboard initialized successfully');
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.addLogEntry('error', 'Failed to load initial dashboard data');
        }
    }

    private async loadServicesData(): Promise<void> {
        try {
            const response = await fetch(`${this.hubUrl}/services`);
            const data: HubData = await response.json();

            this.updateServicesStats(data.services);
            this.renderServicesGrid(data.services);
            this.renderServicesTable(data.services);

        } catch (error) {
            console.error('Failed to load services data:', error);
            this.addLogEntry('error', 'Failed to load services data');
        }
    }

    private async loadHealthData(): Promise<void> {
        try {
            const response = await fetch(`${this.hubUrl}/health`);
            const data: HealthData = await response.json();

            this.updateHealthStats(data);
            this.renderHealthDetails(data.healthDetails);

        } catch (error) {
            console.error('Failed to load health data:', error);
            this.addLogEntry('error', 'Failed to load health data');
        }
    }

    private updateServicesStats(services: ServiceInfo[]): void {
        const total = services.length;
        const healthy = services.filter(s => s.status === 'healthy').length;
        const avgResponseTime = services
            .filter(s => s.responseTime > 0)
            .reduce((sum, s) => sum + s.responseTime, 0) /
            services.filter(s => s.responseTime > 0).length;

        this.totalServicesEl.textContent = total.toString();
        this.healthyServicesEl.textContent = healthy.toString();
        this.responseTimeEl.textContent = avgResponseTime > 0 ?
            `${avgResponseTime.toFixed(0)}ms` : '--';
    }

    private updateHealthStats(data: HealthData): void {
        // Update hub status
        const hubStatusEl = document.getElementById('hub-status');
        if (hubStatusEl) {
            hubStatusEl.textContent = data.status;
            hubStatusEl.className = `metric-value ${data.status === 'healthy' ? 'healthy' : 'unhealthy'}`;
        }

        // Update uptime (simulated)
        const uptimeEl = document.getElementById('uptime');
        if (uptimeEl) {
            const uptime = Math.floor((Date.now() - new Date(data.timestamp).getTime()) / 1000);
            uptimeEl.textContent = `${uptime}s`;
        }

        // Update total requests (simulated)
        const requestsEl = document.getElementById('total-requests');
        if (requestsEl) {
            requestsEl.textContent = Math.floor(Math.random() * 1000).toString();
        }
    }

    private renderServicesGrid(services: ServiceInfo[]): void {
        this.servicesGrid.innerHTML = '';

        services.forEach(service => {
            const card = this.createServiceCard(service);
            this.servicesGrid.appendChild(card);
        });
    }

    private renderServicesTable(services: ServiceInfo[]): void {
        this.servicesTableBody.innerHTML = '';

        services.forEach(service => {
            const row = this.createServiceRow(service);
            this.servicesTableBody.appendChild(row);
        });
    }

    private renderHealthDetails(healthDetails: Record<string, HealthStatus>): void {
        this.healthList.innerHTML = '';

        Object.entries(healthDetails).forEach(([serviceId, health]) => {
            const healthItem = this.createHealthItem(serviceId, health);
            this.healthList.appendChild(healthItem);
        });
    }

    private createServiceCard(service: ServiceInfo): HTMLElement {
        const template = document.getElementById('service-card-template') as HTMLTemplateElement;
        const card = template.content.cloneNode(true) as HTMLElement;

        // Update card content
        card.querySelector('.service-name')!.textContent = service.name;
        card.querySelector('.service-path')!.textContent = service.externalPath;
        card.querySelector('.response-time')!.textContent = service.responseTime > 0 ?
            `${service.responseTime}ms` : '--';
        card.querySelector('.last-check')!.textContent =
            new Date(service.lastHealthCheck).toLocaleTimeString();

        // Update status
        const statusIndicator = card.querySelector('.status-indicator') as HTMLElement;
        const statusText = card.querySelector('.status-text') as HTMLElement;
        const cardEl = card.querySelector('.service-card') as HTMLElement;

        statusText.textContent = service.status.toUpperCase();
        cardEl.classList.add(service.status);

        if (service.status === 'healthy') {
            statusIndicator.style.background = '#00ff88';
            statusIndicator.style.boxShadow = '0 0 10px #00ff88';
        } else if (service.status === 'unhealthy') {
            statusIndicator.style.background = '#ff6b6b';
            statusIndicator.style.boxShadow = '0 0 10px #ff6b6b';
        } else {
            statusIndicator.style.background = '#ffa500';
        }

        // Add event listeners
        card.querySelector('.test-btn')?.addEventListener('click', () => {
            this.testService(service);
        });

        card.querySelector('.logs-btn')?.addEventListener('click', () => {
            this.showServiceLogs(service);
        });

        card.querySelector('.config-btn')?.addEventListener('click', () => {
            this.showServiceConfig(service);
        });

        return card;
    }

    private createServiceRow(service: ServiceInfo): HTMLElement {
        const template = document.getElementById('service-row-template') as HTMLTemplateElement;
        const row = template.content.cloneNode(true) as HTMLElement;

        // Update row content
        row.querySelector('.service-name-cell')!.textContent = service.name;
        row.querySelector('.service-path-cell')!.textContent = service.externalPath;
        row.querySelector('.service-port-cell')!.textContent = service.internalPort.toString();
        row.querySelector('.service-response-cell')!.textContent = service.responseTime > 0 ?
            `${service.responseTime}ms` : '--';
        row.querySelector('.service-lastcheck-cell')!.textContent =
            new Date(service.lastHealthCheck).toLocaleTimeString();

        // Update status
        const statusIndicator = row.querySelector('.status-indicator') as HTMLElement;
        const statusText = row.querySelector('.status-text') as HTMLElement;
        const rowEl = row.querySelector('.service-row') as HTMLElement;

        statusText.textContent = service.status;
        rowEl.classList.add(service.status);

        // Add event listeners
        row.querySelector('.test-btn')?.addEventListener('click', () => {
            this.testService(service);
        });

        row.querySelector('.restart-btn')?.addEventListener('click', () => {
            this.restartService(service);
        });

        return row;
    }

    private createHealthItem(serviceId: string, health: HealthStatus): HTMLElement {
        const item = document.createElement('div');
        item.className = `health-item ${health.healthy ? 'healthy' : 'unhealthy'}`;

        item.innerHTML = `
            <div class="health-item-header">
                <span class="health-service-name">${serviceId}</span>
                <span class="health-status ${health.healthy ? 'healthy' : 'unhealthy'}">
                    ${health.healthy ? '✓' : '✗'} ${health.message}
                </span>
            </div>
            <div class="health-item-details">
                <span>Response: ${health.responseTime}ms</span>
                <span>Code: ${health.statusCode}</span>
                <span>Last: ${new Date(health.lastCheck).toLocaleTimeString()}</span>
            </div>
        `;

        return item;
    }

    private switchView(view: string): void {
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

        // Update view visibility
        document.querySelectorAll('.view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        document.getElementById(`${view}-view`)?.classList.add('active');

        this.currentView = view;
    }

    private async manualRefresh(): Promise<void> {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.textContent = '🔄 Refreshing...';
            refreshBtn.classList.add('loading');
        }

        try {
            await Promise.all([
                this.loadServicesData(),
                this.loadHealthData()
            ]);
            this.addLogEntry('info', 'Manual refresh completed');
        } catch (error) {
            this.addLogEntry('error', 'Manual refresh failed');
        }

        if (refreshBtn) {
            refreshBtn.textContent = '🔄 Refresh';
            refreshBtn.classList.remove('loading');
        }
    }

    private startAutoRefresh(): void {
        this.refreshTimer = setInterval(() => {
            this.loadServicesData();
            this.loadHealthData();
        }, this.refreshInterval);
    }

    private async testService(service: ServiceInfo): Promise<void> {
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.hubUrl}${service.externalPath}/health`, {
                signal: AbortSignal.timeout(5000)
            });
            const responseTime = Date.now() - startTime;

            const result = response.ok ? 'success' : 'failed';
            this.addLogEntry('info', `Service test: ${service.name} - ${result} (${responseTime}ms)`);

            // Show notification
            this.showNotification(`Service ${service.name} test: ${result}`, result === 'success' ? 'success' : 'error');

        } catch (error) {
            this.addLogEntry('error', `Service test failed: ${service.name} - ${error.message}`);
            this.showNotification(`Service ${service.name} test failed`, 'error');
        }
    }

    private showServiceLogs(service: ServiceInfo): void {
        this.addLogEntry('info', `Showing logs for service: ${service.name}`);
        // In a real implementation, this would open a logs modal or navigate to logs view
        this.switchView('logs');
    }

    private showServiceConfig(service: ServiceInfo): void {
        this.addLogEntry('info', `Showing config for service: ${service.name}`);
        // In a real implementation, this would open a config modal
        alert(`Configuration for ${service.name}:\nPort: ${service.internalPort}\nPath: ${service.externalPath}\nURL: ${service.url}`);
    }

    private async restartService(service: ServiceInfo): Promise<void> {
        this.addLogEntry('warn', `Attempting to restart service: ${service.name}`);
        // In a real implementation, this would call a restart API
        this.showNotification(`Restart not implemented for ${service.name}`, 'warning');
    }

    private showSettings(): void {
        this.addLogEntry('info', 'Opening settings panel');
        // In a real implementation, this would open a settings modal
        alert('Settings panel not yet implemented');
    }

    private clearLogs(): void {
        this.logsContent.innerHTML = '';
        this.addLogEntry('info', 'Logs cleared');
    }

    private filterLogs(level: string): void {
        const logEntries = document.querySelectorAll('.log-entry');

        logEntries.forEach(entry => {
            const entryLevel = entry.getAttribute('data-level');
            if (level === 'all' || entryLevel === level) {
                (entry as HTMLElement).style.display = 'flex';
            } else {
                (entry as HTMLElement).style.display = 'none';
            }
        });
    }

    private addLogEntry(level: 'info' | 'warn' | 'error', message: string): void {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry`;
        logEntry.setAttribute('data-level', level);

        const now = new Date();
        const timeString = now.toLocaleTimeString();

        logEntry.innerHTML = `
            <span class="log-time">${timeString}</span>
            <span class="log-level ${level}">${level.toUpperCase()}</span>
            <span class="log-message">${message}</span>
        `;

        this.logsContent.appendChild(logEntry);
        this.logsContent.scrollTop = this.logsContent.scrollHeight;
    }

    private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '500',
            zIndex: '1000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            animation: 'slideIn 0.3s ease-out'
        });

        // Set background color based on type
        const colors = {
            success: '#00ff88',
            error: '#ff6b6b',
            warning: '#ffa500',
            info: '#00d9ff'
        };
        notification.style.background = colors[type];

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the client when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UnifiedAPIHubClient();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .health-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 0.5rem;
    }

    .health-item.healthy {
        border-color: #00ff88;
    }

    .health-item.unhealthy {
        border-color: #ff6b6b;
    }

    .health-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .health-service-name {
        font-weight: 600;
        color: #00d9ff;
    }

    .health-status {
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .health-status.healthy {
        background: #00ff88;
        color: #000;
    }

    .health-status.unhealthy {
        background: #ff6b6b;
        color: #fff;
    }

    .health-item-details {
        display: flex;
        gap: 1rem;
        font-size: 0.9rem;
        opacity: 0.8;
    }
`;
document.head.appendChild(style);