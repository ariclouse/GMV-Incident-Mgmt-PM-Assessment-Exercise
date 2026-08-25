import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import IncidentList from "@/components/incidents/IncidentList";

export default function Home() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <IncidentList />
      </Suspense>
    </AppShell>
  );
}
