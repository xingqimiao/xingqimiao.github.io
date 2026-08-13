import HomePage from '@/components/home/HomePage'
import { buildLocalizedMetadata } from '@/lib/localizedMetadata'

const description = 'KiraMyao Equal 是一个关注性别多元群体的独立研究、公共知识与数字公益项目。'

export const metadata = buildLocalizedMetadata({
  locale: 'zh',
  chinesePath: '/',
  title: '跨性别与性少数群体公益信息与倡导',
  description,
  openGraphImage: '/pic/index/og-home.png',
  openGraphImageAlt: 'KiraMyao Equal',
  openGraphType: 'website',
})

export default function DefaultHomePage() {
  return <HomePage locale="zh" />
}
