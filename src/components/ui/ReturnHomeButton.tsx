import Link from "next/link";

export function ReturnHomeButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center justify-center rounded-full bg-[#121317] px-7 py-3 text-label-large font-medium text-white shadow-[0_10px_30px_rgba(18,19,23,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2b2f36] hover:shadow-[0_14px_36px_rgba(18,19,23,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#121317]"
    >
      返回首页
    </Link>
  );
}
