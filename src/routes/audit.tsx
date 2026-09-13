import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  DataTable,
  EmptyState,
  KpiCard,
  PageHeader,
  StatusBadge,
  Td,
  Th,
} from "@/components/common/primitives";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auditLog } from "@/lib/mock/data";
import { shortDate } from "@/lib/format";
import { History, ShieldCheck, UserRound } from "lucide-react";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — Estatum ERP" },
      {
        name: "description",
        content:
          "Immutable record of every change: who acted, what changed, the old and new value, and which approval authorised it.",
      },
      { property: "og:title", content: "Audit Log — Estatum ERP" },
      { property: "og:description", content: "Full change history with approval references." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const [q, setQ] = useState("");
  const [user, setUser] = useState("all");

  const users = Array.from(new Set(auditLog.map((a) => a.user)));
  const rows = useMemo(
    () =>
      auditLog.filter((a) => {
        if (q && !`${a.action} ${a.entity} ${a.user}`.toLowerCase().includes(q.toLowerCase()))
          return false;
        if (user !== "all" && a.user !== user) return false;
        return true;
      }),
    [q, user],
  );

  return (
    <AppShell>
      <PageHeader
        title="Audit log"
        subtitle="Every pricing, discount, commission and compliance change, permanently recorded"
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Recorded events" value={String(auditLog.length)} icon={History} accent />
        <KpiCard
          label="Approved changes"
          value={String(auditLog.filter((a) => a.approval !== "—").length)}
          icon={ShieldCheck}
        />
        <KpiCard label="Distinct users" value={String(users.length)} icon={UserRound} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search action, entity or user"
          className="h-9 w-full sm:w-72"
        />
        <Select value={user} onValueChange={setUser}>
          <SelectTrigger className="h-9 w-52">
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {rows.length === 0 ? (
          <EmptyState
            icon={History}
            title="No matching activity"
            description="Try a different search term or user."
          />
        ) : (
          <DataTable
            head={
              <>
                <Th>Time</Th>
                <Th>User</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Old value</Th>
                <Th>New value</Th>
                <Th>Approval</Th>
              </>
            }
          >
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-muted/50">
                <Td className="text-muted-foreground whitespace-nowrap">{shortDate(a.time)}</Td>
                <Td className="font-medium">{a.user}</Td>
                <Td>{a.action}</Td>
                <Td className="num text-muted-foreground">{a.entity}</Td>
                <Td className="num text-muted-foreground">{a.oldValue}</Td>
                <Td className="num font-medium">{a.newValue}</Td>
                <Td>
                  {a.approval === "—" ? (
                    <span className="text-xs text-muted-foreground">System</span>
                  ) : (
                    <StatusBadge status={a.approval} tone="blue" />
                  )}
                </Td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </AppShell>
  );
}
