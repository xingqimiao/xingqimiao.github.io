interface HomepageActionCardProps {
  title: string;
  coverName?: string;
}

export function HomepageActionCard({ title, coverName }: HomepageActionCardProps) {
  return (
    <div className="group relative h-[400px] overflow-hidden rounded-[48px] bg-white p-[38px_38px_0_38px]">
      <div className="pointer-events-none absolute left-[56px] right-[56px] top-[24px] h-[42px] rounded-full bg-[linear-gradient(90deg,rgba(166,211,255,0.7),rgba(255,201,230,0.72)_30%,rgba(255,240,181,0.5)_55%,rgba(199,242,224,0.62)_78%,rgba(208,201,255,0.5))] blur-[16px]" />
      <div className="pointer-events-none absolute bottom-[0] left-[2px] top-[46px] w-[92px] rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,203,231,0.14)_18%,rgba(255,203,231,0.48)_52%,rgba(166,211,255,0.72)_100%)] blur-[20px]" />
      <div className="pointer-events-none absolute bottom-[0] right-[2px] top-[46px] w-[92px] rounded-full bg-[linear-gradient(270deg,rgba(255,255,255,0)_0%,rgba(208,201,255,0.14)_18%,rgba(208,201,255,0.46)_52%,rgba(199,242,224,0.7)_100%)] blur-[20px]" />
      <div className="relative z-10 h-full overflow-hidden rounded-t-[30px] rounded-b-none bg-[#f5f5f7]">
        {coverName ? (
          <img
            src={coverName}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#ffffff,#f5f5f7)]">
            <span className="text-label-large text-text-sub/55">KiraEqual Action</span>
          </div>
        )}
      </div>
    </div>
  );
}
