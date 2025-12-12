# 04 - Types Integration

Demonstrates Bun's native TypeScript support:
- Runtime typing with `typeof`.
- Type-safe APIs (e.g., `BunFile`, `ServerWebSocket`).
- Deep equality checks.

## Usage
```bash
bun run bun-types-integration.ts
# Visit http://localhost:3001
# Send WS message: echo "Hello TS!" | wscat -c ws://localhost:3001/ws
```

## Performance Notes
- Type inference: Instant (no tsc overhead).
- DeepEquals: 60x faster deep equals vs lodash.

## Related
- Core: File System (#01)
- Advanced: HTTP Server (#21)
- Docs: [Bun TypeScript](https://bun.sh/docs/typescript)