# Plan: Clinic Finder + Verified-Only Q&A

Two new modules. Both are strictly retrieval — no LLM-generated answers.

## A. Clinic Finder

A search page that finds clinics in Cameroon by area/city and shows distance, services, and contact.

### Data
The `clinics` table already exists (14 cols). I'll confirm its columns via `supabase--read_query` and add anything missing via migration. Expected fields: `name`, `region`, `city`, `address`, `latitude`, `longitude`, `phone`, `whatsapp`, `services` (text[]), `hours`, `accepts_walkins`, `notes`, `language_support`.

If empty, seed 20–30 real Cameroon clinics (Yaoundé, Douala, Bamenda, Garoua, Bafoussam) across both government and confessionnel facilities, with services like `antenatal`, `delivery`, `family_planning`, `adolescent_health`, `emergency`.

RLS: `GRANT SELECT ... TO anon, authenticated`; policy `USING (true)` — clinics are public info.

### UI: `/clinics` route (accessible to both tracks + signed-out)
- Search input: free-text (name/area) + region dropdown (10 Cameroon regions) + service filter chips.
- "Use my location" button → `navigator.geolocation` → compute distance client-side with the haversine formula against `latitude`/`longitude`. If denied, still shows results sorted by name/region.
- Results grid of cards: name, distance (if geo available), region · city, services as chips, phone (tap-to-call `tel:`), WhatsApp link, hours, "Get directions" → Google Maps URL from lat/lng.
- Empty state: "No clinics match — try a wider area or clear filters."

### Files
- `src/routes/clinics.tsx` (public, top-level so both tracks and signed-out visitors reach it)
- `src/lib/clinics.functions.ts` — `listClinics({ region?, service?, query? })` using the server publishable client (public read).
- `src/lib/haversine.ts` — pure distance helper.
- Link entries added to `/pregnancy`, `/girls`, and the home page CTAs.

## B. Verified-Only Q&A (pgvector, no LLM answers)

Strictly retrieval-based FAQ. **Two separate corpora**: one for Pregnant Women, one for Girls track — never merged.

### Data model (migration)
Enable `vector` extension.

Two FAQ tables (identical shape, different names to keep corpora separate):

```
faq_pregnancy(
  id uuid pk, slug text unique, question_variants text[] not null,
  verified_answer_en text not null, who_source text not null,
  danger_sign_flag boolean not null default false,
  local_referral text, translations jsonb not null,      -- { fr, en, pcm, ff }
  translations_reviewed jsonb not null default '{}',     -- { fr: true/false, ... }
  embedding vector(1536) not null,                        -- of canonical question text
  created_at, updated_at
)
faq_girls(... same shape ...)
```

One log table for below-threshold questions (owner-scoped, both tracks share it via `corpus` col):

```
faq_unanswered(
  id, user_id (nullable), corpus text check (corpus in ('pregnancy','girls')),
  question_text, language app_language,
  top_score numeric, top_match_slug text, created_at
)
```

RLS: FAQ tables public read (`TO anon, authenticated`) — content is safe. `faq_unanswered` insert-any, select-own + admin.

HNSW index on both embedding columns using `vector_cosine_ops` (1536 dims, direct index — no halfvec cast needed).

### Embeddings — clarification on "local model"
The spec asks for a local multilingual-e5 model. That won't run inside our Cloudflare Worker server runtime (no native/WASM ML runtime bundled, no filesystem for model weights). To keep the **$0 cost target** *and* the **"no LLM-generated answers"** rule while still working on Workers, I'll use the Lovable AI Gateway **embeddings endpoint** — embeddings are cheap (usually free-tier) and, crucially, embeddings are **not** LLM-generated text; they only rank existing verified rows. The user's core rule ("never generate an answer using general AI/LLM knowledge — only return matched database entries") is fully preserved: no chat-completion call is ever made.

Model: `openai/text-embedding-3-small` (1536 dims, multilingual-capable). Used identically for corpus seeding and for user queries.

