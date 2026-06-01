import React from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-white dark:bg-background min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-label-large tracking-widest text-primary font-medium uppercase">
          🔒 Privacy / 隐私政策
        </div>
        <h1 className="text-display-medium text-text-main font-medium tracking-tight mb-8">
          隐私权保护声明
        </h1>

        <div className="space-y-6 text-body-large text-text-sub leading-relaxed">
          <p>
            KiraEqual 非常重视您的隐私。我们承诺在运营此开源和去中心化项目时，不主动收集、存储或分析您的个人识别信息（PII）。
          </p>
          <h2 className="text-title-large text-text-main font-semibold mt-8 mb-4">
            1. 数据收集与使用
          </h2>
          <p>
            本网站是一个静态展示的站点。除了浏览器标准日志（如您的 IP 地址和访问时间，这由托管服务商如 GitHub Pages 自动记录外），我们不会通过任何形式的 Cookie、追踪脚本或动态数据库收集您的个人数据。
          </p>
          <h2 className="text-title-large text-text-main font-semibold mt-8 mb-4">
            2. 第三方链接
          </h2>
          <p>
            本网站可能包含指向第三方网站（如 Twitter、Project Trans 或外部文章）的链接。我们不对这些第三方网站的隐私权政策或内容承担责任。当您点击这些链接离开本站时，请注意阅读目标站点的隐私声明。
          </p>
          <h2 className="text-title-large text-text-main font-semibold mt-8 mb-4">
            3. 安全保障
          </h2>
          <p>
            我们通过静态化的部署机制（编译后发布至 GitHub Pages）最大程度地减少了安全漏洞的暴露面，为您提供安全且无追踪的访问体验。
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-16">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black/5 dark:bg-white/5 text-label-large text-text-main hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
