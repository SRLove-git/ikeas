import Link from "next/link";

export default function SurveyPage() {
  return (
    <main className="font-ikea flex min-h-screen items-center justify-center bg-white text-ikea-black">
      <div className="max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-bold">问卷调查</h1>
        <p className="mt-3 text-sm leading-6 text-ikea-muted">
          感谢您对宜家的关注。问卷服务由宜家官方应用提供,请前往宜家 App 参与。
        </p>
        <Link
          href="/"
          className="i-btn i-btn--primary mt-6 inline-flex h-10 items-center px-6 text-xs font-bold text-white"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
