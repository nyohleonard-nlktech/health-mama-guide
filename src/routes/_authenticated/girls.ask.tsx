import { createFileRoute } from "@tanstack/react-router";
import { AskFaq } from "@/components/AskFaq";

export const Route = createFileRoute("/_authenticated/girls/ask")({
  head: () => ({
    meta: [
      { title: "Ask a question — Girls hub" },
      {
        name: "description",
        content: "Ask a question about your body, periods, or reproductive health.",
      },
    ],
  }),
  component: () => (
    <AskFaq
      corpus="girls"
      backTo="/girls"
      backLabel="Girls hub"
      title="Ask a question"
      subtitle="Non-judgmental answers from our reviewed library. If we don't know, we'll say so."
    />
  ),
});