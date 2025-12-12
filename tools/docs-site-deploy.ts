#!/usr/bin/env bun
// docs-site-deploy.ts - Deploy documentation site to various platforms

import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface DeployOptions {
  platform: 'github-pages' | 'vercel' | 'surge' | 'netlify';
  build?: boolean;
  preview?: boolean;
  domain?: string;
}

class DocsSiteDeployer {
  private docsDir = 'docs-site';

  async deploy(options: DeployOptions): Promise<void> {
    console.log(`🚀 Deploying docs site to ${options.platform}\n`);

    // Build the site if requested
    if (options.build) {
      console.log('📦 Building documentation site...');
      await this.buildSite();
      console.log('✅ Site built successfully\n');
    }

    // Check if docs directory exists
    if (!existsSync(this.docsDir)) {
      throw new Error(`Documentation directory '${this.docsDir}' not found. Run the generator first.`);
    }

    // Deploy based on platform
    switch (options.platform) {
      case 'github-pages':
        await this.deployToGitHubPages(options);
        break;
      case 'vercel':
        await this.deployToVercel(options);
        break;
      case 'surge':
        await this.deployToSurge(options);
        break;
      case 'netlify':
        await this.deployToNetlify(options);
        break;
      default:
        throw new Error(`Unsupported platform: ${options.platform}`);
    }
  }

