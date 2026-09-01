import fs from "node:fs/promises"
import path from "node:path"

export interface BookingInput {
  customerName: string
  phone: string
  email: string
  serviceType: string
  store: string
  preferredDate: string
  timeSlot: string
  note: string
}

export interface Booking extends BookingInput {
  id: string
  createdAt: string
}

function dataRoot(): string {
  return path.join(process.cwd(), "src", "data")
}

async function readBookings(): Promise<Booking[]> {
  const file = path.join(dataRoot(), "bookings.json")
  try {
    const raw = await fs.readFile(file, "utf8")
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Booking[]) : []
  } catch {
    return []
  }
}

async function writeBookings(bookings: Booking[]): Promise<void> {
  const file = path.join(dataRoot(), "bookings.json")
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, `${JSON.stringify(bookings, null, 2)}\n`, "utf8")
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  const bookings = await readBookings()
  const booking: Booking = {
    ...input,
    id: `BK-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  bookings.push(booking)
  await writeBookings(bookings)
  return booking
}
