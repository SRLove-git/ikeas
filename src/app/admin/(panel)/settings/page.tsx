"use client";

import { useEffect, useState } from "react";
import {
  adminFetch,
  Button,
  Card,
  Field,
  Loading,
  NoticeArea,
  PageHeader,
  TextArea,
  TextInput,
  useNotice,
} from "@/components/admin/admin-ui";

interface Settings {
  siteName: string;
  siteDescription: string;
  adminTitle: string;
  siteCopy: {
    notFound: { title: string; body: string; buttonLabel: string };
    survey: { title: string; body: string; buttonLabel: string };
  };
}

export default function SettingsPage() {
  const { notice, show } = useNotice();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<Settings>("/api/admin/settings");
        setSettings(data);
      } catch (e) {
        show("error", (e as Error).message);
      }
    })();
  }, [show]);

  if (!settings) return <Loading />;

  const update = (patch: Partial<Settings>) => {
    setSettings((current) => (current ? { ...current, ...patch } : current));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      show("success", "网站设置已保存");
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="网站设置"
        description="站点名称、描述等基础配置（作用于浏览器标题与 SEO 描述）。"
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中…" : "保存设置"}
          </Button>
        }
      />
      <NoticeArea notice={notice} />
      <Card title="基础信息">
        <div className="space-y-5">
          <Field label="网站名称">
            <TextInput
              value={settings.siteName}
              onChange={(e) => update({ siteName: e.target.value })}
            />
          </Field>
          <Field label="网站描述（SEO）">
            <TextArea
              rows={3}
              value={settings.siteDescription}
              onChange={(e) => update({ siteDescription: e.target.value })}
            />
          </Field>
          <Field label="后台标题">
            <TextInput
              value={settings.adminTitle}
              onChange={(e) => update({ adminTitle: e.target.value })}
            />
          </Field>
        </div>
      </Card>
      <Card title="404 页面文案" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="标题">
            <TextInput
              value={settings.siteCopy.notFound.title}
              onChange={(e) =>
                update({
                  siteCopy: {
                    ...settings.siteCopy,
                    notFound: { ...settings.siteCopy.notFound, title: e.target.value },
                  },
                })
              }
            />
          </Field>
          <Field label="按钮文案">
            <TextInput
              value={settings.siteCopy.notFound.buttonLabel}
              onChange={(e) =>
                update({
                  siteCopy: {
                    ...settings.siteCopy,
                    notFound: { ...settings.siteCopy.notFound, buttonLabel: e.target.value },
                  },
                })
              }
            />
          </Field>
          <Field label="正文" className="sm:col-span-2">
            <TextArea
              rows={3}
              value={settings.siteCopy.notFound.body}
              onChange={(e) =>
                update({
                  siteCopy: {
                    ...settings.siteCopy,
                    notFound: { ...settings.siteCopy.notFound, body: e.target.value },
                  },
                })
              }
            />
          </Field>
        </div>
      </Card>
      <Card title="问卷页面文案" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="标题">
            <TextInput
              value={settings.siteCopy.survey.title}
              onChange={(e) =>
                update({
                  siteCopy: {
                    ...settings.siteCopy,
                    survey: { ...settings.siteCopy.survey, title: e.target.value },
                  },
                })
              }
            />
          </Field>
          <Field label="按钮文案">
            <TextInput
              value={settings.siteCopy.survey.buttonLabel}
              onChange={(e) =>
                update({
                  siteCopy: {
                    ...settings.siteCopy,
                    survey: { ...settings.siteCopy.survey, buttonLabel: e.target.value },
                  },
                })
              }
            />
          </Field>
          <Field label="正文" className="sm:col-span-2">
            <TextArea
              rows={3}
              value={settings.siteCopy.survey.body}
              onChange={(e) =>
                update({
                  siteCopy: {
                    ...settings.siteCopy,
                    survey: { ...settings.siteCopy.survey, body: e.target.value },
                  },
                })
              }
            />
          </Field>
        </div>
      </Card>
      <div className="mt-6 rounded-lg border border-ikea-gray-200 bg-ikea-gray-50 p-5 text-xs text-ikea-muted">
        后台账号由环境变量控制：ADMIN_USERNAME / ADMIN_PASSWORD（默认 admin / admin123）。
        运营服务（用户/购物车/收藏/聊天）管理密钥：IKEA_ADMIN_KEY（默认 ikea-admin）。
      </div>
    </div>
  );
}
