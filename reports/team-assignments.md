# 👥 TEAM ASSIGNMENTS - CRITICAL VIOLATIONS

**Generated**: 2025-11-17T23:51:19.903Z
**Total Violations**: 157
**Team Members**: 4

## 📊 Overview

| Team Member | Role | Violations | Est. Days | Focus Area |
|-------------|------|------------|-----------|------------|
| Alex Chen | Lead Developer | 42 | 9 | monitoring |
| Emily Davis | Junior Developer | 35 | 12 | monitoring |
| Mike Wilson | Senior Developer | 35 | 9 | monitoring |
| Sarah Johnson | Senior Developer | 45 | 12 | monitoring |

## 🎯 Detailed Assignments


### Alex Chen - Lead Developer

**Capacity**: 42 violations  
**Estimated Time**: 9 days  
**Effort Level**: complex

#### Assigned Violations


1. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/core/preload.ts:83`
   - **Issue**: Untracked Bun API call: Bun.stripANSI
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

2. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/test/continuous-testing.ts:359`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

3. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:390`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

4. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-server.ts:27`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

5. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/server-v13.ts:31`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

6. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/dev.ts:18`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

7. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/config/yaml-loader.ts:35`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

8. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:45`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

9. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:79`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

10. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:93`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

11. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:96`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

12. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:120`
   - **Issue**: Untracked Bun API call: Bun.stringWidth
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

13. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:131`
   - **Issue**: Untracked Bun API call: Bun.escapeHTML
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })

14. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:146`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

15. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:163`
   - **Issue**: Untracked Bun API call: Bun.gzipSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

16. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:84`
   - **Issue**: Untracked Bun API call: Bun.gunzipSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.gunzipSync', () => { ... })

17. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:108`
   - **Issue**: Untracked Bun API call: Bun.stringWidth
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

18. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:124`
   - **Issue**: Untracked Bun API call: Bun.stringWidth
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

19. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:127`
   - **Issue**: Untracked Bun API call: Bun.stripANSI
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

20. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:149`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

21. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:196`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

22. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:205`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

23. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:212`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

24. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/utils.ts:637`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

25. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-complete-apis.ts:385`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

26. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts:349`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

27. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/error/error-handler.ts:181`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

28. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:51`
   - **Issue**: Untracked Bun API call: Bun.inflateSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.inflateSync', () => { ... })

29. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:96`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

30. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:124`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

31. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/resource-management-rule.ts:28`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

32. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:13`
   - **Issue**: Untracked Bun API call: Bun.Redis
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.Redis', () => { ... })

33. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:16`
   - **Issue**: Untracked Bun API call: Bun.YAML
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.YAML', () => { ... })

34. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:22`
   - **Issue**: Untracked Bun API call: Bun.SQL
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

35. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/error-handling-rule.ts:28`
   - **Issue**: Untracked Bun API call: Bun.SQL
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

36. **Error Handling** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/resource-management-rule.ts:42`
   - **Issue**: Database operation without error handling
   - **Category**: security
   - **Effort**: complex
   - **Fix**: Wrap in try-catch or use withRetry utility

37. **Error Handling** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/track-api-usage-rule.ts:11`
   - **Issue**: Database operation without error handling
   - **Category**: security
   - **Effort**: complex
   - **Fix**: Wrap in try-catch or use withRetry utility

38. **Error Handling** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:11`
   - **Issue**: Database operation without error handling
   - **Category**: security
   - **Effort**: complex
   - **Fix**: Wrap in try-catch or use withRetry utility

39. **Error Handling** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:12`
   - **Issue**: Database operation without error handling
   - **Category**: security
   - **Effort**: complex
   - **Fix**: Wrap in try-catch or use withRetry utility

40. **Error Handling** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:22`
   - **Issue**: Database operation without error handling
   - **Category**: security
   - **Effort**: complex
   - **Fix**: Wrap in try-catch or use withRetry utility

41. **Error Handling** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:23`
   - **Issue**: Database operation without error handling
   - **Category**: security
   - **Effort**: complex
   - **Fix**: Wrap in try-catch or use withRetry utility

42. **Error Handling** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/bun-optimizations-rule.ts:29`
   - **Issue**: Database operation without error handling
   - **Category**: security
   - **Effort**: complex
   - **Fix**: Wrap in try-catch or use withRetry utility


---

### Emily Davis - Junior Developer

**Capacity**: 35 violations  
**Estimated Time**: 12 days  
**Effort Level**: moderate

#### Assigned Violations


1. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/test/run-all-tests.ts:100`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

2. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/test/test-setup.ts:95`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

3. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:462`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

4. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/automated-setup.ts:512`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

5. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-v13-server.ts:24`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

6. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-v13-server.ts:52`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

7. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:33`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

8. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:38`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

9. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:83`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

10. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:86`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

11. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:106`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

12. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:107`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

13. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:137`
   - **Issue**: Untracked Bun API call: Bun.stripANSI
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

14. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:138`
   - **Issue**: Untracked Bun API call: Bun.stripANSI
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

15. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:167`
   - **Issue**: Untracked Bun API call: Bun.inflateSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.inflateSync', () => { ... })

16. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:171`
   - **Issue**: Untracked Bun API call: Bun.deflateSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

17. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:115`
   - **Issue**: Untracked Bun API call: Bun.stripANSI
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

18. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:119`
   - **Issue**: Untracked Bun API call: Bun.escapeHTML
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })

19. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:137`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

20. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:147`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

21. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:200`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

22. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:201`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

23. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:214`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

24. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/utils.ts:363`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

25. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts:19`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

26. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts:90`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

27. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:38`
   - **Issue**: Untracked Bun API call: Bun.deflateSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

28. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:40`
   - **Issue**: Untracked Bun API call: Bun.zstdCompress
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.zstdCompress', () => { ... })

29. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:105`
   - **Issue**: Untracked Bun API call: Bun.escapeHTML
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })

30. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:110`
   - **Issue**: Untracked Bun API call: Bun.stringWidth
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

31. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:10`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

32. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:11`
   - **Issue**: Untracked Bun API call: Bun.SQL
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

33. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:18`
   - **Issue**: Untracked Bun API call: Bun.CSRF
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.CSRF', () => { ... })

34. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:20`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

35. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/bun-optimizations-rule.ts:29`
   - **Issue**: Untracked Bun API call: Bun.SQL
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.SQL', () => { ... })


---

### Mike Wilson - Senior Developer

**Capacity**: 35 violations  
**Estimated Time**: 9 days  
**Effort Level**: moderate

#### Assigned Violations


1. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/core/build.ts:91`
   - **Issue**: Untracked Bun API call: Bun.build
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.build', () => { ... })

2. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/test/continuous-testing.ts:335`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

3. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:414`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

4. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/generate-rule-dashboard.ts:68`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

5. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/server-v13.ts:79`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

6. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-v13-server.ts:115`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

7. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:30`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

8. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:41`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

9. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:82`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

10. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:87`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

11. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:105`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

12. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:115`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

13. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:133`
   - **Issue**: Untracked Bun API call: Bun.escapeHTML
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.escapeHTML', () => { ... })

14. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:144`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

15. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:166`
   - **Issue**: Untracked Bun API call: Bun.deflateSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

16. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:83`
   - **Issue**: Untracked Bun API call: Bun.gzipSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

17. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:114`
   - **Issue**: Untracked Bun API call: Bun.stripANSI
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

18. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:123`
   - **Issue**: Untracked Bun API call: Bun.stringWidth
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

19. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:136`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

20. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:148`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

21. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:197`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

22. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:202`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

23. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:213`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

24. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/utils.ts:459`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

25. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/__tests__/integration.test.ts:24`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

26. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-native-apis.ts:158`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

27. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:36`
   - **Issue**: Untracked Bun API call: Bun.gzipSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

28. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:49`
   - **Issue**: Untracked Bun API call: Bun.gunzipSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.gunzipSync', () => { ... })

29. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:100`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

30. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:115`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

31. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/resource-management-rule.ts:42`
   - **Issue**: Untracked Bun API call: Bun.SQL
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

32. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:12`
   - **Issue**: Untracked Bun API call: Bun.SQL
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

33. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:17`
   - **Issue**: Untracked Bun API call: Bun.zstdCompress
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.zstdCompress', () => { ... })

34. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:21`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

35. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/stay-updated-rule.ts:14`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })


---

### Sarah Johnson - Senior Developer

**Capacity**: 45 violations  
**Estimated Time**: 12 days  
**Effort Level**: moderate

#### Assigned Violations


1. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/mcp-server/bun-mcp-server.ts:60`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

2. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/mcp-server/bun-mcp-server.ts:85`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

3. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/mcp-server/bun-mcp-server.ts:88`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

4. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:248`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

5. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:276`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

6. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:402`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

7. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:437`
   - **Issue**: Untracked Bun API call: Bun.gzipSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

8. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:442`
   - **Issue**: Untracked Bun API call: Bun.deflateSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

9. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/benchmark/benchmark.ts:447`
   - **Issue**: Untracked Bun API call: Bun.zstdCompress
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.zstdCompress', () => { ... })

10. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/pre-commit-validate.ts:34`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

11. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/core/preload.ts:80`
   - **Issue**: Untracked Bun API call: Bun.hash.rapidhash
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.hash.rapidhash', () => { ... })

12. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:249`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

13. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/scripts/setup/incremental-verification.ts:285`
   - **Issue**: Untracked Bun API call: Bun.spawn
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.spawn', () => { ... })

14. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/bun-server.ts:262`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

15. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-websocket/src/server-v13.ts:21`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

16. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/dev.ts:28`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

17. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/dev.ts:86`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

18. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:48`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

19. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:78`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

20. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:94`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

21. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:95`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

22. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:121`
   - **Issue**: Untracked Bun API call: Bun.stringWidth
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

23. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:127`
   - **Issue**: Untracked Bun API call: Bun.stringWidth
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

24. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:158`
   - **Issue**: Untracked Bun API call: Bun.gzipSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.gzipSync', () => { ... })

25. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-official-docs-compliance.test.ts:159`
   - **Issue**: Untracked Bun API call: Bun.gunzipSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.gunzipSync', () => { ... })

26. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:90`
   - **Issue**: Untracked Bun API call: Bun.deflateSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deflateSync', () => { ... })

27. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:91`
   - **Issue**: Untracked Bun API call: Bun.inflateSync
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.inflateSync', () => { ... })

28. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:125`
   - **Issue**: Untracked Bun API call: Bun.stringWidth
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

29. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:126`
   - **Issue**: Untracked Bun API call: Bun.stringWidth
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stringWidth', () => { ... })

30. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:150`
   - **Issue**: Untracked Bun API call: Bun.deepEquals
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.deepEquals', () => { ... })

31. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:177`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

32. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:206`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

33. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/tests/bun-utilities-showcase.test.ts:209`
   - **Issue**: Untracked Bun API call: Bun.peek
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.peek', () => { ... })

34. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-complete-apis.ts:26`
   - **Issue**: Untracked Bun API call: Bun.build
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.build', () => { ... })

35. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-complete-apis.ts:162`
   - **Issue**: Untracked Bun API call: Bun.SQL
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

36. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/error/error-handler.ts:157`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

37. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/error/error-handler.ts:180`
   - **Issue**: Untracked Bun API call: Bun.serve
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.serve', () => { ... })

38. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:53`
   - **Issue**: Untracked Bun API call: Bun.zstdDecompress
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.zstdDecompress', () => { ... })

39. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:92`
   - **Issue**: Untracked Bun API call: Bun.sleep
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.sleep', () => { ... })

40. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:129`
   - **Issue**: Untracked Bun API call: Bun.file
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.file', () => { ... })

41. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/bun-utils.ts:138`
   - **Issue**: Untracked Bun API call: Bun.stripANSI
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.stripANSI', () => { ... })

42. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:14`
   - **Issue**: Untracked Bun API call: Bun.Redis
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.Redis', () => { ... })

43. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:15`
   - **Issue**: Untracked Bun API call: Bun.YAML
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.YAML', () => { ... })

44. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:23`
   - **Issue**: Untracked Bun API call: Bun.SQL
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.SQL', () => { ... })

45. **Track API Usage** - `/Users/nolarose/CascadeProjects/windsurf-project/packages/odds-core/src/standards/rules/use-bun-builtins-rule.ts:24`
   - **Issue**: Untracked Bun API call: Bun.Redis
   - **Category**: monitoring
   - **Effort**: moderate
   - **Fix**: Wrap with apiTracker.track('Bun.Redis', () => { ... })


---


## 📅 Implementation Timeline


### Phase 1: Critical Security

**Dates**: 2025-11-17 to 2025-11-24
**Target**: 157 violations

**Focus**: Error handling, resource management, API tracking

### Phase 2: Performance & Monitoring

**Dates**: 2025-11-24 to 2025-12-01
**Target**: 0 violations

**Focus**: Optimization, monitoring, memory management

### Phase 3: Code Quality

**Dates**: 2025-12-01 to 2025-12-08
**Target**: 0 violations

**Focus**: Type safety, code modernization, standards compliance


## 🗓️ Daily Standup Structure

**Time**: 09:00 AM  
**Attendees**: Alex Chen, Sarah Johnson, Mike Wilson, Emily Davis

### Agenda


1. Critical violation progress

2. Blockers and dependencies

3. Code review requirements

4. Testing and validation


### Progress Tracking

- **Daily**: Violation count reduction
- **Blockers**: Technical impediments  
- **Dependencies**: Cross-team requirements
- **Code Review**: Pending approvals

## 🎯 Success Metrics

### Week 1 Goals
- [ ] All critical security violations resolved
- [ ] API tracking infrastructure implemented
- [ ] Error handling patterns standardized

### Week 2 Goals  
- [ ] Performance optimizations completed
- [ ] Monitoring and logging enhanced
- [ ] Code review process optimized

### Week 3 Goals
- [ ] All remaining violations resolved
- [ ] Team training completed
- [ ] Documentation updated

## 📞 Escalation Path

1. **Technical Blockers** → Lead Developer (Alex Chen)
2. **Resource Constraints** → Project Manager  
3. **Timeline Issues** → Product Owner
4. **Quality Concerns** → Architecture Review Board

## 📋 Commands for Team

```bash
# Check current assignment status
bun run scripts/assign-critical-violations.ts

# Validate individual fixes
bun run rules:validate

# Generate progress report
bun run rules:organize
```

---

**Next Action**: Team members review assignments and begin Phase 1  
**Daily Check**: 09:00 AM standup meeting  
**Weekly Review**: Friday EOD progress assessment  
*Generated by Golden Rules Enforcement System*
