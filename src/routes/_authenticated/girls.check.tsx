import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type Verdict = "true" | "false" | "misleading";

type Result =
  | { kind: "unsure" }
  | { kind: "match"; verdict: Verdict; explanation: string; claim: string };

export const Route = createFileRoute("/_authenticated/girls/check")({
  head: () => ({
    meta: [
      { title: "Check a Claim — Girls hub" },
      {
        name: "description",
        content: "Type any rumor about periods, puberty, or reproduction and get a trusted answer.",
      },
    ],
  }),
  component: CheckPage,
});

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(needle: string, myth: { claim: string; keywords: string[] }) {
  const nq = normalize(needle);
  const nc = normalize(myth.claim);
  const qTokens = new Set(nq.split(" ").filter((w) => w.length > 2));
  const cTokens = new Set(nc.split(" ").filter((w) => w.length > 2));
  let overlap = 0;
  for (const t of qTokens) if (cTokens.has(t)) overlap += 1;
  let kwHits = 0;
  for (const kw of myth.keywords) {
    const nk = normalize(kw);
    if (nk && nq.includes(nk)) kwHits += 1;
  }
  return overlap + kwHits * 2;
}

function CheckPage() {
  const [language, setLanguage] =
    useState<Database["public"]["Enums"]["app_language"]>("en");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

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

  async function onCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const { data, error } = await supabase
        .from("girls_myths")
        .select("claim, verdict, explanation, keywords")
        .eq("language", language);
      if (error) throw error;

      let best: { row: (typeof data)[number]; score: number } | null = null;
      for (const row of data ?? []) {
        const s = scoreMatch(text, {
          claim: row.claim,
          keywords: row.keywords ?? [],
        });
        if (!best || s > best.score) best = { row, score: s };
      }

      const confident = !!best && best.score >= 3;
      const finalResult: Result = confident
        ? {
            kind: "match",
            verdict: best!.row.verdict as Verdict,
            explanation: best!.row.explanation,
            claim: best!.row.claim,
          }
        : { kind: "unsure" };

      // Log the check for the user (girls track only; RLS enforces).
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase.from("claim_checks_girls").insert({
          user_id: u.user.id,
          claim_text: text,
          verdict: finalResult.kind === "match" ? finalResult.verdict : null,
          explanation:
            finalResult.kind === "match" ? finalResult.explanation : null,
          confident,
        });
      }

      setResult(finalResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not check");
    } finally {
      setBusy(false);
    }
  }

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

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-serif text-3xl text-primary">Check a Claim</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Type a rumor or claim you heard. We answer only from a trusted
            corpus. If we aren't sure, we'll say so — we don't guess.
          </p>
        </div>

        <form onSubmit={onCheck} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <Textarea
            rows={4}
            placeholder='e.g. "You cannot get pregnant the first time you have sex."'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="submit" disabled={busy || !text.trim()}>
            {busy ? "Checking…" : "Check this claim"}
          </Button>
        </form>

        {result ? <ResultCard result={result} /> : null}

        <p className="text-center text-xs text-muted-foreground">
          This is guidance. For anything serious, please talk to a health
          worker or trusted adult.
        </p>
      </main>
    </div>
  );
}

function ResultCard({ result }: { result: Result }) {
  if (result.kind === "unsure") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/60 p-5">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h2 className="font-serif text-lg text-primary">I'm not sure</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            I don't have a confident answer for this claim. Please talk to a
            health worker or trusted adult before acting on it.
          </p>
        </div>
      </div>
    );
  }
  const isTrue = result.verdict === "true";
  const isMisleading = result.verdict === "misleading";
  return (
    <div
      className={
        "rounded-2xl border p-5 " +
        (isTrue
          ? "border-primary/30 bg-primary/5"
          : isMisleading
            ? "border-accent/40 bg-accent/10"
            : "border-destructive/40 bg-destructive/5")
      }
    >
      <div className="flex items-center gap-2">
        {isTrue ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <AlertCircle
            className={"h-5 w-5 " + (isMisleading ? "text-accent" : "text-destructive")}
          />
        )}
        <span className="text-xs font-semibold uppercase tracking-widest">
          {isTrue ? "True" : isMisleading ? "Misleading" : "False"}
        </span>
      </div>
      <h2 className="mt-3 font-serif text-lg text-primary">"{result.claim}"</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        {result.explanation}
      </p>
    </div>
  );
}