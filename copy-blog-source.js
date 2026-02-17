/**
 * Copy blog source files to dist for Pages Function access
 *
 * Cloudflare Pages Functions can only access files in the build output.
 * This script copies .mdx source files to a blog-source/ directory in dist
 * so the content negotiation function can serve raw markdown.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(__dirname, "src", "content", "docs", "blog");
const distDir = path.join(__dirname, "dist", "blog-source");

async function copyBlogSource() {
  try {
    // Create dest directory
    await fs.mkdir(distDir, { recursive: true });

    // Read blog directory
    const files = await fs.readdir(sourceDir);

    // Copy each .mdx file
    for (const file of files) {
      if (file.endsWith(".mdx")) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(distDir, file);
        await fs.copyFile(sourcePath, destPath);
        console.log(`Copied: ${file}`);
      }
    }

    console.log("Blog source files copied successfully");
  } catch (error) {
    console.error("Error copying blog source files:", error);
    process.exit(1);
  }
}

copyBlogSource();
