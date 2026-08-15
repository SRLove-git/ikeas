import fs from "node:fs/promises";
import path from "node:path";

export interface WarrantyRegistrationInput {
  customerName: string;
  phone: string;
  email: string;
  productName: string;
  model: string;
  purchaseDate: string;
  invoiceNo: string;
  note: string;
}

export interface WarrantyRegistration extends WarrantyRegistrationInput {
  id: string;
  createdAt: string;
}

function dataRoot(): string {
  return path.join(process.cwd(), "src", "data");
}

async function readRegistrations(): Promise<WarrantyRegistration[]> {
  const file = path.join(dataRoot(), "warranty-registrations.json");
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as WarrantyRegistration[]) : [];
  } catch {
    return [];
  }
}

async function writeRegistrations(registrations: WarrantyRegistration[]): Promise<void> {
  const file = path.join(dataRoot(), "warranty-registrations.json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(registrations, null, 2)}\n`, "utf8");
}

export async function createWarrantyRegistration(
  input: WarrantyRegistrationInput,
): Promise<WarrantyRegistration> {
  const registrations = await readRegistrations();
  const registration: WarrantyRegistration = {
    ...input,
    id: `WR-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  registrations.push(registration);
  await writeRegistrations(registrations);
  return registration;
}
