import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Phone, ExternalLink, ShieldAlert } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Resource = {
  id: string;
  category: "abuse" | "mental_health" | "reproductive" | "general";
  name: string;
  phone: string | null;
  url: string | null;
  notes: string | null;
  language: Database["public"]["Enums"]["app_language"];
};

export const Route = createFileRoute("/_authenticated/girls/help")({
  head: () => ({
    meta: [
      { title: "Get Help — Girls hub" },
      {
        name: "description",
        content: "Trusted helplines and services if you feel unsafe or need support.",
      },
    ],
  }),
  component: HelpPage,
});

const CATEGORY_LABEL: Record<Resource["category"], string> = {
  abuse: "If you feel unsafe or hurt",
  mental_health: "Talk to someone",
  reproductive: "Reproductive health",
  general: "More support",
};

const SIGNS = [
  "Someone is hurting you physically or making you afraid.",
  "Someone touches you or pressures you without your clear yes.",
  "You feel controlled, isolated, or threatened.",
  "You are being pressured to keep a secret you don't want to keep.",
];

function HelpPage() {
  const [language, setLanguage] =
    useState<Database["public"]["Enums"]["app_language"]>("en");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", u.user.id)
          .maybeSingle();
        if (p?.preferred_language) setLanguage(p.preferred_language);
      }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("help_resources")
        .select("id, category, name, phone, url, notes, language")
        .eq("language", language)
        .order("sort_order", { ascending: true });
      if (!error && data) setResources(data as Resource[]);
      setLoading(false);
    })();
  }, [language]);

  const grouped: Record<Resource["category"], Resource[]> = {
    abuse: [],
    mental_health: [],
    reproductive: [],
    general: [],
  };
  for (const r of resources) grouped[r.category].push(r);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            to="/girls"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Girls hub
          </Link>
          <select
            value={language}
            onChange={(e) =>
              setLanguage(
                e.target.value as Database["public"]["Enums"]["app_language"],
              )
            }
            className="rounded-full border border-border bg-canvas px-3 py-1 text-sm"
            aria-label="Language"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="pcm">Pidgin</option>
            <option value="ff">Fulfulde</option>
          </select>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <h1 className="font-serif text-2xl text-primary">
              You are not alone
            </h1>
          </div>
          <p className="mt-2 text-sm text-foreground">
            This app is not a replacement for talking to a trusted adult or
            health worker. If you feel unsafe, please reach out to real people
            who can help.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-serif text-lg text-primary">
            Signs something may not be okay
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-foreground">
            {SIGNS.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading resources…</p>
        ) : (
          (Object.keys(grouped) as Resource["category"][]).map((cat) => {
            const items = grouped[cat];
            if (items.length === 0) return null;
            return (
              <section key={cat} className="space-y-3">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                  {CATEGORY_LABEL[cat]}
                </h2>
                <div className="space-y-3">
                  {items.map((r) => (
                    <ResourceCard key={r.id} r={r} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}

function ResourceCard({ r }: { r: Resource }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-serif text-lg text-primary">{r.name}</h3>
      {r.notes ? (
        <p className="mt-1 text-sm text-muted-foreground">{r.notes}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {r.phone ? (
          <a
            href={`tel:${r.phone}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Phone className="h-4 w-4" /> {r.phone}
          </a>
        ) : null}
        {r.url ? (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-canvas px-4 py-2 text-sm font-semibold text-primary"
          >
            <ExternalLink className="h-4 w-4" /> Open link
          </a>
        ) : null}
      </div>
    </div>
  );
}