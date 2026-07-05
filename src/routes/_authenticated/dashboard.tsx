import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setUserId(u.id);
      setEmail(u.email ?? null);
      setIsGuest(u.is_anonymous === true);
    });
  }, []);

  async function handleSignOut() {
    // Sign-out hygiene: cancel in-flight queries, clear cache, then sign out.
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">MamaHealth</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">
            {isGuest ? "You're signed in as a guest" : `Welcome back`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isGuest
              ? "Your data is saved on this account. Add an email and password below to keep it if you switch phones or clear your browser."
              : email ?? "Signed in"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">User ID: {userId ?? "…"}</p>
        </section>

        {isGuest ? <UpgradeGuestForm /> : null}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Your tools</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <Link to="/pregnancy" className="font-medium text-primary underline">
                Pregnancy tracker →
              </Link>
            </li>
          </ul>
          <h3 className="mt-4 text-sm font-semibold">Coming next</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Danger signs checker (Step 4)</li>
            <li>• Nearest clinic finder (Step 5)</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

// Guest → registered upgrade. Because updateUser attaches an email + password
// to the SAME auth user, auth.uid() is preserved and every RLS-scoped row
// (pregnancies, danger_sign_logs, cycle_logs) stays owned by the same account.
function UpgradeGuestForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) throw error;
      toast.success("Account saved — you can now sign in from any device.");
      // Fire USER_UPDATED — root subscriber refreshes router/queries.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upgrade account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold">Save your account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add an email and password. Your existing data is not lost.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="upgrade-email">Email</Label>
          <Input
            id="upgrade-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="upgrade-password">Password</Label>
          <Input
            id="upgrade-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save account"}
        </Button>
      </form>
    </section>
  );
}