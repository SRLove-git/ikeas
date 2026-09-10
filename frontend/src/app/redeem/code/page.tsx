import { ClaimCodePanel } from "@/components/ClaimCodePanel"
import { SecretAccessGate } from "@/components/SecretAccessGate"

export default function ClaimCodePage() {
  return (
    <SecretAccessGate>
      <ClaimCodePanel />
    </SecretAccessGate>
  )
}
