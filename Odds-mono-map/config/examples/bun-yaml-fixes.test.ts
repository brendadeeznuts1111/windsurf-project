#!/usr/bin/env bun

/**
 * 🧪 Bun YAML Fixes Test Suite
 * 
 * Comprehensive testing for recent Bun YAML implementation fixes:
 * 1. Ellipsis handling in double-quoted strings
 * 2. Proper quoting of indicator characters in stringification
 */

import { test, expect, describe } from "bun:test";
import { YAML } from "bun";

describe("🔧 Bun YAML Fixes Tests", () => {

    describe("📝 Ellipsis in Double-Quoted Strings", () => {

        test("✅ should parse simple ellipsis messages", () => {
            const yaml = 'message: "Loading..."';
            const result = YAML.parse(yaml) as any;

            expect(result.message).toBe("Loading...");
        });

        test("✅ should parse multiple ellipsis in one string", () => {
            const yaml = 'status: "Step 1... Step 2... Step 3..."';
            const result = YAML.parse(yaml) as any;

            expect(result.status).toBe("Step 1... Step 2... Step 3...");
        });

        test("✅ should parse ellipsis with other content", () => {
            const yaml = 'description: "Processing data... 50% complete"';
            const result = YAML.parse(yaml) as any;

            expect(result.description).toBe("Processing data... 50% complete");
        });

        test("✅ should parse international content with ellipsis", () => {
            const testCases = [
                { yaml: 'chinese: "更多内容..."', expected: "更多内容..." },
                { yaml: 'japanese: "日本語テスト..."', expected: "日本語テスト..." },
                { yaml: 'korean: "한국어 테스트..."', expected: "한국어 테스트..." },
                { yaml: 'arabic: "العربية اختبار..."', expected: "العربية اختبار..." },
                { yaml: 'hebrew: "עברית בדיקה..."', expected: "עברית בדיקה..." }
            ];

            testCases.forEach(({ yaml, expected }) => {
                const result = YAML.parse(yaml) as any;
                const key = Object.keys(result)[0];
                expect(result[key]).toBe(expected);
            });
        });

        test("✅ should handle ellipsis in complex nested structures", () => {
            const yaml = `
ui:
  loading: "加载中..."
  error: "错误：无法连接到服务器..."
  warning: "警告：磁盘空间不足..."
  
messages:
  - "Processing..."
  - "Loading data..."
  - "Calculating results..."
`;
            const result = YAML.parse(yaml) as any;

            expect(result.ui.loading).toBe("加载中...");
            expect(result.ui.error).toBe("错误：无法连接到服务器...");
            expect(result.ui.warning).toBe("警告：磁盘空间不足...");
            expect(result.messages).toEqual([
                "Processing...",
                "Loading data...",
                "Calculating results..."
            ]);
        });

        test("✅ should round-trip ellipsis content correctly", () => {
            const obj = {
                message: "Loading...",
                status: "Processing data... 50%",
                international: "测试内容..."
            };

            const yaml = YAML.stringify(obj);
            const parsed = YAML.parse(yaml) as any;

            expect(parsed.message).toBe(obj.message);
            expect(parsed.status).toBe(obj.status);
            expect(parsed.international).toBe(obj.international);
        });
    });

    describe("🔤 Indicator Character Quoting", () => {

        test("✅ should properly quote colon-prefixed strings", () => {
            const obj = { key: ":starts_with_colon" };
            const yaml = YAML.stringify(obj);
            const parsed = YAML.parse(yaml) as any;

            expect(parsed.key).toBe(":starts_with_colon");
            expect(yaml).toContain('":starts_with_colon"');
        });

        test("✅ should properly quote dash-prefixed strings", () => {
            const obj = { key: "-starts_with_dash" };
            const yaml = YAML.stringify(obj);
            const parsed = YAML.parse(yaml) as any;

            expect(parsed.key).toBe("-starts_with_dash");
            expect(yaml).toContain('"-starts_with_dash"');
        });

        test("✅ should properly quote question mark-prefixed strings", () => {
            const obj = { key: "?starts_with_question" };
            const yaml = YAML.stringify(obj);
            const parsed = YAML.parse(yaml) as any;

            expect(parsed.key).toBe("?starts_with_question");
            expect(yaml).toContain('"?starts_with_question"');
        });

        test("✅ should properly quote bracket-prefixed strings", () => {
            const testCases = [
                { key: "[starts_with_bracket", expected: '"[starts_with_bracket"' },
                { key: "{starts_with_brace", expected: '"{starts_with_brace"' },
                { key: "]starts_with_close_bracket", expected: '"]starts_with_close_bracket"' },
                { key: "}starts_with_close_brace", expected: '"}starts_with_close_brace"' }
            ];

            testCases.forEach(({ key, expected }) => {
                const obj = { key };
                const yaml = YAML.stringify(obj);
                const parsed = YAML.parse(yaml) as any;

                expect(parsed.key).toBe(key);
                expect(yaml).toContain(expected);
            });
        });

        test("✅ should properly quote special character strings", () => {
            const testCases = [
                { key: "#hashtag", expected: '"#hashtag"' },
                { key: "&ampersand", expected: '"&ampersand"' },
                { key: "*asterisk", expected: '"*asterisk"' },
                { key: "!exclamation", expected: '"!exclamation"' },
                { key: "|pipe", expected: '"|pipe"' },
                { key: ">greater", expected: '">greater"' },
                { key: "%percent", expected: '"%percent"' },
                { key: "@at_sign", expected: '"@at_sign"' },
                { key: "`backtick", expected: '"`backtick"' }
            ];

            testCases.forEach(({ key, expected }) => {
                const obj = { key };
                const yaml = YAML.stringify(obj);
                const parsed = YAML.parse(yaml) as any;

                expect(parsed.key).toBe(key);
                expect(yaml).toContain(expected);
            });
        });

        test("✅ should properly quote whitespace-prefixed strings", () => {
            const testCases = [
                { key: " starts_with_space", expected: '" starts_with_space"' },
                { key: "\tstarts_with_tab", expected: '"\\tstarts_with_tab"' },
                { key: "\nstarts_with_newline", expected: '"\\nstarts_with_newline"' }
            ];

            testCases.forEach(({ key, expected }) => {
                const obj = { key };
                const yaml = YAML.stringify(obj);
                const parsed = YAML.parse(yaml) as any;

                expect(parsed.key).toBe(key);
                expect(yaml).toContain(expected);
            });
        });

        test("✅ should handle mixed indicator characters", () => {
            const obj = {
                colon: ":secret_key",
                dash: "-option",
                hash: "#comment",
                ampersand: "&reference",
                asterisk: "*wildcard",
                space: " leading_space"
            };

            const yaml = YAML.stringify(obj);
            const parsed = YAML.parse(yaml) as any;

            // Verify round-trip success
            expect(parsed.colon).toBe(obj.colon);
            expect(parsed.dash).toBe(obj.dash);
            expect(parsed.hash).toBe(obj.hash);
            expect(parsed.ampersand).toBe(obj.ampersand);
            expect(parsed.asterisk).toBe(obj.asterisk);
            expect(parsed.space).toBe(obj.space);

            // Verify proper quoting in YAML output
            expect(yaml).toContain('":secret_key"');
            expect(yaml).toContain('"-option"');
            expect(yaml).toContain('"#comment"');
            expect(yaml).toContain('"&reference"');
            expect(yaml).toContain('"*wildcard"');
            expect(yaml).toContain('" leading_space"');
        });
    });

    describe("🔄 Round-Trip Validation", () => {

        test("✅ should round-trip complex objects with ellipsis and indicators", () => {
            const obj = {
                messages: {
                    loading: "加载中...",
                    error: "错误：无法连接...",
                    warning: "警告：磁盘空间不足..."
                },
                config: {
                    api_key: ":secret_123",
                    webhook_url: "#webhook_endpoint",
                    backup_path: "-backup_location"
                },
                data: [
                    { id: "-12345", status: "processing..." },
                    { key: "#hashtag", value: "&entity_ref" },
                    { command: "git commit -m 'Fix...'" }
                ]
            };

            const yaml = YAML.stringify(obj);
            const parsed = YAML.parse(yaml) as any;

            expect(parsed).toEqual(obj);
        });

        test("✅ should handle real-world configuration scenarios", () => {
            const config = {
                application: {
                    name: "My App",
                    version: "1.0.0",
                    status: "Loading..."
                },
                database: {
                    url: "postgresql://localhost:5432/myapp",
                    pool_size: "10-20",
                    timeout: "30s..."
                },
                features: {
                    authentication: true,
                    logging: "debug...",
                    monitoring: "#enabled"
                },
                messages: {
                    welcome: "欢迎使用...",
                    error: "错误：操作失败...",
                    success: "操作成功完成！"
                }
            };

            const yaml = YAML.stringify(config);
            const parsed = YAML.parse(yaml) as any;

            expect(parsed).toEqual(config);
        });
    });

    describe("⚡ Performance with Fixes", () => {

        test("✅ should maintain performance with ellipsis content", () => {
            const yaml = `
messages:
  - "Loading..."
  - "Processing..."
  - "Error: Failed..."
  - "Warning: Low disk..."
  - "Success: Complete..."
  
international:
  - "中文测试..."
  - "日本語テスト..."
  - "한국어 테스트..."
`;

            const iterations = 1000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                const parsed = YAML.parse(yaml) as any;
                YAML.stringify(parsed);
            }

            const endTime = performance.now();
            const avgTime = (endTime - startTime) / iterations;

            expect(avgTime).toBeLessThan(0.01); // Should be very fast
        });

        test("✅ should maintain performance with indicator characters", () => {
            const obj = {
                indicators: [
                    ":colon", "-dash", "?question", "#hash", "&ampersand",
                    "*asterisk", "!exclamation", "|pipe", ">greater", "%percent",
                    "@at", "`backtick", " space", "\ttab", "\nnewline"
                ]
            };

            const yaml = YAML.stringify(obj);
            const iterations = 1000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                const parsed = YAML.parse(yaml) as any;
                YAML.stringify(parsed);
            }

            const endTime = performance.now();
            const avgTime = (endTime - startTime) / iterations;

            expect(avgTime).toBeLessThan(0.01); // Should be very fast
        });
    });

    describe("🔍 Edge Cases", () => {

        test("✅ should handle empty strings with ellipsis", () => {
            const yaml = 'empty: "..."';
            const result = YAML.parse(yaml) as any;

            expect(result.empty).toBe("...");
        });

        test("✅ should handle multiple consecutive ellipsis", () => {
            const yaml = 'multiple: "......"';
            const result = YAML.parse(yaml) as any;

            expect(result.multiple).toBe("......");
        });

        test("✅ should handle ellipsis at string boundaries", () => {
            const testCases = [
                { yaml: 'start: "...content"', expected: "...content" },
                { yaml: 'end: "content..."', expected: "content..." },
                { yaml: 'both: "...content..."', expected: "...content..." }
            ];

            testCases.forEach(({ yaml, expected }) => {
                const result = YAML.parse(yaml) as any;
                const key = Object.keys(result)[0];
                expect(result[key]).toBe(expected);
            });
        });

        test("✅ should handle quoted indicator characters with content", () => {
            const testCases = [
                { key: ":api_key_v1", expected: ":api_key_v1" },
                { key: "-user-input", expected: "-user-input" },
                { key: "#section-header", expected: "#section-header" },
                { key: "&entity-reference", expected: "&entity-reference" }
            ];

            testCases.forEach(({ key, expected }) => {
                const obj = { key };
                const yaml = YAML.stringify(obj);
                const parsed = YAML.parse(yaml) as any;

                expect(parsed.key).toBe(expected);
            });
        });
    });
});
