"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CartIcon,
  HeartIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { MegaMenu } from "@/components/MegaMenu";
import { menuPanels } from "@/data/menu-panels";
import { categories as allCategories } from "@/data/categories";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  menuItems: { label: string; href: string; hasMegaMenu?: boolean }[];
  searchHints: string[];
}

export function Header({
  menuItems,
  searchHints,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [openAppPromo, setOpenAppPromo] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [bar, setBar] = useState({ width: 0, left: 0, opacity: 0 });
  const [query, setQuery] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (searchHints.length < 2) return;
    const id = window.setInterval(() => {
      setHintIndex((current) => (current + 1) % searchHints.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [searchHints.length]);

  const moveActiveBar = (item: HTMLLIElement) => {
    const label = item.querySelector(".menu-label") ?? item;
    const rect = label.getBoundingClientRect();
    const top = document.querySelector(".header_container_top");
    if (!top) return;
    const topRect = top.getBoundingClientRect();
    setBar({
      width: rect.width,
      left: rect.left - topRect.left,
      opacity: 1,
    });
  };

  const hideActiveBar = () => setBar((prev) => ({ ...prev, opacity: 0 }));

  const activePanel = menuPanels.find((panel) => panel.label === openPanel);

  return (
    <div className="i-layout__header">
      <div className="nav-header">
        <div className="nav-header_container">
          <div className="move-hover">
            <div className="header_container_top">
              <div className="header_container_top_content">
                <div className="header_container_top_content__inner">
                  <div className="header_container_left">
                    <div className="header_container_center">
                      <div className="header_container_center_Logo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="disable-event"
                          src="/images/logo/logo.svg"
                          alt="IKEA 宜家家居"
                          width={100}
                          height={40}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="search-bar-container">
                    <form
                      className="search-input"
                      role="search"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const q = query.trim();
                        if (q) {
                          window.location.href = `/cn/zh/search/products?q=${encodeURIComponent(q)}`;
                        }
                      }}
                    >
                      <SearchIcon className="search-input__icon" width={24} height={24} />
                      <input
                        className="s-input"
                        type="text"
                        aria-label="搜索"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                      <div className="s-header-notice">
                        <div className="i-notice">
                          <div
                            className="i-notice-hints"
                            style={{ transform: `translateY(-${hintIndex * 30}px)` }}
                          >
                            {searchHints.map((hint) => (
                              <p key={hint}>{hint}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div className="header_container_right">
                    <div className="header_container_right_img">
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          {user ? (
                            <Link
                              href="/cn/zh/profile/"
                              className="header-action-btn header-action-btn--login"
                            >
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ikea-blue text-xs font-bold text-white">
                                {user.name.slice(-1)}
                              </span>
                              <span>{user.name}</span>
                            </Link>
                          ) : (
                            <Link
                              href="/cn/zh/profile/login/"
                              className="header-action-btn header-action-btn--login"
                            >
                              <UserIcon width={24} height={24} />
                              <span>登录宜家账号</span>
                            </Link>
                          )}
                          <div className="i-tooltip__body">登录宜家账号</div>
                        </span>
                      </span>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <Link
                            href={user ? "/cn/zh/profile/" : "/cn/zh/profile/login/"}
                            className="header-action-btn"
                          >
                            <UserIcon width={24} height={24} />
                          </Link>
                          <div className="i-tooltip__body">我的个人档案</div>
                        </span>
                      </span>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <div className="header-action-btn">
                            <HeartIcon width={24} height={24} />
                          </div>
                          <div className="i-tooltip__body">我的收藏</div>
                        </span>
                      </span>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <div className="header-action-btn">
                            <CartIcon width={24} height={24} />
                          </div>
                          <div className="i-tooltip__body">购物袋</div>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="header_container_menu_content">
                <ul
                  className="header_container_center_ul"
                  onMouseLeave={hideActiveBar}
                >
                  <span
                    className="active-bar"
                    style={{
                      width: bar.width,
                      transform: `translateX(${bar.left}px)`,
                      opacity: bar.opacity,
                    }}
                  />
                  {menuItems.map((item) => (
                    <li
                      key={item.label}
                      onMouseEnter={(event) => {
                        const panel = menuPanels.find((p) => p.label === item.label);
                        setOpenMenu(item.hasMegaMenu ? item.label : null);
                        setOpenPanel(panel ? panel.label : null);
                        moveActiveBar(event.currentTarget);
                      }}
                      onMouseLeave={() => setOpenPanel(null)}
                    >
                      <a href={menuPanels.find((p) => p.label === item.label)?.href ?? item.href ?? "#"} className="menu-label">
                        {item.label}
                      </a>
                      {item.label === "所有商品" ? (
                        <span className="new_feature_mark" />
                      ) : null}
                    </li>
                  ))}
                  <li
                    className="nav-header-message-app-promotion"
                    onMouseEnter={() => setOpenAppPromo(true)}
                    onMouseLeave={() => setOpenAppPromo(false)}
                  >
                    <div className="basic-content">
                      <div className="basic-title">
                        <span>下载APP</span>
                      </div>
                      {openAppPromo ? (
                        <div className="detail-info-container">
                          <div className="detail-info">
                            <div className="detail-info__close">
                              <button type="button" aria-label="关闭">
                                ×
                              </button>
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              className="bottom-image"
                              src="/images/cms/20210303.png"
                              alt="宜家APP下载二维码"
                            />
                            <div className="detail-desc">
                              扫码下载宜家APP
                              <br />
                              手机购物更方便
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {openMenu ? (
            <div
              className="mega-menu-layer"
              onMouseLeave={() => setOpenMenu(null)}
            >
              <MegaMenu categories={allCategories} />
            </div>
          ) : null}
          {activePanel ? (
            <div
              className="mega-menu-layer"
              onMouseLeave={() => setOpenPanel(null)}
            >
              <div className="header_container_bottom">
                <div className="max-w-page mx-auto flex flex-wrap gap-x-16 gap-y-8 px-10 py-8">
                  {activePanel.blocks.map((block) => (
                    <div key={block.title} className="min-w-[200px]">
                      <h3 className="mb-3 text-sm font-bold">{block.title}</h3>
                      <ul className="space-y-2">
                        {block.links.map((link) => (
                          <li key={link.href}>
                            <a
                              href={link.href}
                              className="text-sm text-ikea-muted transition-colors hover:text-ikea-black"
                            >
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
