import localFont from 'next/font/local'
import CanvasBackground from '@/components/CanvasBackground'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import { htmlLanguage, type Locale } from '@/i18n/locale'

const googleSans = localFont({
  src: [
    { path: './fonts/GoogleSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/GoogleSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/GoogleSans-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-google-sans',
  fallback: ['Arial', 'sans-serif'],
  display: 'swap',
})

const harmonyOSSans = localFont({
  src: [
    { path: './fonts/HarmonyOSSansSC-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/HarmonyOSSansSC-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/HarmonyOSSansSC-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-harmony-sans',
  fallback: ['Microsoft YaHei', 'Arial', 'sans-serif'],
  display: 'swap',
})

export function SiteDocument({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <html
      lang={htmlLanguage(locale)}
      className={`${googleSans.variable} ${harmonyOSSans.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col overflow-x-hidden bg-background font-sans text-text-main">
        <CanvasBackground />
        <Navbar locale={locale} />
        <div className="relative z-10 flex flex-grow flex-col">{children}</div>
        <Footer locale={locale} />
      </body>
    </html>
  )
}
