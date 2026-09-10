import { StaffRedeemPanel } from "@/components/StaffRedeemPanel"
import { SecretAccessGate } from "@/components/SecretAccessGate"

export default function RedeemPage() {
  return (
    <SecretAccessGate>
      <StaffRedeemPanel />
    </SecretAccessGate>
  )
}
