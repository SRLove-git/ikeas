import { adminGuard } from "@/lib/admin-auth";

/**
 * Proxies operational admin requests (users, carts, favorites, chat) to the
 * Spring Boot backend, injecting the admin key server-side so it never leaks
 * into the browser.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

/** 统一转发到后端；后端不可达时返回可读的错误而不是 500。 */
async function forward(target: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(target, { ...init, cache: "no-store" })
  } catch {
    return Response.json(
      { error: "后端服务不可达，请先启动 Spring Boot（或检查 NEXT_PUBLIC_API_BASE）" },
      { status: 502 },
    )
  }
}

function adminKey(): string {
  return process.env.IKEA_ADMIN_KEY ?? "ikea-admin";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { path } = await params;
  const url = new URL(request.url);
  const target = `${API_BASE}/api/v1/admin/${path.join("/")}${url.search}`;
  const response = await forward(target, { headers: { "X-Admin-Key": adminKey() } });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { path } = await params;
  const target = `${API_BASE}/api/v1/admin/${path.join("/")}${new URL(request.url).search}`;
  const response = await forward(target, {
    method: "DELETE",
    headers: { "X-Admin-Key": adminKey() },
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { path } = await params;
  const target = `${API_BASE}/api/v1/admin/${path.join("/")}${new URL(request.url).search}`;
  const requestType = request.headers.get("content-type") ?? "";

  // 文件上传走 multipart：必须原样透传 Content-Type（含 boundary），
  // 不能先读成文本，否则表单边界丢失、后端解析失败。
  const isMultipart = requestType.includes("multipart/form-data");
  const response = await forward(target, {
    method: "POST",
    headers: {
      "Content-Type": isMultipart ? requestType : "application/json",
      "X-Admin-Key": adminKey(),
    },
    body: isMultipart ? request.body : await request.text(),
    ...(isMultipart ? { duplex: "half" } : {}),
  } as RequestInit & { duplex?: "half" });
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf")) {
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          response.headers.get("content-disposition") ?? "attachment; filename=vouchers.pdf",
      },
    });
  }
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { path } = await params;
  const raw = await request.text();
  const target = `${API_BASE}/api/v1/admin/${path.join("/")}${new URL(request.url).search}`;
  const response = await forward(target, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey(),
    },
    body: raw,
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { path } = await params;
  const raw = await request.text();
  const target = `${API_BASE}/api/v1/admin/${path.join("/")}${new URL(request.url).search}`;
  const response = await forward(target, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey(),
    },
    body: raw,
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}
