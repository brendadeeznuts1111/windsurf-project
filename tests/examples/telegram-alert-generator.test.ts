import { describe, it, expect } from "bun:test";
import { TelegramAlertGenerator, createHealthAlert, createErrorAlert, createCustomAlert } from "./telegram-alert-generator";

describe("Telegram Alert Generator", () => {
  const generator = new TelegramAlertGenerator();

  it("should create health alert", async () => {
    const alert = await generator.generateHealthAlert();
    expect(alert.type).toBeDefined();
    expect(alert.title).toContain("System");
    expect(alert.message).toContain("Tension");
    expect(alert.propterid).toMatch(/^alert-/);
    expect(alert.logId).toMatch(/^log-telegram-/);
  });

  it("should create error alert", () => {
    const error = new Error("Test error");
    const alert = generator.generateErrorAlert(error, "test context");

    expect(alert.type).toBe("error");
    expect(alert.title).toBe("❌ System Error");
    expect(alert.message).toContain("Test error");
    expect(alert.message).toContain("test context");
    expect(alert.propterid).toBe("alert-error");
  });

  it("should create custom alert", () => {
    const alert = generator.generateCustomAlert(
      "warning",
      "Custom Warning",
      "This is a test warning",
      "test-source",
      { testData: "value" }
    );

    expect(alert.type).toBe("warning");
    expect(alert.title).toBe("Custom Warning");
    expect(alert.message).toBe("This is a test warning");
    expect(alert.source).toBe("test-source");
    expect(alert.metadata?.testData).toBe("value");
  });

  it("should format alert for Telegram", async () => {
    const alert = await generator.generateHealthAlert();
    const formatted = generator.formatForTelegram(alert);

    expect(formatted).toContain("*");
    expect(formatted).toContain("🕒");
    expect(formatted).toContain("🔍");
    expect(formatted).toContain("🆔");
  });

  it("should get alert statistics", () => {
    const stats = generator.getAlertStats();

    expect(stats.templates).toBeDefined();
    expect(stats.config).toBeDefined();
    expect(stats.templates.info.emoji).toBe("ℹ️");
    expect(stats.templates.critical.emoji).toBe("🚨");
  });

  it("should create alerts using utility functions", async () => {
    const healthAlert = await createHealthAlert();
    expect(healthAlert.propterid).toMatch(/^alert-/);

    const errorAlert = createErrorAlert(new Error("Utility test"));
    expect(errorAlert.type).toBe("error");

    const customAlert = createCustomAlert("success", "Test", "Message", "source");
    expect(customAlert.type).toBe("success");
  });

  it("should handle rate limiting", async () => {
    const generator = new TelegramAlertGenerator({ rateLimitMs: 100 });

    // First alert should work (no rate limiting)
    const alert1 = generator.generateCustomAlert("info", "Test 1", "Message 1", "test");
    const result1 = await generator.sendAlert(alert1);
    // Will fail due to no bot token, but shouldn't be rate limited

    // Second alert should be rate limited
    const alert2 = generator.generateCustomAlert("info", "Test 2", "Message 2", "test");
    const result2 = await generator.sendAlert(alert2);
    // Should be rate limited and return false
    expect(result2).toBe(false);
  });

  it("should validate alert properties", () => {
    const alert = generator.generateCustomAlert("critical", "Test", "Message", "source");

    expect(alert.id).toBeDefined();
    expect(alert.timestamp).toBeGreaterThan(0);
    expect(alert.type).toBe("critical");
    expect(alert.propterid).toBe("alert-critical");
    expect(alert.logId).toMatch(/^log-telegram-critical-/);
  });
});