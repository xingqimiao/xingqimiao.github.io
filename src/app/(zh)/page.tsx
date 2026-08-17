import HomePage from '@/components/home/HomePage'
import { buildLocalizedMetadata } from '@/lib/localizedMetadata'
import { siteJsonLd } from '@/lib/jsonLd'

const description =
  'KiraMyao Equal 是关注中国跨性别群体与性别多元社群的独立研究、公共知识与数字公益项目，提供跨性别生存现状调研报告与真实经历文集。'

export const metadata = buildLocalizedMetadata({
  locale: 'zh',
  chinesePath: '/',
  title: 'KiraEqual 跨性别研究 ·报告与故事',
  description,
  keywords: [
    '跨性别',
    '中国跨性别',
    '跨性别报告',
    '跨性别故事',
    '中国跨性别报告',
    '跨性别群体',
    '性别多元',
    'MtF',
    'FtM',
    'KiraEqual',
  ],
  openGraphImage: '/pic/index/og-home.png',
  openGraphImageAlt: 'KiraEqual 跨性别研究 ·报告与故事',
  openGraphType: 'website',
})

export default function DefaultHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
      />
      <HomePage locale="zh" />
    </>
  )
}
