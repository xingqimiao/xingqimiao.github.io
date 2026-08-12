import React from 'react'
import privacyData from '@/data/privacy.json'
import { ReturnHomeButton } from '@/components/ui/ReturnHomeButton'
import type { Locale } from '@/i18n/locale'
import { resolveLocalizedContent } from '@/lib/localizedContent'

export type PrivacyPolicyData = {
  title?: string
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
  const body = resolveLocalizedContent(
    locale,
    content.content_html,
  )

  return (
    <main className="min-h-screen bg-background px-6 pb-24 pt-32">
      <div className="page-enter mx-auto max-w-3xl">
        <h1 className="mb-8 text-display-medium font-medium tracking-tight text-text-main">
          {content.title || '隐私政策'}
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
