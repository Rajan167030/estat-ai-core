import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  DataTable,
  EmptyState,
  KpiCard,
  PageHeader,
  SectionCard,
  StatusBadge,
  Td,
  Th,
} from "@/components/common/primitives";
import { AIPanel, ConfidenceBar, GovernanceNote } from "@/components/ai/ai-cards";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { documents as mockDocuments, projectName, type DocumentRecord } from "@/lib/mock/data";
import { shortDate } from "@/lib/format";
import { FileText, ShieldCheck, AlertTriangle, ScanLine, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { runDocumentExtraction } from "@/api/documents";

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Estatum ERP" },
      {
        name: "description",
        content:
          "Document intelligence: extracted fields with confidence scores, and clear flags where human verification is required.",
      },
      { property: "og:title", content: "Documents — Estatum ERP" },
      {
        property: "og:description",
        content: "Customer documents with AI extraction confidence and verification status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const [q, setQ] = useState("");
  const [localDocs, setLocalDocs] = useState<DocumentRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documents = [...localDocs, ...mockDocuments];
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");
  const rows = documents.filter((d) =>
    `${d.type} ${d.customer}`.toLowerCase().includes(q.toLowerCase()),
  );
  const selected = documents.find((d) => d.id === selectedId) ?? rows[0];

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const imageDataUri = await fileToDataUri(file);
      const doc = await runDocumentExtraction({ data: { imageDataUri } });
      setLocalDocs((prev) => [doc, ...prev]);
      setSelectedId(doc.id);
      toast.success(`${doc.type} extracted — ${doc.fields.length} fields found.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Documents"
        subtitle="AI extracts, a person verifies — nothing is approved automatically"
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelected}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Upload className="mr-1.5 size-3.5" />
              )}
              Upload document
            </Button>
          </>
        }
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Documents" value={String(documents.length)} icon={FileText} accent />
        <KpiCard
          label="Verified"
          value={String(documents.filter((d) => d.verification === "Verified").length)}
          icon={ShieldCheck}
        />
        <KpiCard
          label="Needs review"
          value={String(documents.filter((d) => d.verification === "Needs Review").length)}
          icon={AlertTriangle}
        />
        <KpiCard
          label="Rejected"
          value={String(documents.filter((d) => d.verification === "Rejected").length)}
          icon={AlertTriangle}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search document type or customer"
            className="h-9 w-full sm:w-72"
          />
          <div className="mt-3">
            {rows.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents found"
                description="Try another document type or customer name."
              />
            ) : (
              <DataTable
                head={
                  <>
                    <Th>Document</Th>
                    <Th>Customer</Th>
                    <Th>Project</Th>
                    <Th>Uploaded</Th>
                    <Th className="text-right">AI confidence</Th>
                    <Th>Verification</Th>
                  </>
                }
              >
                {rows.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className="cursor-pointer hover:bg-muted/50 data-[active=true]:bg-muted"
                    data-active={d.id === selected?.id}
                  >
                    <Td className="font-medium">{d.type}</Td>
                    <Td>{d.customer}</Td>
                    <Td className="text-muted-foreground">{projectName(d.projectId)}</Td>
                    <Td className="text-muted-foreground">{shortDate(d.uploaded)}</Td>
                    <Td className="num text-right font-semibold">{d.confidence}%</Td>
                    <Td>
                      <StatusBadge status={d.verification} />
                    </Td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        </div>

        <SectionCard title="Document intelligence" description="Field-level extraction confidence">
          {selected ? (
            <AIPanel title="Extracted fields" subtitle={selected.type}>
              <p className="text-sm font-semibold">{selected.customer}</p>
              <p className="text-xs text-muted-foreground">
                {selected.id} · uploaded {shortDate(selected.uploaded)}
              </p>
              <div className="mt-3 space-y-3">
                {selected.fields.map((f) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="font-medium">{f.value}</span>
                    </div>
                    <div className="mt-1">
                      <ConfidenceBar value={f.confidence} label="" />
                    </div>
                    {f.confidence < 85 ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                        <AlertTriangle className="size-3" /> Human verification required
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => toast.success(`${selected.type} marked verified.`)}
                >
                  <ScanLine className="size-4" /> Mark verified
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.warning("Document sent back for re-upload.")}
                >
                  Request re-upload
                </Button>
              </div>
              <GovernanceNote requirement="Compliance Officer signs off on every verification" />
            </AIPanel>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a document to see extracted fields.
            </p>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
