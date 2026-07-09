import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ShieldCheck, LifeBuoy, ArrowRight, HelpCircle, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/girls/")({
  head: () => ({
    meta: [
      { title: "Girls hub — MamaHealth" },
      {
        name: "description",
        content: "Learn, check claims, and find help — a safe hub for girls and young women.",
      },
    ],
  }),
  component: GirlsHub,
});

function GirlsHub() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="font-serif text-xl text-primary">Girls hub</h1>
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section className="rounded-3xl bg-primary/95 p-6 text-primary-foreground shadow-lg sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">
            You matter
          </p>
          <h2 className="mt-2 font-serif text-3xl italic leading-tight sm:text-4xl">
            A quiet place to learn about your body.
          </h2>
          <p className="mt-3 max-w-md text-sm opacity-90 sm:text-base">
            Free. Private. In your language. This is guidance — not a
            substitute for a health worker or trusted adult.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <HubCard
            to="/girls/learn"
            icon={<BookOpen className="h-5 w-5" />}
            title="Learn"
            body="Puberty, menstrual health, and reproductive basics — a browsable library."
          />
          <HubCard
            to="/girls/check"
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Check a Claim"
            body="Heard a rumor? Type it in — we say what we know, and admit when we don't."
          />
          <HubCard
            to="/girls/ask"
            icon={<HelpCircle className="h-5 w-5" />}
            title="Ask a question"
            body="Type any question — we answer only from a reviewed library."
          />
          <HubCard
            to="/clinics"
            icon={<MapPin className="h-5 w-5" />}
            title="Find a clinic"
            body="Verified clinics across Cameroon with services and contact."
          />
          <HubCard
            to="/girls/help"
            icon={<LifeBuoy className="h-5 w-5" />}
            title="Get Help"
            body="Trusted helplines and services. If you feel unsafe, real people can help."
            wide
          />
        </div>
      </main>
    </div>
  );
}

function HubCard({
  to,
  icon,
  title,
  body,
  wide,
}: {
  to: "/girls/learn" | "/girls/check" | "/girls/help" | "/girls/ask" | "/clinics";
  icon: React.ReactNode;
  title: string;
  body: string;
  wide?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        "group flex flex-col gap-3 rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg" +
        (wide ? " sm:col-span-2" : "")
      }
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent">
        {icon}
      </span>
      <h3 className="font-serif text-2xl text-primary">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}