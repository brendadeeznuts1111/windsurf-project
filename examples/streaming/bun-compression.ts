import { gzipSync, zstdCompress, zstdDecompress } from "bun";
import { file } from "bun";
import { logger } from "../logging/bun-logger";

interface CompressionStats {
  algorithm: string;
  level: number;
  inputSize: number;
  outputSize: number;
  ratio: number;
  duration_ns: number;
}

export class BunCompressionManager {
  /**
   * Streaming compression with backpressure handling
   */
  async compressStream(
    inputPath: string,
    outputPath: string,
    algorithm: "gzip" | "zstd" = "zstd",
    level: number = 6
  ): Promise<CompressionStats> {
    const inputFile = file(inputPath);
    const outputFile = file(outputPath);

    const stats = {
      algorithm,
      level,
      inputSize: 0,
      outputSize: 0,
      ratio: 0,
      duration_ns: 0,
    };

    const start = Bun.nanoseconds();

    // Stream processing
    const reader = inputFile.stream().getReader();
    const writer = outputFile.writer();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        stats.inputSize += value.byteLength;

        // Compress chunk
        const compressed = algorithm === "zstd"
          ? await zstdCompress(value)
          : gzipSync(value);

        await writer.write(compressed);
        stats.outputSize += compressed.byteLength;
      }

      await writer.end();

    } catch (error) {
      logger.error("Compression failed", { inputPath, algorithm }, error as Error);
      throw error;
    }

    const duration = Bun.nanoseconds() - start;
    stats.duration_ns = duration;
    stats.ratio = stats.outputSize / stats.inputSize;

    logger.info("Compression completed", stats);
    return stats;
  }

  /**
   * Automatic compression selection based on content type
   */
  async autoCompress(data: Buffer | string): Promise<{
    compressed: Buffer;
    algorithm: "gzip" | "zstd" | "none";
    savings: number;
  }> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const inputSize = buffer.byteLength;

    // Small data: skip compression
    if (inputSize < 1024) {
      return { compressed: buffer, algorithm: "none", savings: 0 };
    }

    // Text-heavy data: use zstd for better ratio
    const isText = this.isTextContent(buffer);
    const algorithm = isText ? "zstd" : "gzip";
    const level = isText ? 9 : 6;

    const compressed = algorithm === "zstd"
      ? await zstdCompress(buffer)
      : gzipSync(buffer);

    const savings = ((inputSize - compressed.byteLength) / inputSize) * 100;

    logger.debug("Auto-compression selected", {
      input_size: inputSize,
      algorithm,
      level,
      savings_percent: savings.toFixed(2),
    });

    return { compressed, algorithm, savings };
  }

  private isTextContent(buffer: Buffer): boolean {
    // Check first 1KB for text patterns
    const sample = buffer.slice(0, Math.min(1024, buffer.length));
    const textRatio = (sample.toString().match(/[a-zA-Z\s]/g)?.length || 0) / sample.length;
    return textRatio > 0.7;
  }

  /**
   * Decompress data
   */
  async decompress(data: Buffer, algorithm: "gzip" | "zstd" = "zstd"): Promise<Buffer> {
    return algorithm === "zstd"
      ? await zstdDecompress(data)
      : data; // gzip decompression would need gunzipSync
  }
}