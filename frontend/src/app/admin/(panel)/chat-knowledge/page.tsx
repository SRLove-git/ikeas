"use client";

import { useEffect, useState } from "react";
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

const RULE_SCHEMA: Schema = {
  fields: [
    { key: "id", label: "规则 ID", kind: { type: "text" } },
    {
      key: "keywords",
      label: "关键词",
      kind: { type: "stringList", placeholder: "触发关键词" },
    },
    { key: "reply", label: "回复内容", kind: { type: "textarea" } },
  ],
};

export default function ChatKnowledgePage() {
  const { notice, show } = useNotice();
  const [data, setData] = useState<KnowledgeBase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        <PageHeader title="客服知识库" />
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
      show("success", "客服知识库已保存");
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="客服知识库"
        description="定义客服机器人的自动回复规则（关键词命中即回复）。保存后运行 export 脚本并重启服务端生效，或配置 IKEA_CHAT_KNOWLEDGE_FILE 指向本文件实现热更新。"
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中…" : "保存知识库"}
          </Button>
        }
      />
      <NoticeArea notice={notice} />

      <Card title={`自动回复规则（${data.rules.length}）`} className="mb-6">
        <SchemaListForm
          value={data.rules as unknown as Record<string, unknown>[]}
          onChange={(rules) => setData({ ...data, rules: rules as KnowledgeRule[] })}
          schema={RULE_SCHEMA}
          labelKey="id"
          titleFor={(rule) =>
            `${String(rule.id ?? "未命名")}（${(rule.keywords as string[] | undefined)?.join(" / ") ?? ""}）`
          }
          newItem={() => ({ id: "", keywords: [], reply: "" })}
        />
      </Card>

      <Card title="兜底回复（未命中任何规则时）">
        <Field label="默认回复">
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
