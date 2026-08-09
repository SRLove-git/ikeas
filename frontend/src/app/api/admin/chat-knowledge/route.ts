import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog } from "@/lib/admin-store";
import { loadDataJson } from "@/lib/data-files";
import fs from "node:fs";
import path from "node:path";

function knowledgePath(): string {
  const candidates = [
    path.join(process.cwd(), "src", "data", "chat-knowledge.json"),
    path.join(process.cwd(), "data", "chat-knowledge.json"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  return Response.json(loadDataJson("chat-knowledge.json"));
}

export async function PUT(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const target = knowledgePath();
    fs.writeFileSync(target, `${JSON.stringify(body, null, 2)}\n`, "utf8");
    await appendChangelog({
      user: "admin",
      action: "update",
      resource: "chat-knowledge",
      target: "chat-knowledge",
      summary: "更新客服知识库",
    });
    return Response.json(body);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
