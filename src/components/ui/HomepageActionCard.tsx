interface HomepageActionCardProps {
  title: string;
  coverName?: string;
}

export function HomepageActionCard({ title, coverName }: HomepageActionCardProps) {
  return (
    <div className="group relative h-[220px] sm:h-[300px] md:h-[400px] rounded-[32px] md:rounded-[48px] p-[20px_20px_0_20px] md:p-[38px_38px_0_38px] transition-transform duration-500 hover:-translate-y-1">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-5 bottom-0 z-0 md:inset-x-[38px] md:top-[38px]"
      >
        {/* L3: top ambient field — soft dome anchored at the image top edge, ~70px upward */}
        <div
          className="absolute -top-16 -inset-x-5 h-16 origin-bottom opacity-80 blur-[18px] transition-all duration-500 group-hover:scale-[1.06] group-hover:opacity-100 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(245,169,184,0.90)_0%,transparent_75%),radial-gradient(45%_95%_at_50%_100%,rgba(183,228,199,0.45)_0%,transparent_68%)] dark:bg-[radial-gradient(60%_100%_at_50%_100%,rgba(245,169,184,0.32)_0%,transparent_68%),radial-gradient(45%_95%_at_50%_100%,rgba(183,228,199,0.20)_0%,transparent_62%)]"
        />
        {/* L4: side ambient lobes at the image top corners, merging into the top field */}
        <div
          className="absolute -top-8 -inset-x-5 h-8 opacity-80 blur-[18px] transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(42%_150%_at_20px_100%,rgba(91,206,250,0.65)_0%,transparent_72%),radial-gradient(42%_150%_at_calc(100%-20px)_100%,rgba(196,181,253,0.65)_0%,transparent_72%)] dark:bg-[radial-gradient(42%_150%_at_20px_100%,rgba(91,206,250,0.26)_0%,transparent_72%),radial-gradient(42%_150%_at_calc(100%-20px)_100%,rgba(196,181,253,0.26)_0%,transparent_72%)]"
        />
      </div>

      <div className="relative z-10 h-full overflow-hidden rounded-t-[30px] rounded-b-none bg-[#f5f5f7] dark:bg-[#f5f5f7]">
        {coverName ? (
          <img
            src={coverName}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#ffffff,#f5f5f7)] dark:bg-[linear-gradient(135deg,#ffffff,#f5f5f7)]">
            <span className="text-label-large text-text-sub/55">KiraEqual Action</span>
          </div>
        )}
        {/* L1: inner edge light — barely-perceptible sheen, no edge banding */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100 [mask-image:linear-gradient(180deg,black_0%,black_40%,transparent_70%)] [-webkit-mask-image:linear-gradient(180deg,black_0%,black_40%,transparent_70%)] bg-[linear-gradient(180deg,rgba(245,169,184,0.08)_0%,rgba(245,169,184,0.03)_38%,transparent_60%),linear-gradient(90deg,rgba(91,206,250,0.05)_0%,transparent_10%),linear-gradient(270deg,rgba(196,181,253,0.05)_0%,transparent_10%)] dark:bg-[linear-gradient(180deg,rgba(245,169,184,0.05)_0%,rgba(245,169,184,0.02)_38%,transparent_60%),linear-gradient(90deg,rgba(91,206,250,0.04)_0%,transparent_10%),linear-gradient(270deg,rgba(196,181,253,0.04)_0%,transparent_10%)]"
        />
      </div>
    </div>
  );
}
