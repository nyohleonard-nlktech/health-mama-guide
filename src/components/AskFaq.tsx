import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Loader2,
  HelpCircle,
  AlertTriangle,
  BookOpenCheck,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askFaq, type AskResult } from "@/lib/faq.functions";
import type { Database } from "@/integrations/supabase/types";

type Corpus = "pregnancy" | "girls";
type Language = Database["public"]["Enums"]["app_language"];

export function AskFaq({
  corpus,
  backTo,
  backLabel,
  title,
  subtitle,
}: {
  corpus: Corpus;
  backTo: "/pregnancy" | "/girls";
  backLabel: string;
  title: string;
  subtitle: string;
}) {
  const [language, setLanguage] = useState<Language>("en");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await askFaq({
        data: { text: text.trim(), language, corpus },
      });
      setResult(res as AskResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not answer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
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

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-serif text-3xl text-primary">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl border border-border bg-card p-5"
        >
          <Textarea
            rows={4}
            placeholder="Ask your question in your own words…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="submit" disabled={busy || !text.trim()}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching…
              </>
            ) : (
              "Ask"
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            We only answer from a verified library. If we don't have a good
            match, we'll say so — we never guess.
          </p>
        </form>

        {result ? <ResultCard result={result} /> : null}
      </main>
    </div>
  );
}

function ResultCard({ result }: { result: AskResult }) {
  if (result.kind === "unsure") {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-secondary/60 p-5">
        <div className="flex items-start gap-3">
          <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-serif text-lg text-primary">
              We're not sure yet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.message}
            </p>
          </div>
        </div>
        <a
          href={`tel:${result.helpline.replace(/[^0-9+]/g, "")}`}
          className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Phone className="h-3.5 w-3.5" /> Call {result.helpline}
        </a>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {result.danger ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">
            This may be a medical emergency. Go to a clinic now.
          </p>
        </div>
      ) : null}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
          <BookOpenCheck className="h-4 w-4" /> Verified answer
        </div>
        <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {result.answer}
        </p>
        {result.fallback_language ? (
          <p className="mt-3 text-xs italic text-muted-foreground">
            Not yet available in your language — showing the reviewed English
            version.
          </p>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">
          Source: {result.source}
        </p>
        {result.referral ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Next step: {result.referral}
          </p>
        ) : null}
      </div>
      <Link
        to="/clinics"
        className="inline-flex items-center gap-1 text-sm font-semibold text-accent"
      >
        Find a clinic near you →
      </Link>
    </div>
  );
}