import { createFileRoute } from "@tanstack/react-router";
import { AskFaq } from "@/components/AskFaq";

export const Route = createFileRoute("/_authenticated/pregnancy/ask")({
  head: () => ({
    meta: [
      { title: "Ask a question — Pregnancy" },
      {
        name: "description",
        content: "Ask a pregnancy question and get a verified, sourced answer.",
      },
    ],
  }),
  component: () => (
    <AskFaq
      corpus="pregnancy"
      backTo="/pregnancy"
      backLabel="Pregnancy"
      title="Ask a pregnancy question"
      subtitle="Answers only from our verified library — sourced from WHO and Cameroon MoH guidance."
    />
  ),
});