import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { applySlugMigration, planSlugMigration } from './lib/slug-migration.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const plan = await planSlugMigration(root)
console.log(JSON.stringify({ mapping: plan.mapping, changedFiles: plan.changes.length, renames: plan.changes.filter((item) => item.source !== item.target).map(({ source, target }) => ({ source, target })) }, null, 2))
if (process.argv.includes('--apply')) console.log(`BACKUP=${await applySlugMigration(root, plan)}`)
