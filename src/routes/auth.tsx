import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Public route. Handles email + password, Google OAuth, and anonymous
// guest sign-in. Anonymous users can later upgrade to a full account
// from /dashboard without losing their pregnancy log — see there.
const searchSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => searchSchema.parse(search),
  component: AuthPage,
});

// Only permit same-origin relative paths as redirect targets.
function safeNext(next: string | undefined): string {
  if (!next) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const destination = safeNext(next);

  // If already signed in, bounce out.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: destination, replace: true });
    });
  }, [destination, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-block text-2xl font-bold text-foreground">
            MamaHealth
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Your maternal health companion
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4">
              <EmailForm mode="signin" destination={destination} />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <EmailForm mode="signup" destination={destination} />
            </TabsContent>
          </Tabs>

          <Divider label="or" />

          <GoogleButton />

          <div className="mt-3">
            <GuestButton destination={destination} />
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Guest accounts save your data on this device. You can add an email
            and password later without losing anything.
          </p>
        </div>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function EmailForm({ mode, destination }: { mode: "signin" | "signup"; destination: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      navigate({ to: destination, replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
      }
      // If redirected, browser navigates away. If tokens returned, root
      // subscriber invalidates and the useEffect above redirects.
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button variant="outline" className="w-full" onClick={onClick} disabled={loading}>
      Continue with Google
    </Button>
  );
}

function GuestButton({ destination }: { destination: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      toast.success("Signed in as guest");
      navigate({ to: destination, replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start guest session";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button variant="secondary" className="w-full" onClick={onClick} disabled={loading}>
      Continue as guest
    </Button>
  );
}