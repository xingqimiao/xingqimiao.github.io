import type { Metadata } from 'next'
import {
  ArticleRouteView,
  articleRouteMetadata,
  articleStaticParams,
} from '@/components/reading/ArticleRoute'

export const dynamicParams = false

export function generateStaticParams() {
  return articleStaticParams('stories')
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return articleRouteMetadata('zh', 'stories', slug)
}

export default async function StoryDetailPage({ params }: Props) {
  const { slug } = await params
  return <ArticleRouteView locale="zh" type="stories" routeSlug={slug} />
}
