import { createBooking } from "@/lib/bookings"

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
  const serviceType = typeof body.serviceType === "string" ? body.serviceType.trim() : ""
  const store = typeof body.store === "string" ? body.store.trim() : ""
  const preferredDate = typeof body.preferredDate === "string" ? body.preferredDate.trim() : ""
  const timeSlot = typeof body.timeSlot === "string" ? body.timeSlot.trim() : ""
  const note = typeof body.note === "string" ? body.note.trim() : ""

  if (!customerName || !phone || !email || !serviceType || !store || !preferredDate) {
    return badRequest("请填写姓名、联系方式、服务项目、门店与预约日期")
  }
  if (!/^[89]\d{7}$/.test(phone)) {
    return badRequest("手机号格式不正确")
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("邮箱格式不正确")
  }

  try {
    const booking = await createBooking({
      customerName,
      phone,
      email,
      serviceType,
      store,
      preferredDate,
      timeSlot,
      note,
    })
    return Response.json(booking, { status: 201 })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 })
  }
}
