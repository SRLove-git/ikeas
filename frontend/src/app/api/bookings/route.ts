const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080"

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) {
    return badRequest("请求内容不能为空")
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim() : ""
  const voucherCode = typeof body.voucherCode === "string" ? body.voucherCode.trim() : ""
  const serviceType = typeof body.serviceType === "string" ? body.serviceType.trim() : ""
  const store = typeof body.store === "string" ? body.store.trim() : ""
  const preferredDate = typeof body.preferredDate === "string" ? body.preferredDate.trim() : ""
  const timeSlot = typeof body.timeSlot === "string" ? body.timeSlot.trim() : ""
  const note = typeof body.note === "string" ? body.note.trim() : ""

  if (
    !customerName ||
    !phone ||
    !email ||
    !voucherCode ||
    !serviceType ||
    !store ||
    !preferredDate
  ) {
    return badRequest("请填写姓名、联系方式、体检券码、服务项目、门店与预约日期")
  }
  if (!/^[89]\d{7}$/.test(phone)) {
    return badRequest("手机号格式不正确")
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("邮箱格式不正确")
  }

  try {
    const response = await fetch(`${API_BASE}/api/v1/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        phone,
        email,
        voucherCode,
        serviceType,
        store,
        preferredDate,
        timeSlot,
        note,
      }),
    })
    const data = (await response.json().catch(() => null)) as {
      bookingNo?: string
      message?: string
      error?: string
    } | null
    if (!response.ok) {
      return badRequest(data?.message ?? data?.error ?? "预约提交失败")
    }
    return Response.json({ id: data?.bookingNo }, { status: 201 })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 502 })
  }
}
