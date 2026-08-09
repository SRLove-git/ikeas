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
  ObjectListEditor,
  PageHeader,
  TextArea,
  useNotice,
} from "@/components/admin/admin-ui";

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
        description="定义客服机器人小宜的自动回复规则（关键词命中即回复）。保存后运行 export 脚本并重启服务端生效，或配置 IKEA_CHAT_KNOWLEDGE_FILE 指向本文件实现热更新。"
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中…" : "保存知识库"}
          </Button>
        }
      />
      <NoticeArea notice={notice} />

      <Card title={`自动回复规则（${data.rules.length}）`} className="mb-6">
        <ObjectListEditor
          value={data.rules as unknown as Record<string, unknown>[]}
          onChange={(rules) =>
            setData({ ...data, rules: rules as unknown as KnowledgeRule[] })
          }
          labelKey="id"
          titleFor={(rule) =>
            `${String(rule.id ?? "未命名")}（${(rule.keywords as string[] | undefined)?.join(" / ") ?? ""}）`
          }
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
