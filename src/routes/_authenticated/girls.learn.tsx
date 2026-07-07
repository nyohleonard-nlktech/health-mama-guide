import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Article = {
  id: string;
  slug: string;
  topic: "puberty" | "menstrual" | "reproductive";
  language: Database["public"]["Enums"]["app_language"];
  title: string;
  body_md: string;
  sort_order: number;
};

export const Route = createFileRoute("/_authenticated/girls/learn")({
  head: () => ({
    meta: [
      { title: "Learn — Girls hub" },
      {
        name: "description",
        content: "Browse puberty, menstrual health, and reproductive health articles.",
      },
    ],
  }),
  component: LearnPage,
});

const TOPICS: { key: Article["topic"]; label: string }[] = [
  { key: "puberty", label: "Puberty" },
  { key: "menstrual", label: "Menstrual health" },
  { key: "reproductive", label: "Reproductive health" },
];

function LearnPage() {
  const [language, setLanguage] =
    useState<Database["public"]["Enums"]["app_language"]>("en");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

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
        .from("girls_content")
        .select("id, slug, topic, language, title, body_md, sort_order")
        .eq("language", language)
        .order("sort_order", { ascending: true });
      if (!error && data) setArticles(data as Article[]);
      setLoading(false);
    })();
  }, [language]);

  const open = openSlug ? articles.find((a) => a.slug === openSlug) : null;

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

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {open ? (
          <article className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <button
              onClick={() => setOpenSlug(null)}
              className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to list
            </button>
            <h1 className="font-serif text-3xl text-primary">{open.title}</h1>
            <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground">
              {open.body_md}
            </div>
          </article>
        ) : (
          <>
            <div>
              <h1 className="font-serif text-3xl text-primary">Learn</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                A quiet library of trusted articles. Tap any card to read.
              </p>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              TOPICS.map((t) => {
                const items = articles.filter((a) => a.topic === t.key);
                if (items.length === 0) return null;
                return (
                  <section key={t.key} className="space-y-3">
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                      {t.label}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {items.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setOpenSlug(a.slug)}
                          className="rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <h3 className="font-serif text-xl text-primary">
                            {a.title}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {a.body_md}
                          </p>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })
            )}

            {!loading && articles.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No articles yet in this language. Try another language.
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}