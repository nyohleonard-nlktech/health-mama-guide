import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

const SIM_THRESHOLD = 0.75;
const EMBED_MODEL = "openai/text-embedding-3-small";

type Language = "fr" | "en" | "pcm" | "ff";
type Corpus = "pregnancy" | "girls";

function serverClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    },
  );
}

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    },
  );
}

async function embed(text: string): Promise<number[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const j = (await res.json()) as { data: { embedding: number[] }[] };
  return j.data[0].embedding;
}

// Idempotent: fills embeddings on any rows that lack them.
// Safe to call from anywhere; only touches rows where embedding IS NULL.
async function ensureEmbeddings(corpus: Corpus): Promise<void> {
  const admin = adminClient();
  const table = corpus === "pregnancy" ? "faq_pregnancy" : "faq_girls";
  const { data, error } = await admin
    .from(table)
    .select("id, question_variants, verified_answer_en")
    .is("embedding", null)
    .limit(50);
  if (error) throw error;
  if (!data || data.length === 0) return;
  for (const row of data) {
    const text = [
      ...(row.question_variants ?? []),
      row.verified_answer_en,
    ].join(" \n ");
    const vec = await embed(text);
    // pgvector accepts the text form '[a,b,c]'.
    const vecLit = `[${vec.join(",")}]`;
    const { error: upErr } = await admin
      .from(table)
      .update({ embedding: vecLit as unknown as string })
      .eq("id", row.id);
    if (upErr) throw upErr;
  }
}

const AskInput = z.object({
  text: z.string().trim().min(3).max(1000),
  language: z.enum(["fr", "en", "pcm", "ff"]),
  corpus: z.enum(["pregnancy", "girls"]),
});

export type AskResult =
  | {
      kind: "unsure";
      helpline: string;
      message: string;
    }
  | {
      kind: "match";
      answer: string; // verified, verbatim
      source: string;
      referral: string | null;
      danger: boolean;
      slug: string;
      language_shown: Language;
      fallback_language: boolean; // true if we fell back to English
    };

const FALLBACK_HELPLINE: Record<Corpus, string> = {
  pregnancy: "119 (SAMU Cameroon)",
  girls: "1500 (child protection Cameroon)",
};

const UNSURE_COPY: Record<Language, (h: string) => string> = {
  en: (h) =>
    `We don't have verified information on this yet. Please ask a health worker at your clinic or call ${h}.`,
  fr: (h) =>
    `Nous n'avons pas encore d'information vérifiée sur ce sujet. Veuillez consulter un professionnel de santé ou appeler ${h}.`,
  pcm: (h) =>
    `We no get verified answer for this one yet. Abeg talk to health worker for your clinic or call ${h}.`,
  ff: (h) =>
    `Min heɓaali jaabaawol laaɓnungol haa jooni. Tiiɗno yiylo ceofoowo cellal wolla ewnuɗaa ${h}.`,
};

export const askFaq = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AskInput.parse(d))
  .handler(async ({ data }) => {
    // Ensure embeddings exist (idempotent, fast when already populated).
    try {
      await ensureEmbeddings(data.corpus);
    } catch (err) {
      // Non-fatal for the query path; log server-side.
      console.error("[faq] ensureEmbeddings failed:", err);
    }

    const queryVec = await embed(data.text);
    const vecLit = `[${queryVec.join(",")}]`;
    const rpcName =
      data.corpus === "pregnancy" ? "match_faq_pregnancy" : "match_faq_girls";

    const sb = serverClient();
    const { data: matches, error } = await sb.rpc(rpcName, {
      query_embedding: vecLit as unknown as string,
    });
    if (error) throw error;

    const top = matches && matches.length > 0 ? matches[0] : null;
    const score = top?.similarity ?? 0;

    if (!top || score < SIM_THRESHOLD) {
      // Log below-threshold question for human review.
      const admin = adminClient();
      await admin.from("faq_unanswered").insert({
        corpus: data.corpus,
        question_text: data.text,
        language: data.language,
        top_score: top ? Number(score.toFixed(4)) : null,
        top_match_slug: top?.slug ?? null,
      });
      const helpline = FALLBACK_HELPLINE[data.corpus];
      return {
        kind: "unsure",
        helpline,
        message: UNSURE_COPY[data.language](helpline),
      } satisfies AskResult;
    }

    // Confident match. Return the verified, pre-reviewed translation verbatim.
    const translations = (top.translations ?? {}) as Record<string, string>;
    const reviewed = (top.translations_reviewed ?? {}) as Record<
      string,
      boolean
    >;
    const wantsLang = data.language;
    const hasReviewed =
      typeof translations[wantsLang] === "string" &&
      translations[wantsLang].trim().length > 0 &&
      reviewed[wantsLang] === true;
    const answer = hasReviewed
      ? translations[wantsLang]
      : top.verified_answer_en;
    return {
      kind: "match",
      answer,
      source: top.who_source,
      referral: top.local_referral,
      danger: top.danger_sign_flag,
      slug: top.slug,
      language_shown: hasReviewed ? wantsLang : "en",
      fallback_language: !hasReviewed && wantsLang !== "en",
    } satisfies AskResult;
  });