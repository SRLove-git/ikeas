"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      show("success", t("admin.settings.saved"));
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={t("admin.settings.title")}
        description={t("admin.settings.desc")}
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? t("admin.common.saving") : t("admin.settings.save")}
          </Button>
        }
      />
      <NoticeArea notice={notice} />
      <Card title={t("admin.settings.basicInfo")}>
        <div className="space-y-5">
          <Field label={t("admin.settings.siteName")}>
            <TextInput
              value={settings.siteName}
              onChange={(e) => update({ siteName: e.target.value })}
            />
          </Field>
          <Field label={t("admin.settings.siteDescription")}>
            <TextArea
              rows={3}
              value={settings.siteDescription}
              onChange={(e) => update({ siteDescription: e.target.value })}
            />
          </Field>
          <Field label={t("admin.settings.adminTitle")}>
            <TextInput
              value={settings.adminTitle}
              onChange={(e) => update({ adminTitle: e.target.value })}
            />
          </Field>
        </div>
      </Card>
      <Card title={t("admin.settings.notFoundCopy")} className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.settings.title")}>
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
          <Field label={t("admin.settings.buttonLabel")}>
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
          <Field label={t("admin.settings.body")} className="sm:col-span-2">
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
      <Card title={t("admin.settings.surveyCopy")} className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.settings.title")}>
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
          <Field label={t("admin.settings.buttonLabel")}>
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
          <Field label={t("admin.settings.body")} className="sm:col-span-2">
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
        {t("admin.settings.envHint")}
      </div>
    </div>
  );
}
