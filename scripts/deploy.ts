#!/usr/bin/env bun

import { $ } from 'bun';

interface DeployResult {
  success: boolean;
  service: string;
  duration: number;
  error?: string;
}

class Deployer {
  private services: string[] = [
    'apps/api-gateway',
    'apps/stream-processor',
    'apps/dashboard'
  ];

  async deployAll(): Promise<void> {
    console.log('🚀 Deploying all services with Bun optimization...\n');
    
    // First build all packages using Bun shell
    console.log('📦 Building packages before deployment...');
    await $`bun run scripts/build.ts --production --bun`;
    
    // Run tests with Bun's optimized runner
    console.log('🧪 Running tests with Bun...');
    await $`bun test --coverage --bun`;
    
    const results: DeployResult[] = [];
    const startTime = Date.now();

    for (const service of this.services) {
      const result = await this.deployService(service);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${service} - ${result.duration}ms`);
      } else {
        console.log(`❌ ${service} - ${result.error}`);
      }
    }

    // Run health checks with Bun's fetch
    await this.runHealthChecks();

    const totalTime = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📊 Deploy Summary:`);
    console.log(`   Total: ${results.length} services`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total time: ${totalTime}ms`);

    if (failed > 0) {
      console.log('\n❌ Deployment failed for some services');
      process.exit(1);
    } else {
      console.log('\n✅ All services deployed successfully');
    }
  }

  async deployService(servicePath: string): Promise<DeployResult> {
    const startTime = Date.now();

    try {
      // Deploy based on service type using Bun shell
      if (servicePath.includes('api-gateway')) {
        await this.deployCloudflareWorker(servicePath);
      } else if (servicePath.includes('dashboard')) {
        await this.deployWebApp(servicePath);
      } else if (servicePath.includes('stream-processor')) {
        await this.deployStreamProcessor(servicePath);
      } else {
        throw new Error(`Unknown service type: ${servicePath}`);
      }

      return {
        success: true,
        service: servicePath,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        service: servicePath,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async deployCloudflareWorker(servicePath: string): Promise<void> {
    console.log(`🌐 Deploying Cloudflare Worker: ${servicePath}`);
    
    // Use Bun shell for deployment
    const result = await $`cd ${servicePath} && bunx wrangler deploy`.nothrow();
    
    if (!result.success) {
      throw new Error(`Wrangler deploy failed: ${result.stderr?.toString()}`);
    }
  }

  private async deployWebApp(servicePath: string): Promise<void> {
    console.log(`🌍 Deploying Web App: ${servicePath}`);
    
    // Build the app using Bun
    await $`cd ${servicePath} && bun run build --bun`;

    console.log(`📦 Web app built successfully`);
    
    // Example deployment commands (commented out):
    // await $`cd ${servicePath} && aws s3 sync dist/ s3://your-bucket`;
    // await $`cd ${servicePath} && firebase deploy`;
  }

  private async deployStreamProcessor(servicePath: string): Promise<void> {
    console.log(`⚡ Deploying Stream Processor: ${servicePath}`);
    
    // Build the service using Bun
    await $`cd ${servicePath} && bun run build --bun`;

    console.log(`🔧 Stream processor built successfully`);
    
    // Example deployment commands (commented out):
    // await $`cd ${servicePath} && docker build -t stream-processor .`;
    // await $`docker push your-registry/stream-processor`;
    // await $`kubectl apply -f k8s/`;
  }

  async runHealthChecks(): Promise<void> {
    console.log('\n🏥 Running health checks...');
    
    const services = [
      { name: 'API Gateway', url: 'https://api.odds-protocol.com/health' },
      { name: 'Dashboard', url: 'https://odds-protocol.com/health' },
      { name: 'WebSocket', url: 'https://ws.odds-protocol.com/health' }
    ];

    for (const service of services) {
      try {
        const response = await fetch(service.url, {
          method: 'GET',
          headers: { 'User-Agent': 'Odds-Protocol-Deployer/1.0' }
        });
        
        if (response.ok) {
          console.log(`✅ ${service.name}: Healthy`);
        } else {
          console.log(`⚠️  ${service.name}: HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${service.name}: ${error}`);
      }
    }
  }

  async deploySingle(serviceName: string): Promise<void> {
    const servicePath = this.services.find(s => s.includes(serviceName));
    
    if (!servicePath) {
      console.error(`❌ Service '${serviceName}' not found`);
      console.log('Available services:', this.services);
      process.exit(1);
    }

    console.log(`🚀 Deploying single service: ${servicePath}`);
    
    const result = await this.deployService(servicePath);
    
    if (result.success) {
      console.log(`✅ ${servicePath} deployed successfully in ${result.duration}ms`);
      await this.runHealthChecks();
    } else {
      console.log(`❌ ${servicePath} deployment failed: ${result.error}`);
      process.exit(1);
    }
  }

  async listServices(): Promise<void> {
    console.log('📋 Available services:');
    this.services.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service}`);
    });
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const serviceName = process.argv[3];
  const environment = process.argv[4] || 'staging';
  const deployer = new Deployer();

  console.log(`🚀 Deploying Odds Protocol to ${environment}...`);

  switch (command) {
    case 'list':
      await deployer.listServices();
      break;
    case 'single':
      if (!serviceName) {
        console.error('❌ Service name required for single deployment');
        console.log('Usage: bun run scripts/deploy.ts single <service-name> [environment]');
        process.exit(1);
      }
      await deployer.deploySingle(serviceName);
      break;
    case 'all':
    default:
      await deployer.deployAll();
      break;
  }

  console.log('✅ Deployment completed!');
}

if (import.meta.main) {
  main().catch(error => {
    console.error('Deploy script failed:', error);
    process.exit(1);
  });
}

export { Deployer };
