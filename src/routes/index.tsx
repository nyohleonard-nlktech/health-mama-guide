import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivitySquare,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Signal,
  Sparkles,
  Languages,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import heroMother from "@/assets/hero-mother.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  // Lightweight reveal-on-scroll: applies data-inview=true to any element
  // marked with the `reveal` utility class.
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute("data-inview", "true");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <Nav signedIn={signedIn} />
      <Hero signedIn={signedIn} />
      <WaveDivider />
      <Features />
      <Differentiators />
      <ClosingCta signedIn={signedIn} />
      <Footer />
    </div>
  );
}

function Nav({ signedIn }: { signedIn: boolean | null }) {
  return (
    <header className="mx-auto w-full max-w-7xl px-4 pt-5 md:px-8 md:pt-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <LogoMark />
          <span className="truncate text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            MamaHealth
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          {signedIn ? (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost" className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent shadow-sm">
      <span className="h-3.5 w-3.5 rounded-full border-2 border-accent-foreground" />
    </span>
  );
}

function Hero({ signedIn }: { signedIn: boolean | null }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-14">
      <div className="grid overflow-hidden rounded-[2rem] bg-card shadow-xl shadow-primary/5 ring-1 ring-border md:rounded-[2.5rem] lg:grid-cols-2">
        {/* Image side (top on mobile, right on desktop) */}
        <div className="relative order-1 min-h-[360px] overflow-hidden bg-secondary sm:min-h-[440px] lg:order-2 lg:min-h-[640px]">
          <img
            src={heroMother}
            alt="An expectant mother resting her hands on her belly in soft window light"
            width={896}
            height={1152}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-primary/5 to-transparent" />

          <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/20 bg-white/10 p-5 text-white shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                Free
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest opacity-90">
                WHO Danger-Signs Checker
              </span>
            </div>
            <h3 className="font-serif text-2xl italic leading-tight sm:text-3xl">
              Know the warning signs early.
            </h3>
            <p className="mt-2 max-w-[280px] text-sm leading-snug opacity-90">
              A quick check based on WHO guidance — so you know when it's time
              to reach a clinic.
            </p>
          </div>

          {/* Desktop-only soft wave divider on the seam */}
          <div className="pointer-events-none absolute inset-y-0 -left-px hidden w-10 lg:block">
            <svg
              className="h-full w-full"
              viewBox="0 0 40 1000"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M40,0 Q0,500 40,1000 L40,1000 L40,0 Z"
                className="fill-card"
              />
            </svg>
          </div>
        </div>

        {/* Content side */}
        <div className="order-2 flex flex-col justify-between gap-10 p-6 sm:p-10 md:p-14 lg:order-1 lg:p-16">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3 w-3 text-accent" />
              Trusted maternity companion
            </span>

            <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-primary sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className="italic">Your journey,</span>
              <br />
              guided by care.
            </h1>

            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              A private maternal health companion for expecting mothers. Track
              your pregnancy, check WHO danger signs, and find clinics — even
              on a slow connection.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              {signedIn ? (
                <Button asChild size="lg" className="rounded-full px-8 text-base shadow-lg shadow-primary/15">
                  <Link to="/dashboard">Open my dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full px-8 text-base shadow-lg shadow-primary/15"
                  >
                    <Link to="/auth">Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-2 bg-transparent px-8 text-base"
                  >
                    <Link to="/auth" search={{ next: "/dashboard" }}>
                      Continue as guest
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-border pt-8">
            <MiniStat title="Private" body="Your health data stays yours." />
            <MiniStat title="Accessible" body="Built for low-bandwidth phones." />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-lg font-semibold text-accent">{title}</p>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function WaveDivider() {
  return (
    <div aria-hidden="true" className="w-full text-card">
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="block h-12 w-full sm:h-16"
      >
        <path
          d="M0,60 C240,110 480,10 720,40 C960,70 1200,100 1440,50 L1440,90 L0,90 Z"
          className="fill-card"
        />
      </svg>
    </div>
  );
}

function Features() {
  return (
    <section className="bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 md:px-8 md:pb-24 md:pt-10">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            What MamaHealth does
          </p>
          <h2 className="mt-3 font-serif text-4xl leading-tight text-primary sm:text-5xl">
            Three tools, <span className="italic">one calm companion.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Built with midwives and grounded in WHO guidance — so every check
            feels steady, unhurried, and clear.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:mt-16 md:grid-cols-3">
          <FeatureCard
            icon={<HeartPulse className="h-5 w-5" />}
            title="Pregnancy tracker"
            body="Log your last menstrual period and see your gestational week and estimated due date instantly."
          />
          <FeatureCard
            icon={<ActivitySquare className="h-5 w-5" />}
            title="Danger signs checker"
            body="A guided check based on WHO maternal warning signs — with a clear next step whenever it matters."
          />
          <FeatureCard
            icon={<MapPin className="h-5 w-5" />}
            title="Nearest clinic finder"
            body="Find verified maternity clinics near you, with phone numbers and hours ready when you need them."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="reveal group relative flex flex-col gap-4 rounded-3xl border border-border bg-canvas p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent">
        {icon}
      </span>
      <h3 className="font-serif text-2xl leading-tight text-primary">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}

function Differentiators() {
  const items = [
    { icon: Signal, label: "Works on low bandwidth" },
    { icon: ShieldCheck, label: "Private by design" },
    { icon: HeartPulse, label: "Evidence-based (WHO)" },
    { icon: Languages, label: "FR · EN · PCM · FF" },
  ];
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-20">
      <div className="reveal grid grid-cols-2 gap-3 rounded-3xl border border-border bg-secondary/60 p-4 md:grid-cols-4 md:gap-4 md:p-6">
        {items.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex min-w-0 items-center gap-3 rounded-2xl bg-canvas px-4 py-4"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-medium text-primary">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClosingCta({ signedIn }: { signedIn: boolean | null }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
      <div className="reveal relative overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-xl md:rounded-[2.5rem] md:p-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
            Care for two, <span className="italic">in your pocket.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base opacity-90 sm:text-lg">
            Start tracking today — no download, no cost. Your notes stay
            private on your account.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {signedIn ? (
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-full px-8 text-base"
              >
                <Link to="/dashboard">Open my dashboard</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="rounded-full px-8 text-base"
                >
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-2 border-primary-foreground/60 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/auth" search={{ next: "/dashboard" }}>
                    Continue as guest
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <p className="min-w-0">
            Your data stays private. MamaHealth is guidance — not a substitute
            for medical care.
          </p>
          <p className="shrink-0 text-xs uppercase tracking-[0.2em] text-primary">
            © {new Date().getFullYear()} MamaHealth
          </p>
        </div>
      </div>
    </footer>
  );
}
