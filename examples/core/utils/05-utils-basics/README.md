# 05 - Utils Basics + Advanced APIs

Benchmarks Bun utilities (stringWidth, escapeHTML) and advanced APIs (FFI, Redis, SQL, Workers).

## Usage
```bash
bun run bun-utils-benchmark.ts
# Outputs: Ops/sec rates vs Node/npm

BenchmarksstringWidth: 6,756x > npm
deepEquals: 60x > lodash
HTTP (implied): 3-4x RPS > Node

RelatedCore: Types (#04)
Advanced: HTTP (#21), Crypto (#26)
Docs: Bun Utils