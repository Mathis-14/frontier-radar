"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ShimmerButton } from "@/components/kit/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ContactRow } from "@/lib/types";

type Draft = {
  id?: string;
  full_name: string;
  company: string;
  role: string;
  status: "met" | "to_contact";
  notes: string;
};

const EMPTY: Draft = { full_name: "", company: "", role: "", status: "to_contact", notes: "" };

export function ContactsManager({ contacts }: { contacts: ContactRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [pending, setPending] = useState(false);

  function edit(c: ContactRow) {
    setDraft({
      id: c.id,
      full_name: c.full_name,
      company: c.company ?? "",
      role: c.role ?? "",
      status: c.status,
      notes: c.notes ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!draft.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setPending(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Could not save");
      return;
    }
    toast.success(draft.id ? "Contact updated" : "Contact added");
    setOpen(false);
    setDraft(EMPTY);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Contact removed");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Your contacts</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDraft(EMPTY); }}>
          <DialogTrigger render={<ShimmerButton />}>
            <Plus className="mr-1 inline size-4 align-text-bottom" />
            Add contact
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit contact" : "Add contact"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="c-name">Name</Label>
                <Input id="c-name" value={draft.full_name}
                  onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="c-company">Company</Label>
                  <Input id="c-company" value={draft.company}
                    onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="c-role">Role</Label>
                  <Input id="c-role" value={draft.role}
                    onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft({ ...draft, status: v as Draft["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to_contact">To contact</SelectItem>
                    <SelectItem value="met">Met</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-notes">Notes</Label>
                <Textarea id="c-notes" rows={3} value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No contacts yet — add people you meet, or accept the agent&apos;s suggestions.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell>{c.company}</TableCell>
                <TableCell className="text-muted-foreground">{c.role}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "met" ? "secondary" : "outline"}>
                    {c.status === "met" ? "Met" : "To contact"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground">{c.notes}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => edit(c)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)} aria-label="Delete">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
