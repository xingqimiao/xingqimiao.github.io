export type Locale = 'zh' | 'en'

export const uiDictionary = {
  accessibility: {
    primaryNavigation: 'Primary navigation',
    mobileNavigation: 'Mobile navigation',
    footerNavigation: 'Footer navigation',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
  },
  navigation: {
    stories: 'Stories',
    reports: 'Reports',
    documents: 'Documents',
    projects: 'Projects',
    catCave: 'Cat Cave',
    join: 'Join Us',
  },
  footer: {
    aboutKiramyao: 'About us',
    privacy: 'Privacy Policy',
    projectTrans: 'Project Trans',
    twitter: 'Twitter',
  },
} as const

export function htmlLanguage(_locale: Locale): 'zh-CN' {
  return 'zh-CN'
}

export function stripLocalePath(path: string): string {
  return path
}

export function toLocalePath(path: string, _locale: Locale): string {
  return path
}
