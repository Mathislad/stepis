import { requireModule } from "@/lib/auth/require-module";
import { anthropicConfigured } from "@/lib/anthropic/client";
import { getReputationSnapshot } from "@/lib/reputation/reputation";
import {
  generateReviewResponseDraftAction,
  markFeedbackHandledAction,
  queueReviewRequestsAction,
  requestReviewResponseApprovalAction,
} from "@/lib/reputation/actions";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Réputation" };

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-[var(--text-2)]">{label}</p>
    </div>
  );
}

export default async function ReputationPage() {
  const ctx = await requireModule("reputation");
  const snapshot = await getReputationSnapshot();
  const average = snapshot.stats.averageRating?.toFixed(1) ?? "—";
  const managerEnabled = ctx.enabledModules.has("manager");
  const aiConfigured = anthropicConfigured();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Réputation</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
          Demandes d&apos;avis conformes : sollicitation envoyée à tous les clients,
          feedback privé en parallèle, réponses aux avis sans filtrage.
        </p>
      </header>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge tone="green">Conforme Google</Badge>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">
              Aucun review gating : F5L ne filtre jamais les clients selon leur
              satisfaction. Les demandes publiques partent à tous les contacts
              éligibles, et le canal privé sert uniquement à traiter les retours.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={queueReviewRequestsAction}>
              <input type="hidden" name="channel" value="sms" />
              <button type="submit" className="btn btn-primary">
                Demander à tous par SMS
              </button>
            </form>
            <form action={queueReviewRequestsAction}>
              <input type="hidden" name="channel" value="email" />
              <button type="submit" className="btn btn-ghost">
                Demander à tous par e-mail
              </button>
            </form>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Stat label="Demandes" value={snapshot.stats.reviewRequests} />
        <Stat label="Envoyées" value={snapshot.stats.sentRequests} />
        <Stat label="Avis suivis" value={snapshot.stats.reviews} />
        <Stat label="Note moyenne" value={average} />
        <Stat label="Feedbacks ouverts" value={snapshot.stats.privateFeedbackOpen} />
        <Stat label="Réponses validées" value={snapshot.stats.approvedResponses} />
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">
            Demandes récentes
          </h2>
          {snapshot.reviewRequests.length === 0 ? (
            <p className="text-sm text-[var(--text-2)]">Aucune demande d&apos;avis.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {snapshot.reviewRequests.slice(0, 8).map((request) => (
                <li key={request.id} className="rounded-lg border border-[var(--border)] p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone={request.status === "failed" ? "red" : "blue"}>
                      {request.status}
                    </Badge>
                    <span className="text-sm">{request.channel.toUpperCase()}</span>
                  </div>
                  <p className="text-[12px] text-[var(--text-2)]">
                    {formatDate(request.created_at)}
                  </p>
                  {request.request_url && (
                    <a
                      href={request.request_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-[12px] text-[var(--blue)] hover:underline"
                    >
                      Feedback privé ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Avis publics</h2>
          {snapshot.reviews.length === 0 ? (
            <p className="text-sm text-[var(--text-2)]">Aucun avis suivi.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {snapshot.reviews.slice(0, 8).map((review) => (
                <li key={review.id} className="rounded-lg border border-[var(--border)] p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone="amber">{review.rating ?? "—"}★</Badge>
                    <span className="text-sm">{review.author_name ?? "Auteur inconnu"}</span>
                  </div>
                  {review.content && (
                    <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
                      {review.content}
                    </p>
                  )}
                  {review.response_draft && (
                    <div className="mt-3 rounded-lg border border-[var(--border)] bg-black/10 p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge tone={review.response_approved_at ? "green" : "blue"}>
                          {review.response_approved_at ? "Brouillon validé" : "Brouillon IA"}
                        </Badge>
                        {review.response_draft_generated_at && (
                          <span className="text-[11px] text-[var(--text-2)]">
                            {formatDate(review.response_draft_generated_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed">{review.response_draft}</p>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={generateReviewResponseDraftAction}>
                      <input type="hidden" name="reviewId" value={review.id} />
                      <button
                        type="submit"
                        disabled={!aiConfigured}
                        className="btn btn-ghost px-3 py-1.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {review.response_draft ? "Régénérer" : "Brouillon IA"}
                      </button>
                    </form>
                    {review.response_draft && managerEnabled && !review.response_approved_at && (
                      <form action={requestReviewResponseApprovalAction}>
                        <input type="hidden" name="reviewId" value={review.id} />
                        <button type="submit" className="btn btn-primary px-3 py-1.5 text-[13px]">
                          Demander validation
                        </button>
                      </form>
                    )}
                    {review.response_draft && !managerEnabled && (
                      <Badge tone="amber">Manager requis</Badge>
                    )}
                    {!aiConfigured && <Badge tone="neutral">Anthropic non configuré</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Feedback privé</h2>
          {snapshot.privateFeedback.length === 0 ? (
            <p className="text-sm text-[var(--text-2)]">Aucun feedback privé.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {snapshot.privateFeedback.slice(0, 8).map((feedback) => (
                <li key={feedback.id} className="rounded-lg border border-[var(--border)] p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone={feedback.handled ? "green" : "amber"}>
                      {feedback.handled ? "Traité" : "À traiter"}
                    </Badge>
                    <span className="text-sm">{feedback.rating ?? "—"} / 5</span>
                  </div>
                  {feedback.message && (
                    <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
                      {feedback.message}
                    </p>
                  )}
                  {!feedback.handled && (
                    <form action={markFeedbackHandledAction} className="mt-3">
                      <input type="hidden" name="feedbackId" value={feedback.id} />
                      <button type="submit" className="btn btn-ghost px-3 py-1.5 text-[13px]">
                        Marquer traité
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
