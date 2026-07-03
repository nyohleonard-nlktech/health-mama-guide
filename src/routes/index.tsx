import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          MamaHealth
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Track your pregnancy, check danger signs, and find the nearest clinic —
          for mothers and adolescents in Cameroon.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {signedIn ? (
            <Button asChild size="lg">
              <Link to="/dashboard">Open my dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link to="/auth">Sign in or create account</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth" search={{ next: "/dashboard" }}>
                  Continue as guest
                </Link>
              </Button>
            </>
          )}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Works on low-bandwidth connections. Your data stays private.
        </p>
      </main>
    </div>
  );
}
