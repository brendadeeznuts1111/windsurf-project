/**
 * Dynamic Repository Detection Service
 * DOMAIN: devops.repository
 * SPEC: EX083
 * PR: #1273 - Replace hardcoded utahj4754/windsurf-project values
 * STATUS: pr-approved #1273
 * TAGS: devops, observability, dynamic-config, security-audit
 * SECURITY: No hardcoded secrets, safe for public repos
 */

import { $ } from "bun";
import { logger } from "../../examples/logging/bun-logger";

export interface RepositoryInfo {
  owner: string;
  name: string;
  fullName: string;
  commitHash: string;
  branch: string;
  isDirty: boolean;
  remoteURL: string;
  detectionMethod: "git-remote" | "package-json" | "env-vars" | "gh-cli" | "bunfig";
  detectedAt: string;
}

export class BunRepositoryDetectorService {
  /**
   * Detect repository owner with fallback chain
   * STATUS: pr-approved #1273
   * SECURITY: No hardcoded values, all from environment or git
   */
  public async detectOwner(): Promise<string> {
    // 1. GitHub Actions environment (highest priority in CI)
    if (process.env.GITHUB_REPOSITORY_OWNER) {
      this.logDetection("owner", "env-vars", process.env.GITHUB_REPOSITORY_OWNER);
      return process.env.GITHUB_REPOSITORY_OWNER;
    }

    // 2. Git remote URL
    try {
      const remoteURL = await this.getGitRemoteURL();
      const owner = this.parseOwnerFromURL(remoteURL);
      if (owner) {
        this.logDetection("owner", "git-remote", owner);
        return owner;
      }
    } catch (error) {
      logger.debug("Git remote detection failed");
    }

    // 3. package.json repository field
    try {
      const pkg = await this.getPackageJSON();
      if (pkg.repository?.url) {
        const owner = this.parseOwnerFromURL(pkg.repository.url);
        if (owner) {
          this.logDetection("owner", "package-json", owner);
          return owner;
        }
      }
    } catch (error) {
      logger.debug("package.json detection failed");
    }

    // 4. GitHub CLI (if available)
    try {
      const ghAvailable = await Bun.which("gh");
      if (ghAvailable) {
        const result = await $`gh api user --jq .login`.quiet();
        const owner = result.stdout.toString().trim();
        if (owner) {
          this.logDetection("owner", "gh-cli", owner);
          return owner;
        }
      }
    } catch (error) {
      logger.debug("gh-cli detection failed");
    }

    // 5. Fallback to unknown
    const fallback = "unknown-owner";
    logger.warn("Could not detect repository owner");
    return fallback;
  }

  /**
   * Detect repository name
   * STATUS: pr-approved #1273
   */
  public async detectName(): Promise<string> {
    // 1. GitHub Actions full repository name
    if (process.env.GITHUB_REPOSITORY) {
      const name = process.env.GITHUB_REPOSITORY.split("/")[1];
      this.logDetection("name", "env-vars", name);
      return name;
    }

    // 2. Git remote URL
    try {
      const remoteURL = await this.getGitRemoteURL();
      const name = this.parseNameFromURL(remoteURL);
      if (name) {
        this.logDetection("name", "git-remote", name);
        return name;
      }
    } catch (error) {
      logger.debug("Git remote name detection failed");
    }

    // 3. package.json name field
    try {
      const pkg = await this.getPackageJSON();
      if (pkg.name) {
        // Remove @scope/ if present
        const name = pkg.name.includes("/")
          ? pkg.name.split("/")[1]
          : pkg.name;
        this.logDetection("name", "package-json", name);
        return name;
      }
    } catch (error) {
      logger.debug("package.json name detection failed");
    }

    // 4. Current directory name
    try {
      const cwd = process.cwd();
      const name = cwd.split("/").pop() || "unnamed";
      this.logDetection("name", "filesystem", name);
      return name;
    } catch (error) {
      logger.debug("Directory name detection failed");
    }

    const fallback = "unnamed-repo";
    logger.warn("Could not detect repository name");
    return fallback;
  }

