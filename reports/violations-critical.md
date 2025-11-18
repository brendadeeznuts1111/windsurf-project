# 🚨 CRITICAL ISSUES REPORT

**Generated**: 2025-11-17T23:48:54.940Z
**Critical Issues**: 157

## 🔴 Immediate Action Required


### 1. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/mcp-server/bun-mcp-server.ts:60`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/mcp-server/bun-mcp-server.ts
// Line: 60
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 2. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/mcp-server/bun-mcp-server.ts:85`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/mcp-server/bun-mcp-server.ts
// Line: 85
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 3. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/mcp-server/bun-mcp-server.ts:88`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/mcp-server/bun-mcp-server.ts
// Line: 88
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 4. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:248`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts
// Line: 248
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 5. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:276`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts
// Line: 276
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 6. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:402`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts
// Line: 402
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 7. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:437`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.gzipSync

**Suggestion**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts
// Line: 437
// Wrap with apiTracker.track('Bun.gzipSync', () => { ... })
```

---

### 8. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:442`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deflateSync

**Suggestion**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts
// Line: 442
// Wrap with apiTracker.track('Bun.deflateSync', () => { ... })
```

---

### 9. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:447`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.zstdCompress

**Suggestion**: Wrap with apiTracker.track('Bun.zstdCompress', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts
// Line: 447
// Wrap with apiTracker.track('Bun.zstdCompress', () => { ... })
```

---

### 10. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/pre-commit-validate.ts:34`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/pre-commit-validate.ts
// Line: 34
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 11. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/core/preload.ts:80`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.hash.rapidhash

**Suggestion**: Wrap with apiTracker.track('Bun.hash.rapidhash', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/core/preload.ts
// Line: 80
// Wrap with apiTracker.track('Bun.hash.rapidhash', () => { ... })
```

---

### 12. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/core/preload.ts:83`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stripANSI

**Suggestion**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/core/preload.ts
// Line: 83
// Wrap with apiTracker.track('Bun.stripANSI', () => { ... })
```

---

### 13. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/core/build.ts:91`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.build

**Suggestion**: Wrap with apiTracker.track('Bun.build', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/core/build.ts
// Line: 91
// Wrap with apiTracker.track('Bun.build', () => { ... })
```

---

### 14. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/test/run-all-tests.ts:100`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/test/run-all-tests.ts
// Line: 100
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 15. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/test/test-setup.ts:95`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/test/test-setup.ts
// Line: 95
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 16. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/test/continuous-testing.ts:335`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/test/continuous-testing.ts
// Line: 335
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 17. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/test/continuous-testing.ts:359`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/test/continuous-testing.ts
// Line: 359
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 18. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:249`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts
// Line: 249
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 19. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:285`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts
// Line: 285
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 20. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:390`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts
// Line: 390
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 21. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:414`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts
// Line: 414
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 22. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:462`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts
// Line: 462
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 23. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/automated-setup.ts:512`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/automated-setup.ts
// Line: 512
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 24. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/scripts/generate-rule-dashboard.ts:68`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/scripts/generate-rule-dashboard.ts
// Line: 68
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 25. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-server.ts:27`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-server.ts
// Line: 27
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 26. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-server.ts:262`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-server.ts
// Line: 262
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 27. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/server-v13.ts:21`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/server-v13.ts
// Line: 21
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 28. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/server-v13.ts:31`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/server-v13.ts
// Line: 31
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 29. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/server-v13.ts:79`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/server-v13.ts
// Line: 79
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 30. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-v13-server.ts:24`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-v13-server.ts
// Line: 24
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 31. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-v13-server.ts:52`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-v13-server.ts
// Line: 52
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 32. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-v13-server.ts:115`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-v13-server.ts
// Line: 115
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 33. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/dev.ts:18`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/dev.ts
// Line: 18
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 34. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/dev.ts:28`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/dev.ts
// Line: 28
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 35. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/dev.ts:86`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/dev.ts
// Line: 86
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 36. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/config/yaml-loader.ts:35`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/config/yaml-loader.ts
// Line: 35
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 37. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:30`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 30
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 38. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:33`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 33
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 39. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:38`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 38
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 40. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:41`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 41
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 41. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:45`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 45
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 42. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:48`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 48
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 43. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:78`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 78
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 44. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:79`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 79
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 45. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:82`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 82
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 46. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:83`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 83
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 47. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:86`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 86
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 48. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:87`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 87
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 49. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:93`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 93
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 50. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:94`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 94
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 51. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:95`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 95
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 52. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:96`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 96
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 53. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:105`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 105
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 54. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:106`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 106
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 55. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:107`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 107
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 56. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:115`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 115
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 57. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:120`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stringWidth

**Suggestion**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 120
// Wrap with apiTracker.track('Bun.stringWidth', () => { ... })
```

---

### 58. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:121`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stringWidth

**Suggestion**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 121
// Wrap with apiTracker.track('Bun.stringWidth', () => { ... })
```

---

### 59. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:127`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stringWidth

**Suggestion**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 127
// Wrap with apiTracker.track('Bun.stringWidth', () => { ... })
```

---

### 60. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:131`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.escapeHTML

**Suggestion**: Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 131
// Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })
```

---

### 61. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:133`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.escapeHTML

**Suggestion**: Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 133
// Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })
```

---

### 62. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:137`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stripANSI

**Suggestion**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 137
// Wrap with apiTracker.track('Bun.stripANSI', () => { ... })
```

---

### 63. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:138`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stripANSI

**Suggestion**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 138
// Wrap with apiTracker.track('Bun.stripANSI', () => { ... })
```

---

### 64. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:144`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 144
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 65. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:146`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 146
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 66. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:158`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.gzipSync

**Suggestion**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 158
// Wrap with apiTracker.track('Bun.gzipSync', () => { ... })
```

---

### 67. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:159`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.gunzipSync

**Suggestion**: Wrap with apiTracker.track('Bun.gunzipSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 159
// Wrap with apiTracker.track('Bun.gunzipSync', () => { ... })
```

---

### 68. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:163`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.gzipSync

**Suggestion**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 163
// Wrap with apiTracker.track('Bun.gzipSync', () => { ... })
```

---

### 69. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:166`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deflateSync

**Suggestion**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 166
// Wrap with apiTracker.track('Bun.deflateSync', () => { ... })
```

---

### 70. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:167`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.inflateSync

**Suggestion**: Wrap with apiTracker.track('Bun.inflateSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 167
// Wrap with apiTracker.track('Bun.inflateSync', () => { ... })
```

---

### 71. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:171`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deflateSync

**Suggestion**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts
// Line: 171
// Wrap with apiTracker.track('Bun.deflateSync', () => { ... })
```

---

### 72. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:83`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.gzipSync

**Suggestion**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 83
// Wrap with apiTracker.track('Bun.gzipSync', () => { ... })
```

---

### 73. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:84`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.gunzipSync

**Suggestion**: Wrap with apiTracker.track('Bun.gunzipSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 84
// Wrap with apiTracker.track('Bun.gunzipSync', () => { ... })
```

---

### 74. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:90`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deflateSync

**Suggestion**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 90
// Wrap with apiTracker.track('Bun.deflateSync', () => { ... })
```

---

### 75. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:91`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.inflateSync

**Suggestion**: Wrap with apiTracker.track('Bun.inflateSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 91
// Wrap with apiTracker.track('Bun.inflateSync', () => { ... })
```

---

### 76. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:108`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stringWidth

**Suggestion**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 108
// Wrap with apiTracker.track('Bun.stringWidth', () => { ... })
```

---

### 77. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:114`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stripANSI

**Suggestion**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 114
// Wrap with apiTracker.track('Bun.stripANSI', () => { ... })
```

---

### 78. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:115`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stripANSI

**Suggestion**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 115
// Wrap with apiTracker.track('Bun.stripANSI', () => { ... })
```

---

### 79. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:119`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.escapeHTML

**Suggestion**: Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 119
// Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })
```

---

### 80. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:123`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stringWidth

**Suggestion**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 123
// Wrap with apiTracker.track('Bun.stringWidth', () => { ... })
```

---

### 81. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:124`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stringWidth

**Suggestion**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 124
// Wrap with apiTracker.track('Bun.stringWidth', () => { ... })
```

---

### 82. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:125`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stringWidth

**Suggestion**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 125
// Wrap with apiTracker.track('Bun.stringWidth', () => { ... })
```

---

### 83. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:126`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stringWidth

**Suggestion**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 126
// Wrap with apiTracker.track('Bun.stringWidth', () => { ... })
```

---

### 84. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:127`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stripANSI

**Suggestion**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 127
// Wrap with apiTracker.track('Bun.stripANSI', () => { ... })
```

---

### 85. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:136`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 136
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 86. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:137`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 137
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 87. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:147`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 147
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 88. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:148`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 148
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 89. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:149`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 149
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 90. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:150`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 150
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 91. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:177`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 177
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 92. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:196`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 196
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 93. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:197`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 197
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 94. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:200`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 200
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 95. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:201`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 201
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 96. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:202`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 202
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 97. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:205`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 205
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 98. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:206`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 206
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 99. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:209`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 209
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 100. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:212`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 212
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 101. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:213`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 213
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 102. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:214`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts
// Line: 214
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 103. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/utils.ts:363`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/utils.ts
// Line: 363
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 104. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/utils.ts:459`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/utils.ts
// Line: 459
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 105. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/utils.ts:637`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/utils.ts
// Line: 637
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 106. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-complete-apis.ts:26`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.build

**Suggestion**: Wrap with apiTracker.track('Bun.build', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-complete-apis.ts
// Line: 26
// Wrap with apiTracker.track('Bun.build', () => { ... })
```

---

### 107. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-complete-apis.ts:162`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.SQL

**Suggestion**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-complete-apis.ts
// Line: 162
// Wrap with apiTracker.track('Bun.SQL', () => { ... })
```

---

### 108. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-complete-apis.ts:385`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-complete-apis.ts
// Line: 385
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 109. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/__tests__/integration.test.ts:24`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/__tests__/integration.test.ts
// Line: 24
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 110. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts:19`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts
// Line: 19
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 111. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts:90`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts
// Line: 90
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 112. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts:158`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.spawn

**Suggestion**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts
// Line: 158
// Wrap with apiTracker.track('Bun.spawn', () => { ... })
```

---

### 113. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts:349`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts
// Line: 349
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 114. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/error/error-handler.ts:157`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/error/error-handler.ts
// Line: 157
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 115. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/error/error-handler.ts:180`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/error/error-handler.ts
// Line: 180
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 116. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/error/error-handler.ts:181`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/error/error-handler.ts
// Line: 181
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 117. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:36`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.gzipSync

**Suggestion**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 36
// Wrap with apiTracker.track('Bun.gzipSync', () => { ... })
```

---

### 118. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:38`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deflateSync

**Suggestion**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 38
// Wrap with apiTracker.track('Bun.deflateSync', () => { ... })
```

---

### 119. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:40`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.zstdCompress

**Suggestion**: Wrap with apiTracker.track('Bun.zstdCompress', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 40
// Wrap with apiTracker.track('Bun.zstdCompress', () => { ... })
```

---

### 120. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:49`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.gunzipSync

**Suggestion**: Wrap with apiTracker.track('Bun.gunzipSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 49
// Wrap with apiTracker.track('Bun.gunzipSync', () => { ... })
```

---

### 121. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:51`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.inflateSync

**Suggestion**: Wrap with apiTracker.track('Bun.inflateSync', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 51
// Wrap with apiTracker.track('Bun.inflateSync', () => { ... })
```

---

### 122. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:53`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.zstdDecompress

**Suggestion**: Wrap with apiTracker.track('Bun.zstdDecompress', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 53
// Wrap with apiTracker.track('Bun.zstdDecompress', () => { ... })
```

---

### 123. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:92`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 92
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 124. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:96`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 96
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 125. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:100`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.sleep

**Suggestion**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 100
// Wrap with apiTracker.track('Bun.sleep', () => { ... })
```

---

### 126. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:105`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.escapeHTML

**Suggestion**: Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 105
// Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })
```

---

### 127. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:110`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stringWidth

**Suggestion**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 110
// Wrap with apiTracker.track('Bun.stringWidth', () => { ... })
```

---

### 128. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:115`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.deepEquals

**Suggestion**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 115
// Wrap with apiTracker.track('Bun.deepEquals', () => { ... })
```

---

### 129. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:124`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.peek

**Suggestion**: Wrap with apiTracker.track('Bun.peek', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 124
// Wrap with apiTracker.track('Bun.peek', () => { ... })
```

---

### 130. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:129`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 129
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 131. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:138`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.stripANSI

**Suggestion**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts
// Line: 138
// Wrap with apiTracker.track('Bun.stripANSI', () => { ... })
```

---

### 132. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/resource-management-rule.ts:28`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.file

**Suggestion**: Wrap with apiTracker.track('Bun.file', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/resource-management-rule.ts
// Line: 28
// Wrap with apiTracker.track('Bun.file', () => { ... })
```

---

### 133. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/resource-management-rule.ts:42`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.SQL

**Suggestion**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/resource-management-rule.ts
// Line: 42
// Wrap with apiTracker.track('Bun.SQL', () => { ... })
```

---

### 134. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:10`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 10
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 135. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:11`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.SQL

**Suggestion**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 11
// Wrap with apiTracker.track('Bun.SQL', () => { ... })
```

---

### 136. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:12`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.SQL

**Suggestion**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 12
// Wrap with apiTracker.track('Bun.SQL', () => { ... })
```

---

### 137. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:13`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.Redis

**Suggestion**: Wrap with apiTracker.track('Bun.Redis', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 13
// Wrap with apiTracker.track('Bun.Redis', () => { ... })
```

---

### 138. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:14`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.Redis

**Suggestion**: Wrap with apiTracker.track('Bun.Redis', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 14
// Wrap with apiTracker.track('Bun.Redis', () => { ... })
```

---

### 139. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:15`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.YAML

**Suggestion**: Wrap with apiTracker.track('Bun.YAML', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 15
// Wrap with apiTracker.track('Bun.YAML', () => { ... })
```

---

### 140. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:16`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.YAML

**Suggestion**: Wrap with apiTracker.track('Bun.YAML', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 16
// Wrap with apiTracker.track('Bun.YAML', () => { ... })
```

---

### 141. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:17`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.zstdCompress

**Suggestion**: Wrap with apiTracker.track('Bun.zstdCompress', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 17
// Wrap with apiTracker.track('Bun.zstdCompress', () => { ... })
```

---

### 142. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:18`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.CSRF

**Suggestion**: Wrap with apiTracker.track('Bun.CSRF', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 18
// Wrap with apiTracker.track('Bun.CSRF', () => { ... })
```

---

### 143. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:20`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 20
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 144. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:21`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 21
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 145. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:22`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.SQL

**Suggestion**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 22
// Wrap with apiTracker.track('Bun.SQL', () => { ... })
```

---

### 146. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:23`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.SQL

**Suggestion**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 23
// Wrap with apiTracker.track('Bun.SQL', () => { ... })
```

---

### 147. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:24`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.Redis

**Suggestion**: Wrap with apiTracker.track('Bun.Redis', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 24
// Wrap with apiTracker.track('Bun.Redis', () => { ... })
```

---

### 148. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/error-handling-rule.ts:28`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.SQL

**Suggestion**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/error-handling-rule.ts
// Line: 28
// Wrap with apiTracker.track('Bun.SQL', () => { ... })
```

---

### 149. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/stay-updated-rule.ts:14`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.serve

**Suggestion**: Wrap with apiTracker.track('Bun.serve', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/stay-updated-rule.ts
// Line: 14
// Wrap with apiTracker.track('Bun.serve', () => { ... })
```

---

### 150. Track API Usage

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/bun-optimizations-rule.ts:29`
**Category**: monitoring
**Effort**: moderate

**Issue**: Untracked Bun API call: Bun.SQL

**Suggestion**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/bun-optimizations-rule.ts
// Line: 29
// Wrap with apiTracker.track('Bun.SQL', () => { ... })
```

---

### 151. Error Handling

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/resource-management-rule.ts:42`
**Category**: security
**Effort**: complex

**Issue**: Database operation without error handling

**Suggestion**: Wrap in try-catch or use withRetry utility

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/resource-management-rule.ts
// Line: 42
// Wrap in try-catch or use withRetry utility
```

---

### 152. Error Handling

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/track-api-usage-rule.ts:11`
**Category**: security
**Effort**: complex

**Issue**: Database operation without error handling

**Suggestion**: Wrap in try-catch or use withRetry utility

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/track-api-usage-rule.ts
// Line: 11
// Wrap in try-catch or use withRetry utility
```

---

### 153. Error Handling

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:11`
**Category**: security
**Effort**: complex

**Issue**: Database operation without error handling

**Suggestion**: Wrap in try-catch or use withRetry utility

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 11
// Wrap in try-catch or use withRetry utility
```

---

### 154. Error Handling

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:12`
**Category**: security
**Effort**: complex

**Issue**: Database operation without error handling

**Suggestion**: Wrap in try-catch or use withRetry utility

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 12
// Wrap in try-catch or use withRetry utility
```

---

### 155. Error Handling

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:22`
**Category**: security
**Effort**: complex

**Issue**: Database operation without error handling

**Suggestion**: Wrap in try-catch or use withRetry utility

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 22
// Wrap in try-catch or use withRetry utility
```

---

### 156. Error Handling

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:23`
**Category**: security
**Effort**: complex

**Issue**: Database operation without error handling

**Suggestion**: Wrap in try-catch or use withRetry utility

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts
// Line: 23
// Wrap in try-catch or use withRetry utility
```

---

### 157. Error Handling

**File**: `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/bun-optimizations-rule.ts:29`
**Category**: security
**Effort**: complex

**Issue**: Database operation without error handling

**Suggestion**: Wrap in try-catch or use withRetry utility

**Code Context**:
```typescript
// File: /Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/bun-optimizations-rule.ts
// Line: 29
// Wrap in try-catch or use withRetry utility
```

---


## 🎯 Fix Strategy

1. **Error Handling Violations**: Add try-catch blocks with retry logic
2. **API Usage Violations**: Implement apiTracker.track() wrapper
3. **Security Issues**: Review and fix resource management

## ⏰ Timeline

- **Immediate**: Today - Critical security and error handling
- **Week 1**: API tracking and monitoring setup
- **Week 2**: Remaining critical issues

---
*Critical issues must be resolved before next deployment*
