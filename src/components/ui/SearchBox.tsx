import { cn } from "@/lib/utils";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export function SearchBox({ value, onChange, placeholder, className }: SearchBoxProps) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-text-sub/60">
        <span className="absolute -bottom-1 -right-1 h-2 w-0.5 rotate-[-45deg] rounded-full bg-text-sub/60" />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[28px] border border-black/10 bg-white px-12 py-3.5 text-body-large text-text-main outline-none transition-all placeholder:text-text-sub/55 focus:border-primary/35 focus:ring-4 focus:ring-primary/10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-label-large text-text-sub transition-colors hover:bg-black/5 hover:text-text-main"
        >
          清除
        </button>
      )}
    </div>
  );
}