  /**
   * Detect commit hash for build reproducibility
   * STATUS: pr-approved #1273
   */
  public async detectCommit(): Promise<string> {
    try {
      const result = await $`git rev-parse HEAD`.quiet();
      const commit = result.stdout.toString().trim();
      return commit;
    } catch (error) {
      logger.debug("Git commit detection failed");
      return "unknown-commit";
    }
  }

  /**
   * Detect branch name
   * STATUS: pr-approved #1273
   */
  public async detectBranch(): Promise<string> {
    try {
      const result = await $`git branch --show-current`.quiet();
      const branch = result.stdout.toString().trim();
      return branch;
    } catch (error) {
      logger.debug("Git branch detection failed");
      return "unknown-branch";
    }
  }

  /**
   * Detect if working directory is dirty
   * STATUS: pr-approved #1273
   */
  public async isDirty(): Promise<boolean> {
    try {
      const result = await $`git status --porcelain`.quiet();
      const isDirty = result.stdout.toString().trim().length > 0;
      return isDirty;
    } catch (error) {
      logger.debug("Git dirty check failed");
      return false;
    }
  }

  /**
   * Get full repository information
   * STATUS: pr-approved #1273
   */
  public async getFullInfo(): Promise<RepositoryInfo> {
    const start = Bun.nanoseconds();
    const [owner, name, commitHash, branch, isDirty] = await Promise.all([
      this.detectOwner(),
      this.detectName(),
      this.detectCommit(),
      this.detectBranch(),
      this.isDirty(),
    ]);

    const fullName = `${owner}/${name}`;

    // Get remote URL
    let remoteURL = "unknown";
    try {
      remoteURL = await this.getGitRemoteURL();
    } catch (error) {
      logger.debug("Remote URL detection failed");
    }

    const info: RepositoryInfo = {
      owner,
      name,
      fullName,
      commitHash,
      branch,
      isDirty,
      remoteURL,
      detectionMethod: "git-remote",
      detectedAt: new Date().toISOString(),
    };

    logger.info("Repository info detected", {
      owner,
      name,
      fullName,
      detection_duration_ms: (Bun.nanoseconds() - start) / 1_000_000,
    });

    return info;
  }

  private async getGitRemoteURL(): Promise<string> {
    const result = await $`git remote get-url origin`.quiet();
    return result.stdout.toString().trim();
  }

  private parseOwnerFromURL(url: string): string | null {
    // git@github.com:owner/repo.git
    // https://github.com/owner/repo.git
    const match = url.match(/github\.com[:/]([^/]+)/);
    return match ? match[1] : null;
  }

  private parseNameFromURL(url: string): string | null {
    const match = url.match(/github\.com[:/][^/]+\/([^.]+)/);
    return match ? match[1] : null;
  }

  private async getPackageJSON(): Promise<any> {
    const pkgFile = Bun.file("package.json");
    return JSON.parse(await pkgFile.text());
  }

  private logDetection(field: string, method: string, value: string): void {
    logger.debug(`Repository ${field} detected via ${method}: ${value}`);
  }
}

// CLI interface for setup scripts
export async function detectRepository() {
  const detector = new BunRepositoryDetectorService();
  const info = await detector.getFullInfo();

  // Export for shell scripts
  console.log(`REPO_OWNER="${info.owner}"`);
  console.log(`REPO_NAME="${info.name}"`);
  console.log(`COMMIT_HASH="${info.commitHash}"`);
  console.log(`BRANCH="${info.branch}"`);
  console.log(`IS_DIRTY="${info.isDirty}"`);

  return info;
}

// CLI execution
if (import.meta.main) {
  detectRepository();
}

// Usage in setup scripts:
// eval $(bun run src/devops/detect-repo.ts)