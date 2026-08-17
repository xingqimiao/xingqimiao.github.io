import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportDir = path.resolve(process.argv[2] || path.join(root, "out"));

// next build drops React Server Component debug dumps named __next.* into the
// static export (observed at the output root and inside out/stories/policy/).
// They are harmless but would be uploaded by `wrangler pages deploy out`, so
// strip them before deploying.
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.name.startsWith("__next")) {
        await rm(full, { recursive: true, force: true });
        return;
      }
      if (entry.isDirectory()) {
        await walk(full);
      }
    }),
  );
}

await walk(exportDir);
console.log(`Cleaned RSC debug dumps from ${exportDir}`);