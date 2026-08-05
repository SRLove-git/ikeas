"use client";

import { useEffect, useState } from "react";
import { ChatIcon, CloseIcon } from "@/components/icons";
import { ArrowUp } from "lucide-react";

export function FloatingWidgets() {
  const [showCookieBar, setShowCookieBar] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {showCookieBar ? (
        <div className="cloud fixed inset-x-0 bottom-0 z-50 border-t border-ikea-gray-200 bg-white shadow-lg">
          <div className="flex flex-col items-start justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-10">
            <p className="text-sm text-ikea-black">
              宜家官网使用Cookies,让浏览器更简单。查看更多有关浏览器Cookies。若您继续保持浏览宜家官网，我们将默认您接受Cookies。
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                className="text-sm underline underline-offset-2"
              >
                设置
              </button>
              <button
                type="button"
                className="i-btn i-btn--small i-btn--primary"
                onClick={() => setShowCookieBar(false)}
              >
                <span className="i-btn__inner">
                  <span className="i-btn__label">我接受</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="客服"
        className="chat-menu fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ikea-blue text-white shadow-lg transition-transform hover:scale-105"
        onClick={() => setShowChat((current) => !current)}
      >
        <ChatIcon width={28} height={28} />
      </button>

      {showChat ? (
        <div className="fixed bottom-24 right-6 z-40 flex h-[420px] w-[320px] flex-col overflow-hidden rounded-lg border border-ikea-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-ikea-black px-4 py-3 text-white">
            <span className="text-sm font-bold">宜家客服</span>
            <button
              type="button"
              aria-label="关闭"
              onClick={() => setShowChat(false)}
            >
              <CloseIcon width={18} height={18} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            <div className="max-w-[220px] rounded-lg rounded-tl-none bg-ikea-gray-100 p-3 text-sm text-ikea-black">
              你好！小宜随时恭候，请问有什么可以帮你的？
            </div>
          </div>
          <div className="border-t border-ikea-gray-200 p-3">
            <input
              className="w-full rounded-full border border-ikea-gray-200 px-4 py-2 text-sm outline-none focus:border-ikea-blue"
              placeholder="请输入您的问题"
            />
          </div>
        </div>
      ) : null}

      {showBackTop ? (
        <button
          type="button"
          aria-label="回到顶部"
          onClick={backToTop}
          className="i-back-top fixed bottom-6 right-24 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-ikea-black text-white shadow-md transition-opacity hover:opacity-80"
        >
          <ArrowUp width={20} height={20} />
        </button>
      ) : null}
    </>
  );
}
