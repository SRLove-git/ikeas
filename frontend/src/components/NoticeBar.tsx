"use client";

import { useEffect, useState } from "react";
import { InfoIcon } from "@/components/icons";
import { LanguageSwitch } from "@/i18n/LanguageSwitch";
import type { NoticeItem } from "@/types";

interface NoticeBarProps {
  items: NoticeItem[];
}

export function NoticeBar({ items }: NoticeBarProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % items.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [items.length]);

  return (
    <div className="nav-header-message">
      <div className="header-message-inner__wrapper">
        <div className="nav-header-message-notice">
          <div className="header-message-inner">
            {items.map((item, index) => (
              <a
                key={item.text}
                href={item.href ?? "#"}
                className={`message-slide-item ${index === active ? "show" : ""}`}
              >
                <div className="ellipsis">
                  <InfoIcon className="message-icon" width={16} height={16} />
                  <span>{item.text}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="language-switch-container">
          <LanguageSwitch />
        </div>
      </div>
    </div>
  );
}
