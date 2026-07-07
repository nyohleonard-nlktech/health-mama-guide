import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Integration-managed protected layout. Session lives in localStorage, so
// SSR is off and the check runs client-side. Do not add child gates —
// requireSupabaseAuth revalidates every protected server-fn call.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { next: location.href } });
    }

    // Force new users through track selection + how-to-use walkthrough
    // before any track-specific page loads.
    const path = location.pathname;
    if (path !== "/onboarding") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("track, onboarded")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!profile || !profile.track || !profile.onboarded) {
        throw redirect({ to: "/onboarding" });
      }
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});