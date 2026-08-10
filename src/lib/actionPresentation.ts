import type { Locale } from '../i18n/locale'

export type ActionStatus = 'running' | 'paused' | 'completed' | 'delayed' | 'failed'

export type ActionItem = {
  id: string
  name: string
  desc: string
  status: ActionStatus
}

const statusLabels: Record<ActionStatus, string> = {
  running: '正在执行',
  paused: '暂停',
  completed: '已完成',
  delayed: '延期',
  failed: '失败',
}

const actionCopy = {
  heading: '行动，改变现在',
  metadataTitle: '行动与项目',
  metadataDescription: '查看 KiraMyao Equal 正在进行的社会倡导行动与关怀项目。',
} as const

export function buildActionPresentation(_locale: Locale, actions: readonly ActionItem[]) {
  const localizedActions = actions.map((action) => ({
    ...action,
    name: action.name,
    desc: action.desc,
    statusLabel: statusLabels[action.status],
    contentLanguage: 'zh-CN' as const,
    fallback: false,
  }))

  return {
    ...actionCopy,
    actions: localizedActions,
    fallbackCount: 0,
  }
}
