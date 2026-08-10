import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rename, writeFile, constants } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src", "data", "compiled_articles.json");
const removedFields = ["identity_tags", "life_stage", "age_label", "role_label", "story_order", "experience_year"];
import { planStoryRegionMigration } from './lib/story-region-migration.mjs'
const apply = process.argv.includes("--apply");
const raw = await readFile(sourcePath, "utf8");
const sourceHash = createHash("sha256").update(raw).digest("hex");
const articles = JSON.parse(raw);
const backup = [];

const migrated = articles.map((article) => {
  if (article.type !== "stories") return article;
  const removed = Object.fromEntries(removedFields.filter((field) => field in article).map((field) => [field, article[field]]));
  if (Object.keys(removed).length) backup.push({ slug: article.slug, removed });
  return Object.fromEntries(Object.entries(article).filter(([field]) => !removedFields.includes(field)));
});

const storiesDirectory = path.join(root, 'content', 'stories')
const storyNames = (await readdir(storiesDirectory)).filter((name) => name.endsWith('.md')).sort()
const storySources = new Map(await Promise.all(storyNames.map(async (name) => [name, await readFile(path.join(storiesDirectory, name), 'utf8')])))
const regionPlan = planStoryRegionMigration({ compiledRaw: `${JSON.stringify(migrated)}\n`, storySources })
const next = regionPlan.compiledNext;
const nextHash = createHash("sha256").update(next).digest("hex");
const report = { mode: apply ? "apply" : "dry-run", sourcePath, sourceHash, nextHash, changedStories: backup.length, removedFields, backup, removedRegions: regionPlan.removed };

if (apply && (backup.length || regionPlan.removed.length)) {
  const backupDirectory = path.join(root, "migration-backups");
  await mkdir(backupDirectory, { recursive: true });
  const backupRoot = path.join(backupDirectory, `stories-region-${sourceHash.slice(0, 12)}`)
  await mkdir(path.join(backupRoot, 'content', 'stories'), { recursive: true })
  await copyFile(sourcePath, path.join(backupRoot, 'compiled_articles.json'), constants.COPYFILE_EXCL)
  for (const name of storyNames) await copyFile(path.join(storiesDirectory, name), path.join(backupRoot, 'content', 'stories', name), constants.COPYFILE_EXCL)
  const backupPath = path.join(backupRoot, 'manifest.json');
  await writeFile(backupPath, `${JSON.stringify({ sourceHash, sourcePath, stories: backup, removedRegions: regionPlan.removed, backedUpFiles: ['compiled_articles.json', ...storyNames.map((name) => `content/stories/${name}`)] }, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  const temporary = `${sourcePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, next, { encoding: "utf8", flag: "wx" });
  await rename(temporary, sourcePath);
  for (const [name, source] of regionPlan.storyNext) {
    if (source === storySources.get(name)) continue
    const target = path.join(storiesDirectory, name)
    const storyTemporary = `${target}.${process.pid}.${Date.now()}.tmp`
    await writeFile(storyTemporary, source, { encoding: 'utf8', flag: 'wx' })
    await rename(storyTemporary, target)
  }
  report.backupPath = backupPath;
}

console.log(JSON.stringify(report, null, 2));
