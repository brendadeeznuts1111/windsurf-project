import { describe, expect, it } from "bun:test";
import { join } from "node:path";
import { tmpdir } from "node:os";
import fs from "node:fs";

describe("FileSink - Basic File Writing", () => {
  // Create a temporary directory for tests
  function getTempPath(filename: string) {
    const tempDir = tmpdir();
    const path = join(tempDir, `bun-filesink-test-${Date.now()}-${filename}`);
    try {
      fs.unlinkSync(path);
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
        const filePath = getTempPath(`${name.replace(/[^a-zA-Z0-9]/g, '-')}.txt`);

        const writer = Bun.file(filePath).writer();

        for (const chunk of input) {
          await writer.write(chunk);
        }

        await writer.end();

        // Verify the content
        const content = await Bun.file(filePath).text();
        expect(content).toBe(expected);

        // Cleanup
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    });
  });

  describe("Flushing behavior", () => {
    it("flush ensures data is written", async () => {
      const filePath = getTempPath("flush-test.txt");

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
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  });

  describe("Writer options", () => {
    it("highWaterMark option works", async () => {
      const filePath = getTempPath("highwatermark-test.txt");

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
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  });

  describe("File descriptor handling", () => {
    it("writer with file descriptor doesn't close FD", async () => {
      const filePath = getTempPath("fd-test.txt");

      // Open file descriptor
      const fd = fs.openSync(filePath, 'w');

      const file = Bun.file(fd);
      const writer = file.writer();

      await writer.write("Test content");
      await writer.end();

      // FD should still be open and usable
      const stats = fs.fstatSync(fd);
      expect(stats.size).toBeGreaterThan(0);

      // Close the file descriptor manually
      fs.closeSync(fd);

      // Cleanup
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    });

    it("writer without file descriptor closes automatically", async () => {
      const filePath = getTempPath("auto-close-test.txt");

      const writer = Bun.file(filePath).writer();
      await writer.write("Auto-close test");
      await writer.end();

      // File should exist and be readable
      const content = await Bun.file(filePath).text();
      expect(content).toBe("Auto-close test");

      // Cleanup
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  });

  describe("Write return values", () => {
    it("write returns correct byte count", async () => {
      const filePath = getTempPath("byte-count-test.txt");

      const writer = Bun.file(filePath).writer();

      const bytes1 = await writer.write("Hello"); // 5 bytes
      expect(bytes1).toBe(5);

      const bytes2 = await writer.write(", World!"); // 8 bytes
      expect(bytes2).toBe(8);

      await writer.end();

      // Cleanup
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Ignore cleanup errors
      }
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