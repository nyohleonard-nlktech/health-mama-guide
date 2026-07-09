import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone, MessageCircle, Navigation, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { haversineKm } from "@/lib/haversine";

type Clinic = {
  id: string;
  name: string;
  type: string | null;
  region: string | null;
  city: string | null;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  whatsapp: string | null;
  hours: string | null;
  services: string[] | null;
  notes: string | null;
  verified: boolean;
};

const REGIONS = [
  "Adamaoua",
  "Centre",
  "Est",
  "Extrême-Nord",
  "Littoral",
  "Nord",
  "Nord-Ouest",
  "Ouest",
  "Sud",
  "Sud-Ouest",
];

const SERVICES = [
  { key: "antenatal", label: "Antenatal" },
  { key: "delivery", label: "Delivery" },
  { key: "emergency", label: "Emergency" },
  { key: "family_planning", label: "Family planning" },
  { key: "adolescent_health", label: "Adolescent" },
];

export const Route = createFileRoute("/clinics")({
  head: () => ({
    meta: [
      { title: "Find a clinic — MamaHealth" },
      {
        name: "description",
        content: "Search verified clinics across Cameroon by area and services.",
      },
    ],
  }),
  component: ClinicsPage,
});

function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("");
  const [service, setService] = useState<string>("");
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select(
          "id,name,type,region,city,address,lat,lng,phone,whatsapp,hours,services,notes,verified",
        )
        .order("region", { ascending: true })
        .order("name", { ascending: true });
      if (!error && data) setClinics(data as unknown as Clinic[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = clinics.filter((c) => {
      if (region && c.region !== region) return false;
      if (service && !(c.services ?? []).includes(service)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q) ||
        (c.region ?? "").toLowerCase().includes(q)
      );
    });
    if (origin) {
      return list
        .map((c) => ({
          c,
          d: haversineKm(origin, { lat: c.lat, lng: c.lng }),
        }))
        .sort((a, b) => a.d - b.d)
        .map((x) => ({ ...x.c, _distance: x.d } as Clinic & { _distance: number }));
    }
    return list.map((c) => c as Clinic & { _distance?: number });
  }, [clinics, query, region, service, origin]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoError("Location is not available on this device.");
      return;
    }
    setGeoBusy(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoBusy(false);
      },
      (err) => {
        setGeoBusy(false);
        setGeoError(err.message || "Could not read your location.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground">
            ← Home
          </Link>
          <span className="font-serif text-lg text-primary">Find a clinic</span>
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <section>
          <h1 className="font-serif text-3xl text-primary">
            Verified clinics across Cameroon
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search by name, city, region, or service. Tap a card to call, message on WhatsApp, or open directions.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search name, city, address…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-lg border border-border bg-canvas px-3 py-2 text-sm"
              aria-label="Region"
            >
              <option value="">All regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={useMyLocation}
              disabled={geoBusy}
            >
              {geoBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              {origin ? "Location on" : "Use my location"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((s) => {
              const active = service === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setService(active ? "" : s.key)}
                  className={
                    "rounded-full border px-3 py-1 text-xs transition-colors " +
                    (active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-canvas text-muted-foreground hover:bg-secondary")
                  }
                  type="button"
                >
                  {s.label}
                </button>
              );
            })}
            {(query || region || service || origin) && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setRegion("");
                  setService("");
                  setOrigin(null);
                }}
                className="ml-auto text-xs text-muted-foreground underline"
              >
                Clear filters
              </button>
            )}
          </div>
          {geoError ? (
            <p className="text-xs text-destructive">{geoError}</p>
          ) : null}
        </section>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No clinics match. Try a wider area or clear filters.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {filtered.map((c) => (
              <ClinicCard key={c.id} clinic={c} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function ClinicCard({ clinic }: { clinic: Clinic & { _distance?: number } }) {
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${clinic.lat},${clinic.lng}`;
  const waHref = clinic.whatsapp
    ? `https://wa.me/${clinic.whatsapp.replace(/[^0-9]/g, "")}`
    : null;
  return (
    <li className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-lg text-primary">{clinic.name}</h3>
        {typeof clinic._distance === "number" ? (
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
            {clinic._distance < 1
              ? `${Math.round(clinic._distance * 1000)} m`
              : `${clinic._distance.toFixed(1)} km`}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
        {[clinic.region, clinic.city].filter(Boolean).join(" · ")}
        {clinic.type ? ` · ${clinic.type}` : ""}
      </p>
      {clinic.address ? (
        <p className="mt-2 text-sm text-foreground">{clinic.address}</p>
      ) : null}
      {clinic.hours ? (
        <p className="mt-1 text-xs text-muted-foreground">Hours: {clinic.hours}</p>
      ) : null}
      {clinic.services && clinic.services.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {clinic.services.map((s) => (
            <span
              key={s}
              className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] text-accent"
            >
              {SERVICES.find((x) => x.key === s)?.label ?? s}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {clinic.phone ? (
          <a
            href={`tel:${clinic.phone}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
        ) : null}
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        ) : null}
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-foreground"
        >
          <Navigation className="h-3.5 w-3.5" /> Directions
        </a>
      </div>
    </li>
  );
}