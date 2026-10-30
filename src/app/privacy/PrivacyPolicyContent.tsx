'use client'

import React, { useEffect, useState } from 'react'
import privacyData from '@/data/privacy.json'
import { ReturnHomeButton } from '@/components/ui/ReturnHomeButton'
import { LanguageToggle } from '@/components/reading/LanguageToggle'
import type { Locale } from '@/i18n/locale'
import { resolveLocalizedContent } from '@/lib/localizedContent'
import {
  applyDocumentLanguage,
  detectInitialLanguage,
  storeLanguage,
} from '@/i18n/language'

export type PrivacyPolicyData = {
  title?: string
  title_en?: string
  content_html: string
  content_html_en?: string
}

type PrivacyPolicyContentProps = {
  locale: Locale
  content?: PrivacyPolicyData
}

export function PrivacyPolicyContent({
  locale,
  content = privacyData as PrivacyPolicyData,
}: PrivacyPolicyContentProps) {
  const [language, setLanguage] = useState<Locale>(locale)

  useEffect(() => {
    const initial = detectInitialLanguage()
    setLanguage(initial)
    applyDocumentLanguage(initial)
  }, [])

  function toggleLanguage() {
    const next: Locale = language === 'zh' ? 'en' : 'zh'
    setLanguage(next)
    storeLanguage(next)
    applyDocumentLanguage(next)
  }

  const body = resolveLocalizedContent(language, content.content_html, content.content_html_en)
  const heading =
    language === 'en' && content.title_en ? content.title_en : content.title || '隐私政策'

  return (
    <main className="min-h-screen bg-background px-6 pb-24 pt-32">
      <div className="page-enter mx-auto max-w-3xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="text-display-medium font-medium tracking-tight text-text-main">
            {heading}
          </h1>
          {content.content_html_en ? (
            <LanguageToggle
              language={language}
              onToggle={toggleLanguage}
              className="mt-2 shrink-0"
            />
          ) : null}
        </div>

        <div
          lang={body.effectiveLocale === 'en' ? 'en' : 'zh-CN'}
          className="g2-markdown prose prose-lg max-w-none text-text-sub prose-headings:text-text-main prose-p:leading-relaxed prose-a:text-text-main prose-a:underline"
          dangerouslySetInnerHTML={{ __html: body.value }}
        />

        <div className="mt-16">
          <ReturnHomeButton locale={locale} />
        </div>
      </div>
    </main>
  )
}
