import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { bookings, leads, partners, projects, units } from "@/lib/mock/data";
import { inr } from "@/lib/format";
import {
  Building2, FileSignature, Grid3x3, Handshake, Plus, ShieldCheck, Users, CalendarPlus,
} from "lucide-react";
import { toast } from "sonner";

export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search leads, customers, units, projects..." />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>No matches found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { onOpenChange(false); toast.success("New lead form opened."); }}>
            <Plus /> Create lead
          </CommandItem>
          <CommandItem onSelect={() => go("/bookings")}>
            <FileSignature /> Create booking
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); toast.success("Follow-up scheduled for today."); }}>
            <CalendarPlus /> Create follow-up
          </CommandItem>
          <CommandItem onSelect={() => go("/approvals")}>
            <ShieldCheck /> Open approvals
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Leads">
          {leads.slice(0, 6).map((l) => (
            <CommandItem key={l.id} value={`${l.name} ${l.id}`} onSelect={() => go(`/leads/${l.id}`)}>
              <Users />
              <span>{l.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">Lead · Score {l.score}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Units">
          {units.slice(0, 5).map((u) => (
            <CommandItem key={u.id} value={`${u.code} unit`} onSelect={() => go("/inventory")}>
              <Grid3x3 />
              <span>{u.code}</span>
              <span className="ml-auto text-xs text-muted-foreground">Unit · {inr(u.price)}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Projects">
          {projects.slice(0, 5).map((p) => (
            <CommandItem key={p.id} value={p.name} onSelect={() => go(`/projects/${p.id}`)}>
              <Building2 />
              <span>{p.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">Project · {p.city}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Channel partners">
          {partners.slice(0, 4).map((p) => (
            <CommandItem key={p.id} value={p.firm} onSelect={() => go(`/partners/${p.id}`)}>
              <Handshake />
              <span>{p.firm}</span>
              <span className="ml-auto text-xs text-muted-foreground">Partner · {p.tier}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Bookings">
          {bookings.slice(0, 4).map((b) => (
            <CommandItem key={b.id} value={`${b.id} ${b.customer}`} onSelect={() => go(`/bookings/${b.id}`)}>
              <FileSignature />
              <span>Booking #{b.id}</span>
              <span className="ml-auto text-xs text-muted-foreground">{b.customer} · {inr(b.amount)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