  private async buildSite(): Promise<void> {
    try {
      execSync('bun run tools/docs-site-generator.ts', { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Failed to build site: ${error}`);
    }
  }

  private async deployToGitHubPages(options: DeployOptions): Promise<void> {
    console.log('📄 Deploying to GitHub Pages...');

    // Check if this is a GitHub repository
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
      const repoName = this.extractRepoName(remoteUrl);

      console.log(`Repository: ${repoName}`);

      // Create .nojekyll file to prevent Jekyll processing
      execSync(`touch ${this.docsDir}/.nojekyll`);

      // Create CNAME file if domain is specified
      if (options.domain) {
        execSync(`echo "${options.domain}" > ${this.docsDir}/CNAME`);
      }

      // Use gh-pages or git for deployment
      if (this.hasGhCli()) {
        console.log('Using GitHub CLI for deployment...');
        execSync(`npx gh-pages -d ${this.docsDir} --yes`, { stdio: 'inherit' });
      } else {
        console.log('Using git for deployment...');
        await this.deployWithGit();
      }

      const url = options.domain ? `https://${options.domain}` : `https://${repoName}.github.io`;
      console.log(`✅ Deployed to: ${url}`);

    } catch (error) {
      throw new Error(`GitHub Pages deployment failed: ${error}`);
    }
  }

  private async deployToVercel(options: DeployOptions): Promise<void> {
    console.log('▲ Deploying to Vercel...');

    try {
      // Check if Vercel CLI is available
      execSync('vercel --version', { stdio: 'pipe' });

      const deployCmd = options.preview ? 'vercel --prod=false' : 'vercel --prod';
      execSync(`cd ${this.docsDir} && ${deployCmd}`, { stdio: 'inherit' });

      console.log('✅ Deployed to Vercel');

    } catch (error) {
      // Fallback: suggest manual deployment
      console.log('❌ Vercel CLI not found. To deploy manually:');
      console.log(`   cd ${this.docsDir}`);
      console.log('   npx vercel --prod');
    }
  }

  private async deployToSurge(options: DeployOptions): Promise<void> {
    console.log('⚡ Deploying to Surge...');

    try {
      const domain = options.domain || this.generateSurgeDomain();
      execSync(`npx surge ${this.docsDir} ${domain}`, { stdio: 'inherit' });

      console.log(`✅ Deployed to: https://${domain}`);

    } catch (error) {
      console.log('❌ Surge deployment failed. Make sure you have Surge CLI installed and authenticated.');
      throw error;
    }
  }

  private async deployToNetlify(options: DeployOptions): Promise<void> {
    console.log('🌐 Deploying to Netlify...');

    try {
      // Check if Netlify CLI is available
      execSync('netlify --version', { stdio: 'pipe' });

      const deployCmd = options.preview ? 'netlify deploy' : 'netlify deploy --prod';
      execSync(`cd ${this.docsDir} && ${deployCmd}`, { stdio: 'inherit' });

      console.log('✅ Deployed to Netlify');

    } catch (error) {
      console.log('❌ Netlify CLI not found. To deploy manually:');
      console.log(`   cd ${this.docsDir}`);
      console.log('   npx netlify deploy --prod');
    }
  }

  private async deployWithGit(): Promise<void> {
    const deployBranch = 'gh-pages';
    const tempDir = '/tmp/docs-deploy';

    try {
      // Create temporary directory
      execSync(`rm -rf ${tempDir}`);
      execSync(`mkdir -p ${tempDir}`);

      // Copy docs site to temp directory
      execSync(`cp -r ${this.docsDir}/* ${tempDir}/`);

      // Initialize git repo in temp directory
      execSync(`cd ${tempDir} && git init`);
      execSync(`cd ${tempDir} && git add .`);
      execSync(`cd ${tempDir} && git commit -m "Deploy documentation site"`);

      // Push to gh-pages branch
      execSync(`cd ${tempDir} && git push https://github.com/${this.getRepoSlug()}.git master:${deployBranch} --force`);

      console.log(`✅ Pushed to ${deployBranch} branch`);

    } catch (error) {
      throw new Error(`Git deployment failed: ${error}`);
    } finally {
      execSync(`rm -rf ${tempDir}`);
    }
  }

  private hasGhCli(): boolean {
    try {
      execSync('gh --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  private extractRepoName(remoteUrl: string): string {
    // Extract owner/repo from git URL
    const match = remoteUrl.match(/github\.com[\/:]([^\/]+\/[^\/]+?)(\.git)?$/);
    if (!match) throw new Error('Could not extract repository name from git remote URL');
    return match[1];
  }

  private getRepoSlug(): string {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
    return this.extractRepoName(remoteUrl);
  }

  private generateSurgeDomain(): string {
    const repoSlug = this.getRepoSlug().replace('/', '-');
    const timestamp = Date.now();
    return `${repoSlug}-${timestamp}.surge.sh`;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
🌐 Documentation Site Deployer

Deploy your Bun documentation site to various platforms.

Usage: bun run docs-site-deploy.ts [platform] [options]

Platforms:
  github-pages    Deploy to GitHub Pages
  vercel          Deploy to Vercel
  surge           Deploy to Surge.sh
  netlify         Deploy to Netlify

Options:
  --build         Build the site before deploying
  --preview       Deploy as preview (not production)
  --domain=<url>  Custom domain for deployment
  --help, -h      Show this help message

Examples:
  bun run docs-site-deploy.ts github-pages --build
  bun run docs-site-deploy.ts surge --domain=my-docs.surge.sh
  bun run docs-site-deploy.ts vercel --preview
`);
    return;
  }

  const platform = args[0] as DeployOptions['platform'];
  const validPlatforms = ['github-pages', 'vercel', 'surge', 'netlify'];

  if (!validPlatforms.includes(platform)) {
    console.error(`❌ Invalid platform: ${platform}`);
    console.log(`Valid platforms: ${validPlatforms.join(', ')}`);
    process.exit(1);
  }

  const options: DeployOptions = {
    platform,
    build: args.includes('--build'),
    preview: args.includes('--preview'),
  };

  // Parse domain option
  const domainArg = args.find(arg => arg.startsWith('--domain='));
  if (domainArg) {
    options.domain = domainArg.split('=')[1];
  }

  try {
    const deployer = new DocsSiteDeployer();
    await deployer.deploy(options);
    console.log('\n🎉 Deployment completed successfully!');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}