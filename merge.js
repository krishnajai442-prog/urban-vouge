const fs = require("fs");
const path = require("path");

// ✅ File types to include
const extensions = [
  ".js", ".jsx", ".ts", ".tsx",
  ".css", ".scss",
  ".json", ".md",
  ".prisma", ".env.example",
  ".html", ".mjs", ".cjs"
];

// ❌ Folders to skip
const ignoreDirs = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".cache",
  ".vscode",
  ".idea",
  "coverage",
  "public",       // skip images/assets
];

// ❌ Files to skip
const ignoreFiles = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "merge.js",     // skip itself
  ".env",          // skip sensitive files
];

let output = "";
let fileCount = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (entry.isDirectory()) {
      if (!ignoreDirs.includes(entry.name)) {
        walk(fullPath);
      }
    } else if (entry.isFile()) {
      if (ignoreFiles.includes(entry.name)) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          output += `\n\n${"=".repeat(60)}\n`;
          output += `FILE: ${relativePath}\n`;
          output += `${"=".repeat(60)}\n\n`;
          output += content;
          fileCount++;
        } catch (e) {
          output += `\n[Could not read: ${relativePath}]\n`;
        }
      }
    }
  }
}

// Start from current directory
walk(".");

// Write to file
fs.writeFileSync("full_project_code.txt", output, "utf-8");

console.log(`✅ Done! Merged ${fileCount} files into "full_project_code.txt"`);
console.log(`📄 File size: ${(fs.statSync("full_project_code.txt").size / 1024).toFixed(1)} KB`);