import type { Metadata } from 'next'
import {
  ArticleRouteView,
  articleRouteMetadata,
  articleStaticParams,
} from '@/components/reading/ArticleRoute'

export const dynamicParams = false

export function generateStaticParams() {
  return articleStaticParams('blog')
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return articleRouteMetadata('zh', 'blog', slug)
}

export default async function CatCaveDetailPage({ params }: Props) {
  const { slug } = await params
  return <ArticleRouteView locale="zh" type="blog" routeSlug={slug} />
}
