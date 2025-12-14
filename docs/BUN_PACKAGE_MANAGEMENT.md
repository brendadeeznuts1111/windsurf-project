# Bun Package Publishing Guide

This guide covers Bun's package publishing capabilities, including the `bun publish` command and related package management features.

## Publishing Packages

Bun provides a fast and efficient way to publish packages to npm and other registries.

### Basic Publishing

```bash
bun publish
```

This command will:
- Pack your package into a tarball
- Publish it to the configured registry
- Handle authentication and 2FA automatically

### Publishing Output Example

```
Packing...
Packed 42 files (size: 1.1KB, packed size: 0.76KB)
Tag: latest
Access: default
Registry: http://localhost:4873/

 + publish-1@1.0.0
```

### Alternative Publishing Methods

You can also pack and publish separately:

```bash
# Pack the package
bun pm pack

# Publish the tarball
bun publish ./package.tgz
```

**Note:** Lifecycle scripts (`prepublishOnly/prepack/prepare/postpack/publish/postpublish`) are not run when publishing from a tarball. Scripts only execute when Bun packs the package itself.

## Publishing Options

### Access Control

The `--access` flag controls package visibility:

```bash
bun publish --access public
bun publish --access restricted
```

Unscoped packages are always public. Attempting to publish an unscoped package with `--access restricted` will result in an error.

You can also set access in `package.json`:

```json
{
  "publishConfig": {
    "access": "restricted"
  }
}
```

### Version Tags

Set the npm tag for your package version:

```bash
bun publish --tag alpha
bun publish --tag beta
bun publish --tag next
```

By default, packages are tagged as `latest`. The initial version always gets the `latest` tag in addition to any specified tag.

You can also configure tags in `package.json`:

```json
{
  "publishConfig": {
    "tag": "next"
  }
}
```

### Dry Run

Test the publishing process without actually publishing:

```bash
bun publish --dry-run
```

This is useful for verifying package contents before actual publication.

### Tolerate Republish

Exit with code 0 instead of 1 if the package version already exists:

```bash
bun publish --tolerate-republish
```

Useful in CI/CD pipelines where jobs may be re-run.

### Compression Level

Specify gzip compression level (0-9, default is 9):

```bash
bun publish --gzip-level 6
```

Only applies when Bun packs the package (not when using pre-packed tarballs).

## Authentication

### 2FA Support

If you have 2FA enabled, Bun will prompt for a one-time password:

```bash
bun publish --auth-type legacy
# This operation requires a one-time password.
# Enter OTP: 123456
```

You can also provide the OTP directly:

```bash
bun publish --otp 123456
```

### Environment Variables

Bun respects `NPM_CONFIG_TOKEN` for automated publishing in CI/CD:

```bash
export NPM_CONFIG_TOKEN=your_token_here
bun publish
```

## Registry Configuration

### Custom Registry

Specify a custom registry URL:

```bash
bun publish --registry https://my-private-registry.com
```

### SSL Certificates

Provide CA certificates for custom registries:

```bash
# Inline certificate
bun publish --ca "-----BEGIN CERTIFICATE-----..."

# Certificate file
bun publish --cafile ./ca-cert.pem
```

## Advanced Options

### Dependency Management

```bash
# Skip dev dependencies
bun publish --production

# Exclude specific dependency types
bun publish --omit dev
bun publish --omit optional
bun publish --omit peer

# Force latest versions
bun publish --force
```

### Script Control

```bash
# Skip lifecycle scripts
bun publish --ignore-scripts

# Trust packages and run their scripts
bun publish --trust
```

**Note:** When providing a pre-built tarball, lifecycle scripts are not executed. Scripts only run when Bun packs the package itself.

### File Management

```bash
# Don't update package.json or lockfile
bun publish --no-save

# Disallow lockfile changes
bun publish --frozen-lockfile

# Generate yarn.lock (yarn v1 compatible)
bun publish --yarn
```

### Performance Options

```bash
# Platform optimizations
bun publish --backend clonefile  # default
bun publish --backend hardlink
bun publish --backend symlink
bun publish --backend copyfile

# Network concurrency
bun publish --network-concurrency 24
```

## Workers API

Bun provides a Web Workers API implementation for multi-threading:

### Creating Workers

```typescript
// Main thread
const worker = new Worker("./worker.ts");
worker.postMessage("hello");
worker.onmessage = event => {
  console.log(event.data);
};

// Worker thread
declare var self: Worker;
self.onmessage = (event: MessageEvent) => {
  console.log(event.data);
  postMessage("world");
};
```

### Worker Options

```typescript
const worker = new Worker("./worker.ts", {
  preload: ["./load-sentry.js"],  // Load modules before worker starts
  smol: true,                     // Reduce memory usage
  ref: false                      // Don't keep process alive
});
```

### Performance Optimizations

Bun includes optimized fast paths for `postMessage`:

- **String fast path**: Bypass structured clone for pure strings
- **Simple object fast path**: Optimized serialization for plain objects with primitives

Performance improvements: **2-241x faster** than Node.js for common data types.

### Worker Lifecycle

```typescript
// Termination
worker.terminate();

// Lifetime management
worker.unref();  // Don't keep process alive
worker.ref();    // Keep process alive (default)

// Events
worker.addEventListener("open", () => {
  console.log("worker is ready");
});

worker.addEventListener("close", event => {
  console.log("worker closed with code:", event.code);
});
```

### Environment Data Sharing

```typescript
import { setEnvironmentData, getEnvironmentData } from "worker_threads";

// Main thread
setEnvironmentData("config", { apiUrl: "https://api.example.com" });

// Worker thread
const config = getEnvironmentData("config");
```

### Thread Detection

```typescript
if (Bun.isMainThread) {
  console.log("Main thread");
} else {
  console.log("Worker thread");
}
```

## Best Practices

1. **Use semantic versioning** with conventional commits
2. **Test publishing** with `--dry-run` first
3. **Configure access levels** appropriately for your use case
4. **Use version tags** for pre-releases (alpha, beta, rc)
5. **Automate publishing** in CI/CD with proper authentication
6. **Document your publishing process** for team consistency

## Integration with CI/CD

Example GitHub Actions workflow for automated publishing:

```yaml
name: Publish Package
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bun test
      - run: bun publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

This documentation covers Bun's comprehensive package publishing and worker threading capabilities for efficient JavaScript development.</content>
<parameter name="filePath">docs/BUN_PUBLISHING_GUIDE.md