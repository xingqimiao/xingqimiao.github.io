import '../../../report-full.css'

// report-full.css styles the full-report article container (.reading-page .report-full),
// which only exists in report article bodies — scope the CSS to this route instead of
// shipping 33 KiB of report styling on every site page.
export default function ReportArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
