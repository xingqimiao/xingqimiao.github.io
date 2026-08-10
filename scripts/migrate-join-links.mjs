import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, rename, writeFile, constants } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const joinPath = path.join(root, 'src', 'data', 'join.json')
const target = path.join(root, 'src', 'data', 'join_links.json')
const apply = process.argv.includes('--apply')
const raw = await readFile(joinPath, 'utf8')
const sourceHash = createHash('sha256').update(raw).digest('hex')
const join = JSON.parse(raw)
const links = [
  { id: 'google-survey', enabled: Boolean(join.survey_enabled), label: join.survey_label || '填写问卷', url: join.survey_url, source: 'Google Forms', logo: join.google_survey_logo || '/pic/join/google_forms_logo.svg', order: 1 },
  { id: 'tencent-survey', enabled: Boolean(join.survey_enabled), label: `${join.survey_label || '填写问卷'}（腾讯问卷）`, url: join.tencent_survey_url, source: '腾讯问卷', logo: join.tencent_survey_logo || '/pic/join/tencent_wenjuan_logo.svg', order: 2 },
  { id: 'volunteer-recruitment', enabled: true, label: join.recruitment_label || '加入 KiraMyao Equal｜志愿者招募表', url: join.recruitment_url, source: 'Google Forms', logo: join.google_survey_logo || '/pic/join/google_forms_logo.svg', order: 3 },
]
const next = `${JSON.stringify(links, null, 2)}\n`
const report = { mode: apply ? 'apply' : 'dry-run', sourceHash, links }
if (apply) {
  const backupRoot = path.join(root, 'migration-backups', `join-links-${sourceHash.slice(0, 12)}`)
  await mkdir(backupRoot, { recursive: true })
  await copyFile(joinPath, path.join(backupRoot, 'join.json'), constants.COPYFILE_EXCL)
  await writeFile(path.join(backupRoot, 'manifest.json'), `${JSON.stringify({ sourceHash, sourcePath: joinPath, target, links }, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, next, { encoding: 'utf8', flag: 'wx' })
  await rename(temporary, target)
  report.backupPath = backupRoot
}
console.log(JSON.stringify(report, null, 2))
