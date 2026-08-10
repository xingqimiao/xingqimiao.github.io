import React from 'react'
import aboutData from '@/data/about.json'
import { ReturnHomeButton } from '@/components/ui/ReturnHomeButton'
import type { Locale } from '@/i18n/locale'
import { splitAboutHtml } from '@/lib/aboutSections'
import { resolveLocalizedContent } from '@/lib/localizedContent'

export type AboutKiraMyaoData = {
  title?: string
  content_html?: string
  kiramyao_html?: string
  content_html_en?: string
  kiramyao_html_en?: string
}

type AboutKiraMyaoContentProps = {
  locale: Locale
  content?: AboutKiraMyaoData
}

export function AboutKiraMyaoContent({
  locale,
  content = aboutData as AboutKiraMyaoData,
}: AboutKiraMyaoContentProps) {
  const chineseSections = splitAboutHtml(
    content.content_html || '',
    content.kiramyao_html,
  )
  const body = resolveLocalizedContent(
    locale,
    chineseSections.kiraMyaoHtml,
  )

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-32 dark:bg-background">
      <div className="page-enter mx-auto max-w-3xl">
        <h1 className="mb-8 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          关于 KiraMyao
        </h1>

        <div
          lang="zh-CN"
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
