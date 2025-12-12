import { describe, it, expect } from "bun:test";
import {
  generatePropterid,
  generateCrossReferenceId,
  generateLogId,
  addCommonIdentifiers,
  createIdentifiedObject,
  extractIdentifiers,
  hasCommonIdentifiers,
  validateIdentifier
} from "../utils/common-identifiers";

describe("Common Identifiers", () => {
  it("should generate property identifiers", () => {
    const propterid = generatePropterid("user", "registration");
    expect(propterid).toMatch(/^user-\d+-registration$/);
    expect(validateIdentifier(propterid, 'propterid')).toBe(true);
  });

  it("should generate cross-reference identifiers", () => {
    const xrefId = generateCrossReferenceId("user", "post", "author");
    expect(xrefId).toMatch(/^xref-user-post-author-[a-f0-9]{8}$/);
    expect(validateIdentifier(xrefId, 'crossReferenceId')).toBe(true);
  });

  it("should generate log identifiers", () => {
    const logId = generateLogId("database", "query");
    expect(logId).toMatch(/^log-database-query-[a-f0-9]{8}$/);
    expect(validateIdentifier(logId, 'logId')).toBe(true);
  });

  it("should add common identifiers to objects", () => {
    const obj = { name: "test", value: 42 };
    const identified = addCommonIdentifiers(obj, {
      propterid: "test-type",
      logId: { component: "test", operation: "create" }
    });

    expect(identified.propterid).toBe("test-type");
    expect(identified.logId).toMatch(/^log-test-create-[a-f0-9]{8}$/);
    expect(identified.name).toBe("test");
    expect(identified.value).toBe(42);
  });

  it("should create fully identified objects", () => {
    const obj = { data: "example" };
    const identified = createIdentifiedObject(obj, "example", "test", "operation", "context");

    expect(identified.propterid).toMatch(/^example-\d+-context$/);
    expect(identified.logId).toMatch(/^log-test-operation-[a-f0-9]{8}$/);
    expect(identified.data).toBe("example");
  });

  it("should extract identifiers from objects", () => {
    const obj = {
      name: "test",
      propterid: "test-123",
      crossReferenceId: "xref-a-b-c-12345678",
      logId: "log-comp-op-87654321"
    };

    const identifiers = extractIdentifiers(obj);
    expect(identifiers.propterid).toBe("test-123");
    expect(identifiers.crossReferenceId).toBe("xref-a-b-c-12345678");
    expect(identifiers.logId).toBe("log-comp-op-87654321");
  });

  it("should check if objects have common identifiers", () => {
    expect(hasCommonIdentifiers({ propterid: "test" })).toBe(true);
    expect(hasCommonIdentifiers({ crossReferenceId: "xref-test" })).toBe(true);
    expect(hasCommonIdentifiers({ logId: "log-test" })).toBe(true);
    expect(hasCommonIdentifiers({ name: "test" })).toBe(false);
  });

  it("should validate identifier formats", () => {
    expect(validateIdentifier("user-1234567890", 'propterid')).toBe(true);
    expect(validateIdentifier("user-1234567890-context", 'propterid')).toBe(true);
    expect(validateIdentifier("xref-user-post-author-12345678", 'crossReferenceId')).toBe(true);
    expect(validateIdentifier("log-database-query-87654321", 'logId')).toBe(true);

    expect(validateIdentifier("invalid-format", 'propterid')).toBe(false);
    expect(validateIdentifier("xref-invalid", 'crossReferenceId')).toBe(false);
    expect(validateIdentifier("log-invalid", 'logId')).toBe(false);
  });
});