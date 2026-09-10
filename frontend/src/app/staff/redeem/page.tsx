import { StaffRedeemPanel } from "@/components/StaffRedeemPanel"
import { SecretAccessGate } from "@/components/SecretAccessGate"

export default function StaffRedeemPage() {
  return (
    <SecretAccessGate>
      <StaffRedeemPanel />
    </SecretAccessGate>
  )
}
