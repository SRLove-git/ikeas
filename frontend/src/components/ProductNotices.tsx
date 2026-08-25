"use client"

import { useTranslation } from "react-i18next";
import { ChevronRightIcon } from "@/components/icons";
import type { NoticeArticle } from "@/types";

interface ProductNoticesProps {
  notices: NoticeArticle[];
}

export function ProductNotices({ notices }: ProductNoticesProps) {
  const { t } = useTranslation();
  return (
    <div className="pub-page-list">
      <h2>{t("home.productInfoAndNotices")}</h2>
      <div className="pub-page-list-content is-list">
        {notices.map((notice) => (
          <a
            key={notice.title}
            href={notice.href ?? "#"}
            className="pub-list-list--item pub__list"
          >
            <div className="pub__list__info">
              <div className="pub__list__text-wrapper">
                <span className="pub__list__title">{notice.title}</span>
              </div>
            </div>
            <span className="pub__list__icon-wrapper">
              <ChevronRightIcon width={16} height={16} />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
