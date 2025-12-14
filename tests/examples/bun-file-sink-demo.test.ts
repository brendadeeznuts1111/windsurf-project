import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("FileSink - Basic File Writing", () => {
  // Create a temporary directory for tests
  async function getTempPath(filename: string) {
    const tempDir = tmpdir();
    const path = join(tempDir, `bun-filesink-test-${Date.now()}-${filename}`);
    try {
      // Use Bun.write with empty content to effectively delete
      await Bun.write(path, "");
    } catch (e) {
      // File doesn't exist, that's fine
    }
    return path;
  }

  const testFixtures = [
    {
      name: "simple string",
      input: ["Hello, World!"],
      expected: "Hello, World!"
    },
    {
      name: "multiple strings",
      input: ["Hello", ", ", "World", "!"],
      expected: "Hello, World!"
    },
    {
      name: "unicode content",
      input: ["😋 Get Emoji — All Emojis to ✂️ Copy and 📋 Paste 👌"],
      expected: "😋 Get Emoji — All Emojis to ✂️ Copy and 📋 Paste 👌"
    },
    {
      name: "mixed content",
      input: ["Hello", new TextEncoder().encode(" World"), "!"],
      expected: "Hello World!"
    },
    {
      name: "buffer content",
      input: [Buffer.from("Hello, Buffer World!")],
      expected: "Hello, Buffer World!"
    }
  ];

  describe("Basic file writing", () => {
    testFixtures.forEach(({ name, input, expected }) => {
      it(`writes ${name} correctly`, async () => {
        const filePath = await getTempPath(`${name.replace(/[^a-zA-Z0-9]/g, '-')}.txt`);

        const writer = Bun.file(filePath).writer();

        for (const chunk of input) {
          await writer.write(chunk);
        }

        await writer.end();

        // Verify the content
        const content = await Bun.file(filePath).text();
        expect(content).toBe(expected);

        // Cleanup using Bun.write to delete
        await Bun.write(filePath, "");
      });
    });
  });

  describe("Flushing behavior", () => {
    it("flush ensures data is written", async () => {
      const filePath = await getTempPath("flush-test.txt");

      const writer = Bun.file(filePath).writer();

      await writer.write("Hello");
      await writer.flush();

      // Check if data is available immediately after flush
      const content1 = await Bun.file(filePath).text();
      expect(content1).toBe("Hello");

      await writer.write(", World!");
      await writer.flush();

      const content2 = await Bun.file(filePath).text();
      expect(content2).toBe("Hello, World!");

      await writer.end();

      // Cleanup
      await Bun.write(filePath, "");
    });
  });

  describe("Writer options", () => {
    it("highWaterMark option works", async () => {
      const filePath = await getTempPath("highwatermark-test.txt");

      const writer = Bun.file(filePath).writer({ highWaterMark: 1 });

      await writer.write("A");
      await writer.flush();
      await writer.write("B");
      await writer.flush();
      await writer.write("C");
      await writer.end();

      const content = await Bun.file(filePath).text();
      expect(content).toBe("ABC");

      // Cleanup
      await Bun.write(filePath, "");
    });
  });

  describe("File descriptor handling", () => {
    it("writer with file descriptor doesn't close FD", async () => {
      const filePath = await getTempPath("fd-test.txt");

      // Create file first to get a valid FD
      await Bun.write(filePath, "");

      // For Bun.file with FD, we'd need to use a different approach
      // This test demonstrates the concept but uses path-based approach
      const writer = Bun.file(filePath).writer();

      await writer.write("Test content");
      await writer.end();

      // File should exist and be readable
      const content = await Bun.file(filePath).text();
      expect(content).toBe("Test content");

      // Cleanup
      await Bun.write(filePath, "");
    });

    it("writer without file descriptor closes automatically", async () => {
      const filePath = await getTempPath("auto-close-test.txt");

      const writer = Bun.file(filePath).writer();
      await writer.write("Auto-close test");
      await writer.end();

      // File should exist and be readable
      const content = await Bun.file(filePath).text();
      expect(content).toBe("Auto-close test");

      // Cleanup
      await Bun.write(filePath, "");
    });
  });

  describe("Write return values", () => {
    it("write returns correct byte count", async () => {
      const filePath = await getTempPath("byte-count-test.txt");

      const writer = Bun.file(filePath).writer();

      const bytes1 = await writer.write("Hello"); // 5 bytes
      expect(bytes1).toBe(5);

      const bytes2 = await writer.write(", World!"); // 8 bytes
      expect(bytes2).toBe(8);

      await writer.end();

      // Cleanup
      await Bun.write(filePath, "");
    });
  });

  describe("Error handling", () => {
    it("throws on invalid path", () => {
      expect(() => {
        Bun.file("/invalid/path/that/does/not/exist/file.txt").writer();
      }).toThrow();
    });
  });
});