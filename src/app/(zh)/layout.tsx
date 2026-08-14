import { SiteDocument } from '@/app/SiteDocument'
import { buildSiteMetadata } from '@/lib/siteMetadata'
import '../globals.css'

export const metadata = buildSiteMetadata('zh')

export default function DefaultRootLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument locale="zh">{children}</SiteDocument>
}
