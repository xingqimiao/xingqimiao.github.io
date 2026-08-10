import type { Metadata } from 'next'
import {
  ArticleRouteView,
  articleRouteMetadata,
  articleStaticParams,
} from '@/components/reading/ArticleRoute'

export const dynamicParams = false

export function generateStaticParams() {
  return articleStaticParams('documents')
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return articleRouteMetadata('zh', 'documents', slug)
}

export default async function DocumentDetailPage({ params }: Props) {
  const { slug } = await params
  return <ArticleRouteView locale="zh" type="documents" routeSlug={slug} />
}