If the user insists on a truly local model with zero embedding calls, alternative is trigram / full-text search only — significantly worse cross-lingual recall. I'll note this trade-off and default to gateway embeddings unless told otherwise.

### Server functions (`src/lib/faq.functions.ts`)
- `askFaq({ text, language, corpus })` — public/auth:
  1. Compute embedding of `text` via gateway.
  2. Call SQL RPC `match_faq_pregnancy` or `match_faq_girls` with `query_embedding`, `match_count: 1`.
  3. If `similarity < 0.75`:
     - Insert row into `faq_unanswered` (user_id from auth if present).
     - Return `{ kind: "unsure", helpline: "<local helpline from help_resources>" }`.
     - Copy: *"We don't have verified information on this yet. Please ask a health worker at your clinic or call {helpline}."*
  4. Else return `{ kind: "match", answer: translations[language] ?? verified_answer_en, source: who_source, referral: local_referral, danger: danger_sign_flag, slug }`. Answer is returned **verbatim** — no summarization, no rephrasing.
  5. If `danger_sign_flag` is true, the response includes a strong "Seek care now" banner client-side.

Two SQL functions (one per corpus) using cosine distance:
```sql
create function match_faq_pregnancy(query_embedding vector(1536))
returns table(slug text, verified_answer_en text, who_source text,
              danger_sign_flag boolean, local_referral text,
              translations jsonb, similarity float)
language sql stable as $$
  select f.slug, f.verified_answer_en, f.who_source, f.danger_sign_flag,
         f.local_referral, f.translations,
         1 - (f.embedding <=> query_embedding) as similarity
  from faq_pregnancy f
  order by f.embedding <=> query_embedding
  limit 1;
$$;
```
(Same for girls.)

### Seeding
Migration seeds ~15 pregnancy FAQs and ~15 girls FAQs with English answers, WHO/MoH-Cameroon citations, and translations (fr, en filled properly; pcm/ff marked `translations_reviewed: false` where I can't guarantee native review — those rows fall back to English at query time so we never ship an unreviewed translation). This directly enforces the "never ship unreviewed translations" rule.

Embeddings for seed rows are computed in a one-shot server function `backfillFaqEmbeddings()` (admin-guarded) invoked once after migration approval — cheaper and safer than baking vectors into SQL.

### UI
Add "Ask a question" to both hubs:
- `/pregnancy/ask` (pregnancy corpus)
- `/girls/ask` (girls corpus, already had `/girls/check` for myths — this is separate, broader Q&A)

Each page: language selector (defaults to profile.preferred_language), textarea, submit, result card showing verified answer, source citation, referral CTA (tel: link if phone), and — when `danger_sign_flag` — a red banner "This may be an emergency. Go to a clinic now or call {helpline}."

Non-judgmental tone is enforced by copy in the answer rows themselves and the "unsure" fallback wording.

## Files summary

Add:
- `src/routes/clinics.tsx`
- `src/routes/_authenticated/pregnancy.ask.tsx`
- `src/routes/_authenticated/girls.ask.tsx`
- `src/lib/clinics.functions.ts`
- `src/lib/faq.functions.ts`
- `src/lib/haversine.ts`
- migrations: pgvector + faq tables + match functions + seed + clinics seed (if empty)

Change:
- `src/routes/index.tsx` — add Clinic Finder link
- `src/routes/_authenticated/pregnancy.tsx` and `girls.index.tsx` — link to Ask + Clinics

## Confirm before I build

1. **Embeddings via Lovable AI Gateway** (embeddings only, no chat/LLM answers) — OK? This keeps the "no LLM answers" rule intact and stays effectively $0. Alternative is trigram-only search with worse multilingual recall.
2. **Unreviewed translations fall back to English** at query time (rather than showing broken pcm/ff). OK?
3. Default local helpline for Cameroon in the "unsure" fallback — do you have a specific number, or use `117` (police) / `119` (SAMU Cameroon medical)?
