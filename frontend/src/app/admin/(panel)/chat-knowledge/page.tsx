"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  adminFetch,
  Button,
  Card,
  Field,
  Loading,
  Notice,
  NoticeArea,
  PageHeader,
  TextArea,
  useNotice,
} from "@/components/admin/admin-ui";
import { SchemaListForm, type Schema } from "@/components/admin/SchemaForms";

interface KnowledgeRule {
  id: string;
  keywords: string[];
  reply: string;
}

interface KnowledgeBase {
  rules: KnowledgeRule[];
  defaultReply: string;
}

export default function ChatKnowledgePage() {
  const { t } = useTranslation();
  const { notice, show } = useNotice();
  const [data, setData] = useState<KnowledgeBase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const RULE_SCHEMA: Schema = {
    fields: [
      { key: "id", label: t("admin.chatKnowledge.ruleId"), kind: { type: "text" } },
      {
        key: "keywords",
        label: t("admin.chatKnowledge.keywords"),
        kind: { type: "stringList", placeholder: t("admin.chatKnowledge.keywordPlaceholder") },
      },
      { key: "reply", label: t("admin.chatKnowledge.reply"), kind: { type: "textarea" } },
    ],
  };

  useEffect(() => {
    void (async () => {
      try {
        const knowledge = await adminFetch<KnowledgeBase>("/api/admin/chat-knowledge");
        setData(knowledge);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  if (!data) {
    return error ? (
      <div className="max-w-3xl">
        <PageHeader title={t("admin.chatKnowledge.title")} />
        <Notice kind="error">{error}</Notice>
      </div>
    ) : (
      <Loading />
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch("/api/admin/chat-knowledge", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      show("success", t("admin.chatKnowledge.saved"));
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t("admin.chatKnowledge.title")}
        description={t("admin.chatKnowledge.desc")}
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? t("admin.common.saving") : t("admin.chatKnowledge.saveKnowledge")}
          </Button>
        }
      />
      <NoticeArea notice={notice} />

      <Card
        title={t("admin.chatKnowledge.rulesCard", { count: data.rules.length })}
        className="mb-6"
      >
        <SchemaListForm
          value={data.rules as unknown as Record<string, unknown>[]}
          onChange={(rules) => setData({ ...data, rules: rules as KnowledgeRule[] })}
          schema={RULE_SCHEMA}
          labelKey="id"
          titleFor={(rule) =>
            `${String(rule.id ?? t("admin.ui.unnamed"))} (${
              (rule.keywords as string[] | undefined)?.join(" / ") ?? ""
            })`
          }
          newItem={() => ({ id: "", keywords: [], reply: "" })}
        />
      </Card>

      <Card title={t("admin.chatKnowledge.fallbackCard")}>
        <Field label={t("admin.chatKnowledge.defaultReply")}>
          <TextArea
            rows={4}
            value={data.defaultReply}
            onChange={(e) => setData({ ...data, defaultReply: e.target.value })}
          />
        </Field>
      </Card>
    </div>
  );
}
