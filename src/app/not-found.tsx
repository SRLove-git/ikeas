import Link from "next/link";
import { SiteImage } from "@/components/SiteImage";

export default function NotFound() {
  return (
    <main className="font-ikea flex min-h-screen items-center justify-center bg-white text-ikea-black">
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <SiteImage
          src="https://static.web.ikea.cn/static/404.png"
          alt="404"
          className="w-[260px] lg:w-[360px]"
          imgClassName="h-auto object-contain"
        />
        <h1 className="mt-8 text-base font-bold">
          404:哎呀,页面迷路了… 但别担心!
        </h1>
        <p className="mt-3 max-w-[332px] text-sm leading-6 text-ikea-muted">
          我们正在找寻家里的每个角落,但它还在玩捉迷藏。把这次小意外当作探索新事物的机会吧,毕竟,惊喜往往是意想不到的!
        </p>
        <Link
          href="/"
          className="i-btn i-btn--primary mt-6 inline-flex h-10 items-center px-6 text-xs font-bold text-white"
        >
          <span className="i-btn__label">返回首页</span>
        </Link>
      </div>
    </main>
  );
}
