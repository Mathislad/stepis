import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicReviewRequest } from "@/lib/reputation/public";
import { FeedbackForm } from "./FeedbackForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ requestId: string }>;
}): Promise<Metadata> {
  const { requestId } = await params;
  const request = await getPublicReviewRequest(requestId);
  return {
    title: request ? `Votre retour — ${request.orgName}` : "Demande introuvable",
    robots: { index: false, follow: false },
  };
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const request = await getPublicReviewRequest(requestId);
  if (!request) notFound();

  return (
    <main className="mx-auto max-w-lg px-5 py-12">
      <header className="mb-6">
        <p className="text-sm font-medium text-zinc-500">Retour privé</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
          Comment s&apos;est passée votre expérience chez {request.orgName} ?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500">
          Ce formulaire sert à transmettre un retour privé au commerce. Il ne
          bloque pas et ne remplace pas un avis public.
        </p>
      </header>

      <FeedbackForm requestId={request.id} />

      <footer className="mt-10 text-center text-xs text-zinc-400">
        Propulsé par <span className="font-semibold text-zinc-600">F5L</span>
      </footer>
    </main>
  );
}
