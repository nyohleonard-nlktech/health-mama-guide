import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HeartPulse, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — MamaHealth" },
      { name: "description", content: "Choose your track and learn how to use MamaHealth." },
    ],
  }),
  component: OnboardingPage,
});

type Track = "pregnant" | "girls";

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"pick" | "tour">("pick");
  const [track, setTrack] = useState<Track | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // If already onboarded, skip.
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("track, onboarded")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p?.track && p.onboarded) {
        navigate({ to: p.track === "girls" ? "/girls" : "/pregnancy", replace: true });
      }
    })();
  }, [navigate]);

  async function pickTrack(t: Track) {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Not signed in");
      // Ensure profile row exists then set track.
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: uid, track: t }, { onConflict: "id" });
      if (upsertError) throw upsertError;
      setTrack(t);
      setStep("tour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function finishTour() {
    if (!track) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ onboarded: true })
        .eq("id", uid);
      if (error) throw error;
      navigate({ to: track === "girls" ? "/girls" : "/pregnancy", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {step === "pick" ? (
          <TrackPicker onPick={pickTrack} saving={saving} />
        ) : (
          <HowToUse
            track={track!}
            index={tourIndex}
            onNext={() => setTourIndex((i) => i + 1)}
            onFinish={finishTour}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

function TrackPicker({ onPick, saving }: { onPick: (t: Track) => void; saving: boolean }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          Welcome
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight text-primary sm:text-4xl">
          Which describes you?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose the track that fits you best. You'll see content, tools, and
          guidance made for you.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onPick("pregnant")}
          disabled={saving}
          className="group flex flex-col items-start gap-3 rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <HeartPulse className="h-5 w-5" />
          </span>
          <h2 className="font-serif text-2xl text-primary">Pregnant Women</h2>
          <p className="text-sm text-muted-foreground">
            Track your pregnancy, check WHO danger signs, find nearby clinics.
          </p>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Choose this <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => onPick("girls")}
          disabled={saving}
          className="group flex flex-col items-start gap-3 rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Sparkles className="h-5 w-5" />
          </span>
          <h2 className="font-serif text-2xl text-primary">Girls &amp; Young Women</h2>
          <p className="text-sm text-muted-foreground">
            Learn about puberty and reproductive health, check claims, and find
            help you can trust.
          </p>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Choose this <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>

      <p className="flex items-start gap-2 rounded-2xl border border-border bg-secondary/60 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Your track choice keeps your information private and shows only what
          is relevant to you. You can ask a health worker for help anytime.
        </span>
      </p>
    </div>
  );
}

type Slide = { title: string; body: string };

const TOURS: Record<Track, Slide[]> = {
  pregnant: [
    {
      title: "1. Track your pregnancy",
      body: "Add the first day of your last menstrual period. We estimate your due date and gestational week.",
    },
    {
      title: "2. Check danger signs",
      body: "A quick WHO-based checker tells you when it's time to go to a clinic — never guesses, always safe.",
    },
    {
      title: "3. Find a clinic",
      body: "Locate nearby maternity clinics with phone numbers and hours. Works even on a slow connection.",
    },
  ],
  girls: [
    {
      title: "1. Learn",
      body: "A calm library on puberty, menstrual health, and reproductive basics — in your language.",
    },
    {
      title: "2. Check a Claim",
      body: "Heard a rumor? Type it in. We answer from a trusted corpus. If we aren't sure, we say so.",
    },
    {
      title: "3. Get Help",
      body: "If you feel unsafe, real people can help. We link out to trusted local services — never replace a trusted adult.",
    },
  ],
};

function HowToUse({
  track,
  index,
  onNext,
  onFinish,
  saving,
}: {
  track: Track;
  index: number;
  onNext: () => void;
  onFinish: () => void;
  saving: boolean;
}) {
  const slides = TOURS[track];
  const slide = slides[Math.min(index, slides.length - 1)];
  const isLast = index >= slides.length - 1;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          How to use MamaHealth
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight text-primary sm:text-4xl">
          {track === "girls" ? "Your Girls hub in 3 steps" : "Your pregnancy companion in 3 steps"}
        </h1>
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={
                i <= index
                  ? "h-1.5 flex-1 rounded-full bg-accent"
                  : "h-1.5 flex-1 rounded-full bg-border"
              }
            />
          ))}
        </div>
        <h2 className="font-serif text-2xl text-primary">{slide.title}</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {slide.body}
        </p>

        <div className="mt-8 flex justify-end">
          {isLast ? (
            <Button onClick={onFinish} disabled={saving} size="lg" className="rounded-full px-8">
              {saving ? "Please wait…" : "Get started"}
            </Button>
          ) : (
            <Button onClick={onNext} size="lg" className="rounded-full px-8">
              Next <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        MamaHealth is guidance — not a substitute for a health worker.
      </p>
    </div>
  );
}