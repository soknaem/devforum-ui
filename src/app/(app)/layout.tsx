import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <RealtimeBridge />
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
