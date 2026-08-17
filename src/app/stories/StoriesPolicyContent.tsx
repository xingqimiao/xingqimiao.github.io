import React from 'react'
import storiesPolicyData from '@/data/stories_policy.json'
import { EmailContactCard } from '@/components/ui/EmailContactCard'
import type { Locale } from '@/i18n/locale'
import { resolveLocalizedContent } from '@/lib/localizedContent'

export type StoriesPolicyData = {
  title?: string
  content_html: string
  content_html_en?: string
}

type StoriesPolicyContentProps = {
  locale: Locale
  content?: StoriesPolicyData
}

const submitCopy = {
  title: '提交您的故事',
  description:
    '如果你希望分享自己的经历，请将故事发送至下方投稿邮箱。提交前请再次确认你的内容符合以上 Stories 内容政策，并确认你拥有所提交内容的发布权。',
  emailLabel: '投稿邮箱',
} as const

export function StoriesPolicyContent({
  locale,
  content = storiesPolicyData as StoriesPolicyData,
}: StoriesPolicyContentProps) {
  const body = resolveLocalizedContent(
    locale,
    content.content_html,
  )

  return (
    <main className="min-h-screen bg-background px-6 pb-24 pt-32">
      <div className="page-enter mx-auto max-w-3xl">
        <h1 className="mb-8 text-display-medium font-medium tracking-tight text-text-main">
          {content.title || 'Stories 内容政策'}
        </h1>

        <div
          lang="zh-CN"
          className="g2-markdown prose prose-lg max-w-none text-text-sub prose-headings:text-text-main prose-p:leading-relaxed prose-a:text-text-main prose-a:underline"
          dangerouslySetInnerHTML={{ __html: body.value }}
        />

        <section className="mb-16 mt-16 rounded-[28px] border border-black/10 bg-white p-6 md:p-8">
          <h2 className="mb-3 text-title-large font-semibold text-text-main">{submitCopy.title}</h2>
          <p className="mb-6 text-body-large text-text-sub">{submitCopy.description}</p>
          <EmailContactCard label={submitCopy.emailLabel} address="stories@kiramyao.com" />
        </section>
      </div>
    </main>
  )
}