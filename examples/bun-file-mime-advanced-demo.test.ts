import { describe, expect, test } from "bun:test";
import { BunTextLoader } from '../src/utils/bun-text-loader';

describe("Bun File MIME-Type Advanced Examples", () => {
  test("various file extensions and their default MIME types", () => {
    // Common web file types
    const htmlFile = Bun.file("index.html");
    expect(htmlFile.type).toBe("text/html;charset=utf-8");

    const jsFile = Bun.file("app.js");
    expect(jsFile.type).toBe("text/javascript;charset=utf-8");

    const jsonFile = Bun.file("data.json");
    expect(jsonFile.type).toBe("application/json;charset=utf-8");

    const xmlFile = Bun.file("config.xml");
    expect(xmlFile.type).toBe("application/xml");
  });

  test("image file MIME types", () => {
    const pngFile = Bun.file("image.png");
    expect(pngFile.type).toBe("image/png");

    const jpgFile = Bun.file("photo.jpg");
    expect(jpgFile.type).toBe("image/jpeg");

    const gifFile = Bun.file("animation.gif");
    expect(gifFile.type).toBe("image/gif");

    const svgFile = Bun.file("icon.svg");
    expect(svgFile.type).toBe("image/svg+xml");
  });

  test("document and data file types", () => {
    const pdfFile = Bun.file("document.pdf");
    expect(pdfFile.type).toBe("application/pdf");

    const zipFile = Bun.file("archive.zip");
    expect(zipFile.type).toBe("application/zip");

    const csvFile = Bun.file("data.csv");
    expect(csvFile.type).toBe("text/csv");

    const txtFile = Bun.file("readme.txt");
    expect(txtFile.type).toBe("text/plain;charset=utf-8");
  });

  test("custom MIME types override defaults", () => {
    // Override common extensions with custom types
    const customHtml = Bun.file("page.html", { type: "application/xhtml+xml" });
    expect(customHtml.type).toBe("application/xhtml+xml");

    const customJs = Bun.file("script.js", { type: "application/javascript" });
    expect(customJs.type).toBe("text/javascript;charset=utf-8");

    const customJson = Bun.file("config.json", { type: "text/plain" });
    expect(customJson.type).toBe("text/plain;charset=utf-8");
  });

  test("MIME type consistency across file operations", async () => {
    const file = Bun.file("test.json", { type: "application/custom+json" });

    // MIME type should be consistent
    expect(file.type).toBe("application/custom+json");

    // Create a new file reference with same options
    const file2 = Bun.file("test.json", { type: "application/custom+json" });
    expect(file2.type).toBe("application/custom+json");

    // Different custom type should be respected
    const file3 = Bun.file("test.json", { type: "text/custom" });
    expect(file3.type).toBe("text/custom");
  });

  test("MIME type with charset specifications", () => {
    // Files that should include charset
    const cssFile = Bun.file("styles.css");
    expect(cssFile.type).toBe("text/css;charset=utf-8");

    const jsFile = Bun.file("script.js");
    expect(jsFile.type).toBe("text/javascript;charset=utf-8");

    const htmlFile = Bun.file("page.html");
    expect(htmlFile.type).toBe("text/html;charset=utf-8");

    // Files that typically don't include charset
    const pngFile = Bun.file("image.png");
    expect(pngFile.type).toBe("image/png");

    const pdfFile = Bun.file("doc.pdf");
    expect(pdfFile.type).toBe("application/pdf");
  });

  test("custom MIME types with various formats", () => {
    // Vendor-specific types
    const vendorType = Bun.file("data", { type: "application/vnd.api+json" });
    expect(vendorType.type).toBe("application/vnd.api+json");

    // Custom application types
    const appType = Bun.file("data", { type: "application/x-custom" });
    expect(appType.type).toBe("application/x-custom");

    // Experimental types
    const experimentalType = Bun.file("data", { type: "application/x-test-data" });
    expect(experimentalType.type).toBe("application/x-test-data");

    // Types with parameters
    const paramType = Bun.file("data", { type: "text/plain; charset=iso-8859-1" });
    expect(paramType.type).toBe("text/plain; charset=iso-8859-1");
  });

  test("MIME type handling with file extensions vs explicit types", () => {
    // Extension-based detection
    const cssByExt = Bun.file("style.css");
    expect(cssByExt.type).toBe("text/css;charset=utf-8");

    // Override extension with custom type
    const cssAsPlain = Bun.file("style.css", { type: "text/plain" });
    expect(cssAsPlain.type).toBe("text/plain;charset=utf-8");

    // No extension, explicit type
    const noExtWithType = Bun.file("mystyle", { type: "text/css" });
    expect(noExtWithType.type).toBe("text/css;charset=utf-8");

    // No extension, no type (should be default)
    const noExtNoType = Bun.file("mystyle");
    expect(noExtNoType.type).toBe("application/octet-stream"); // Default for unknown types
  });

  test("binary file MIME types", () => {
    const exeFile = Bun.file("program.exe");
    expect(exeFile.type).toBe("application/x-msdownload");

    const dmgFile = Bun.file("installer.dmg");
    expect(dmgFile.type).toBe("application/x-apple-diskimage");

    const isoFile = Bun.file("disk.iso");
    expect(isoFile.type).toBe("application/x-iso9660-image");
  });

  test("MIME type validation and edge cases", () => {
    // Empty type string
    const emptyType = Bun.file("file", { type: "" });
    expect(emptyType.type).toBe("application/octet-stream");

    // Type with only subtype
    const subtypeOnly = Bun.file("file", { type: "json" });
    expect(subtypeOnly.type).toBe("json");

    // Type with extra spaces (should be preserved)
    const spacedType = Bun.file("file", { type: " text/plain " });
    expect(spacedType.type).toBe(" text/plain ");

    // Very long custom type
    const longType = "application/vnd.company.product.subproduct.version+json; param=value; another=param";
    const longTypeFile = Bun.file("file", { type: longType });
    expect(longTypeFile.type).toBe(longType);
  });
});