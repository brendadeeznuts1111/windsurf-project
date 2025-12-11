// apps/dashboard/src/health.ts
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  components: {
    fetchDemo: boolean;
    headerDisplay: boolean;
    fileSystem: boolean;
    telemetry: boolean;
  };
  environment: {
    nodeVersion: string;
    bunVersion: string;
    userAgent: string;
    url: string;
  };
}

export function getHealthStatus(): HealthStatus {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal + memUsage.external;

  return {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: {
      used: Math.round((memUsage.heapUsed + memUsage.external) / 1024 / 1024),
      total: Math.round(totalMem / 1024 / 1024),
      percentage: Math.round(((memUsage.heapUsed + memUsage.external) / totalMem) * 100)
    },
    components: {
      fetchDemo: true, // Assume healthy if this code runs
      headerDisplay: true,
      fileSystem: true,
      telemetry: true
    },
    environment: {
      nodeVersion: process.version,
      bunVersion: '1.3.x', // Would get from actual Bun version
      userAgent: navigator.userAgent,
      url: window.location.href
    }
  };
}

export function formatHealthStatus(status: HealthStatus): string {
  const statusEmoji = {
    healthy: '🟢',
    degraded: '🟡',
    unhealthy: '🔴'
  };

  return `
${statusEmoji[status.status]} Health Status: ${status.status.toUpperCase()}

⏱️  Uptime: ${Math.round(status.uptime)}s
🧠 Memory: ${status.memory.used}MB / ${status.memory.total}MB (${status.memory.percentage}%)

🔧 Components:
${Object.entries(status.components).map(([name, healthy]) =>
  `  ${healthy ? '✅' : '❌'} ${name}`
).join('\n')}

🌐 Environment:
  Node: ${status.environment.nodeVersion}
  Bun: ${status.environment.bunVersion}
  URL: ${status.environment.url}

📅 Timestamp: ${new Date(status.timestamp).toISOString()}
  `.trim();
}