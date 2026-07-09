import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pregnancy")({
  head: () => ({
    meta: [
      { title: "Pregnancy tracker — MamaHealth" },
      { name: "description", content: "Track your pregnancy from your last menstrual period." },
    ],
  }),
  component: PregnancyPage,
});

// Naegele's rule: EDD = LMP + 280 days
function computeEdd(lmp: string): string {
  const d = new Date(lmp + "T00:00:00");
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

function gestationalWeek(lmp: string): number {
  const d = new Date(lmp + "T00:00:00").getTime();
  const days = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.floor(days / 7));
}

type Pregnancy = {
  id: string;
  lmp_date: string;
  edd_date: string | null;
  notes: string | null;
  active: boolean;
};

function PregnancyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<Pregnancy | null>(null);
  const [lmp, setLmp] = useState("");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("pregnancies")
        .select("id, lmp_date, edd_date, notes, active")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        toast.error(error.message);
      } else if (data) {
        setExisting(data);
        setLmp(data.lmp_date);
        setNotes(data.notes ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lmp) return;
    if (lmp > today) {
      toast.error("LMP date can't be in the future.");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");

      const edd = computeEdd(lmp);
      if (existing) {
        const { data, error } = await supabase
          .from("pregnancies")
          .update({ lmp_date: lmp, edd_date: edd, notes: notes || null })
          .eq("id", existing.id)
          .select("id, lmp_date, edd_date, notes, active")
          .single();
        if (error) throw error;
        setExisting(data);
        toast.success("Pregnancy updated.");
      } else {
        const { data, error } = await supabase
          .from("pregnancies")
          .insert({ user_id: uid, lmp_date: lmp, edd_date: edd, notes: notes || null, active: true })
          .select("id, lmp_date, edd_date, notes, active")
          .single();
        if (error) throw error;
        setExisting(data);
        toast.success("Pregnancy saved.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Pregnancy tracker</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
            Back
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {existing ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Current pregnancy</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Gestational week</dt>
                <dd className="text-xl font-semibold">{gestationalWeek(existing.lmp_date)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Estimated due date</dt>
                <dd className="text-xl font-semibold">{existing.edd_date ?? "—"}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">
            {existing ? "Update your dates" : "Enter your last menstrual period"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We use your LMP date to estimate your due date (Naegele's rule: LMP + 280 days).
          </p>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="lmp">First day of last menstrual period</Label>
              <Input
                id="lmp"
                type="date"
                required
                max={today}
                value={lmp}
                onChange={(e) => setLmp(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>
            {lmp ? (
              <p className="text-xs text-muted-foreground">
                Estimated due date: <span className="font-medium">{computeEdd(lmp)}</span> · Week{" "}
                <span className="font-medium">{gestationalWeek(lmp)}</span>
              </p>
            ) : null}
            <Button type="submit" disabled={saving || loading}>
              {saving ? "Saving…" : existing ? "Update" : "Save"}
            </Button>
          </form>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/dashboard" className="underline">
            Return to dashboard
          </Link>
        </p>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/pregnancy/ask"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
          >
            <HelpCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Ask a question</p>
              <p className="text-xs text-muted-foreground">
                Verified answers from WHO & MoH guidance.
              </p>
            </div>
          </Link>
          <Link
            to="/clinics"
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
          >
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Find a clinic</p>
              <p className="text-xs text-muted-foreground">
                Search verified clinics across Cameroon.
              </p>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}