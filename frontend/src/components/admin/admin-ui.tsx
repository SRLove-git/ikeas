"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getActiveLocale } from "@/i18n/client";

// ---------------------------------------------------------------------------
// Admin panel primitives (client components). Kept dependency-free on purpose.
// ---------------------------------------------------------------------------

export async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401) {
    window.location.href = "/admin/login";
    throw new Error(adminErrorText("未登录"));
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      body?.error ? adminErrorText(body.error) : adminErrorText(`请求失败 (${response.status})`),
    );
  }
  return body as T;
}

const ADMIN_ERROR_EN: Record<string, string> = {
  "未登录": "Not logged in",
  "未登录或会话已过期": "Not logged in or session expired",
  "账号或密码错误": "Incorrect username or password",
  "请求体不能为空": "Request body cannot be empty",
  "缺少 updates": "Missing updates",
  "订单不存在": "Order not found",
  "商品不存在": "Product not found",
  "商品名称不能为空": "Product name is required",
  "页面 URL 不能为空": "Page URL is required",
  "落地页不存在": "Landing page not found",
};

/** Localizes known frontend-generated admin error messages for English mode. */
export function adminErrorText(message: string): string {
  if (getActiveLocale() !== "en") return message;
  if (Object.prototype.hasOwnProperty.call(ADMIN_ERROR_EN, message)) {
    return ADMIN_ERROR_EN[message];
  }
  const requestFailed = /^请求失败 \((\d+)\)$/.exec(message);
  if (requestFailed) return `Request failed (${requestFailed[1]})`;
  return message;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-ikea-blue text-white hover:bg-blue-800 disabled:bg-ikea-gray-300",
    secondary:
      "bg-white text-ikea-black border border-ikea-gray-300 hover:bg-ikea-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-ikea-gray-300",
    ghost: "text-ikea-blue hover:bg-blue-50",
  };
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-ikea-gray-300 bg-white px-3 text-sm text-ikea-black outline-none transition focus:border-ikea-blue focus:ring-2 focus:ring-blue-100",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-ikea-gray-300 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-ikea-black outline-none transition focus:border-ikea-blue focus:ring-2 focus:ring-blue-100",
        className,
      )}
      {...props}
    />
  );
}

export function NumberInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      className={cn(
        "h-9 w-full rounded-md border border-ikea-gray-300 bg-white px-3 text-sm text-ikea-black outline-none transition focus:border-ikea-blue focus:ring-2 focus:ring-blue-100",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-ikea-gray-300 bg-white px-3 text-sm text-ikea-black outline-none transition focus:border-ikea-blue",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-ikea-black">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ikea-muted">{hint}</span> : null}
    </label>
  );
}

export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-ikea-gray-200 bg-white", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-ikea-gray-200 px-5 py-3.5">
          {title ? <h2 className="text-sm font-bold text-ikea-black">{title}</h2> : <div />}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-ikea-black">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ikea-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-ikea-muted transition-colors hover:text-ikea-blue"
    >
      ← {label}
    </a>
  );
}

export function Notice({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <div className={cn("rounded-md border px-3 py-2 text-sm", styles[kind])}>
      {children}
    </div>
  );
}

export function Loading({ label }: { label?: string }) {
  const { t } = useTranslation();
  const resolved = label ?? t("admin.ui.loading");
  return <div className="py-10 text-center text-sm text-ikea-muted">{resolved}</div>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-12 text-center text-sm text-ikea-muted">{children}</div>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("admin.ui.search");
  return (
    <TextInput
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={resolvedPlaceholder}
      className="w-64"
    />
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-ikea-gray-200 px-5 py-3 text-sm text-ikea-muted">
      <span>
        {t("admin.ui.paginationInfo", { total, page, pages })}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          {t("admin.ui.prev")}
        </Button>
        <Button
          variant="secondary"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          {t("admin.ui.next")}
        </Button>
      </div>
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  children,
  variant = "danger",
  confirmText,
}: {
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
  variant?: ButtonVariant;
  confirmText?: string;
}) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const resolvedConfirmText = confirmText ?? t("admin.ui.confirmDelete");

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <Button
      variant={variant}
      disabled={busy}
      onClick={(event) => {
        event.preventDefault();
        void handleClick();
      }}
    >
      {confirming ? resolvedConfirmText : children}
    </Button>
  );
}

