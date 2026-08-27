import { createWarrantyRegistration } from "@/lib/warranty-registrations";

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return badRequest("请求内容不能为空");
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const productName = typeof body.productName === "string" ? body.productName.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const purchaseDate = typeof body.purchaseDate === "string" ? body.purchaseDate.trim() : "";
  const invoiceNo = typeof body.invoiceNo === "string" ? body.invoiceNo.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!customerName || !phone || !email || !productName || !purchaseDate) {
    return badRequest("请填写姓名、联系方式、商品名称和购买日期");
  }
  if (!/^[89]\d{7}$/.test(phone)) {
    return badRequest("手机号格式不正确");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("邮箱格式不正确");
  }

  try {
    const registration = await createWarrantyRegistration({
      customerName,
      phone,
      email,
      productName,
      model,
      purchaseDate,
      invoiceNo,
      note,
    });
    return Response.json(registration, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
