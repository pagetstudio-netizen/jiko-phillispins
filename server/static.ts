import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Support both CJS (__dirname) and ESM (import.meta.url)
function getDirname(): string {
  try {
    // ESM
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    // CJS bundle — __dirname is defined
    // @ts-ignore
    return typeof __dirname !== "undefined" ? __dirname : process.cwd();
  }
}

export function serveStatic(app: Express) {
  // When bundled to dist/index.cjs, __dirname = dist/
  // When run from source (ESM), import.meta.url resolves to server/static.ts → server/
  // So we search for "public" relative to the dist dir or one level up
  const baseDir = getDirname();
  let distPath = path.resolve(baseDir, "public");

  // If not found (e.g. running from project root), try dist/public
  if (!fs.existsSync(distPath)) {
    distPath = path.resolve(process.cwd(), "dist", "public");
  }

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Run "npm run build" first.`,
    );
  }

  console.log("[static] serving frontend from:", distPath);

  app.use(express.static(distPath, {
    maxAge: "1d",
    etag: true,
  }));

  // SPA fallback — serve index.html for all non-API routes
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
