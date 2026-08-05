"use client";

import { useState } from "react";
import {
  CartIcon,
  HeartIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { MegaMenu, type MegaMenuCategory } from "@/components/MegaMenu";

interface HeaderProps {
  menuItems: { label: string; href: string; hasMegaMenu?: boolean }[];
  megaMenuCategories: MegaMenuCategory[];
  searchHints: string[];
}

export function Header({
  menuItems,
  megaMenuCategories,
  searchHints,
}: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openAppPromo, setOpenAppPromo] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [bar, setBar] = useState({ width: 0, left: 0, opacity: 0 });

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
                    <div className="search-input">
                      <SearchIcon className="search-input__icon" width={24} height={24} />
                      <input
                        className="s-input"
                        type="text"
                        placeholder=""
                        aria-label="搜索"
                      />
                      <div className="s-header-notice">
                        <div className="i-notice">
                          {searchHints.map((hint, index) => (
                            <p
                              key={hint}
                              className={index === hintIndex ? "show" : ""}
                            >
                              {hint}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="header_container_right">
                    <div className="header_container_right_img">
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <div className="header-action-btn header-action-btn--login">
                            <UserIcon width={24} height={24} />
                            <span>登录宜家账号</span>
                          </div>
                          <div className="i-tooltip__body">登录宜家账号</div>
                        </span>
                      </span>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <div className="header-action-btn">
                            <UserIcon width={24} height={24} />
                          </div>
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
                        setOpenMenu(item.hasMegaMenu ? item.label : null);
                        moveActiveBar(event.currentTarget);
                      }}
                    >
                      <span className="menu-label">{item.label}</span>
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
              <MegaMenu categories={megaMenuCategories} />
            </div>
          ) : null}
          <div className={`nav-header-mask ${openMenu ? "show" : ""}`} />
        </div>
      </div>
    </div>
  );
}