export function useNotice() {
  const [notice, setNotice] = useState<{
    kind: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback(
    (kind: "error" | "success" | "info", text: string) => {
      setNotice({ kind, text });
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setNotice(null), 4000);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return { notice, show, setNotice };
}

export function NoticeArea({
  notice,
}: {
  notice: ReturnType<typeof useNotice>["notice"];
}) {
  if (!notice) return null;
  return (
    <div className="mb-4">
      <Notice kind={notice.kind}>{notice.text}</Notice>
    </div>
  );
}

// ---------------------------------------------------------------------------
// JSON editing helpers
// ---------------------------------------------------------------------------

export function JsonEditor({
  value,
  onChange,
  rows = 8,
  label,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  rows?: number;
  label?: string;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<{ text: string; source: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const source = JSON.stringify(value, null, 2) ?? "null";
  const text = draft && draft.source === source ? draft.text : source;

  const commit = (next: string) => {
    setDraft({ text: next, source });
    try {
      const parsed = JSON.parse(next);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div>
      {label ? <div className="mb-1 text-xs font-medium text-ikea-muted">{label}</div> : null}
      <TextArea
        rows={rows}
        value={text}
        onChange={(event) => commit(event.target.value)}
        className={cn(error && "border-red-400")}
      />
      {error ? (
        <div className="mt-1 text-xs text-red-600">
          {t("admin.ui.jsonInvalid", { message: error })}
        </div>
      ) : null}
    </div>
  );
}

export function StringListEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("admin.ui.newItem");
  const update = (index: number, next: string) => {
    const copy = [...value];
    copy[index] = next;
    onChange(copy);
  };
  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex gap-2">
          <TextInput
            value={item}
            onChange={(event) => update(index, event.target.value)}
            placeholder={resolvedPlaceholder}
          />
          <Button
            variant="ghost"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            {t("admin.ui.remove")}
          </Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...value, ""])}>
        {t("admin.ui.add")}
      </Button>
    </div>
  );
}

export function ObjectListEditor({
  value,
  onChange,
  labelKey = "title",
  titleFor,
}: {
  value: Record<string, unknown>[];
  onChange: (value: Record<string, unknown>[]) => void;
  labelKey?: string;
  titleFor?: (item: Record<string, unknown>, index: number) => string;
}) {
  const { t } = useTranslation();
  const updateItem = (index: number, next: Record<string, unknown>) => {
    const copy = [...value];
    copy[index] = next;
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <div key={index} className="rounded-md border border-ikea-gray-200 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-xs font-bold text-ikea-black">
              #{index + 1} {titleFor?.(item, index) ?? String(item[labelKey] ?? t("admin.ui.unnamed"))}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                disabled={index === 0}
                onClick={() => {
                  const copy = [...value];
                  const temp = copy[index - 1];
                  copy[index - 1] = copy[index];
                  copy[index] = temp;
                  onChange(copy);
                }}
              >
                {t("admin.ui.moveUp")}
              </Button>
              <Button
                variant="ghost"
                disabled={index === value.length - 1}
                onClick={() => {
                  const copy = [...value];
                  const temp = copy[index + 1];
                  copy[index + 1] = copy[index];
                  copy[index] = temp;
                  onChange(copy);
                }}
              >
                {t("admin.ui.moveDown")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                {t("admin.ui.delete")}
              </Button>
            </div>
          </div>
          <JsonEditor
            value={item}
            onChange={(next) => updateItem(index, next as Record<string, unknown>)}
            rows={6}
          />
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() => onChange([...value, { [labelKey]: "" }])}
      >
        {t("admin.ui.add")}
      </Button>
    </div>
  );
}
