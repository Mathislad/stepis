import { requireModule } from "@/lib/auth/require-module";
import {
  approveManagerActionAction,
  executeManagerActionAction,
  generateManagerBriefingAction,
  rejectManagerActionAction,
} from "@/lib/manager/actions";
import { getManagerSnapshot } from "@/lib/manager/digest";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { JsonBlock } from "@/components/manager/JsonBlock";
import type { BadgeTone } from "@/components/ui/Badge";

export const metadata = { title: "Manager" };

function metricLabel(metric: string): string {
  switch (metric) {
    case "sms":
      return "SMS";
    case "email":
      return "E-mails";
    case "ai_tokens":
      return "Tokens IA";
    case "call_minutes":
      return "Minutes d'appel";
    default:
      return metric;
  }
}

function statusTone(status: string): BadgeTone {
  switch (status) {
    case "approved":
    case "executed":
      return "green";
    case "executing":
      return "blue";
    case "rejected":
    case "cancelled":
      return "red";
    case "pending":
      return "amber";
    default:
      return "neutral";
  }
}

function riskTone(risk: string): BadgeTone {
  switch (risk) {
    case "high":
      return "red";
    case "medium":
      return "amber";
    case "low":
      return "green";
    default:
      return "neutral";
  }
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--text-2)]">{empty}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-lg border border-[var(--border)] bg-black/15 px-3 py-2 text-sm text-[var(--text-2)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function ManagerPage() {
  await requireModule("manager");
  const snapshot = await getManagerSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Manager</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
          Vue de coordination : résumé quotidien, traces des agents et compteurs
          d&apos;usage. L&apos;orchestration IA viendra s&apos;appuyer sur ces données.
        </p>
      </header>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-[var(--text-2)] uppercase">
              Briefing du jour
            </p>
            <p className="mt-2 text-xl font-semibold leading-snug">
              {snapshot.briefing.headline}
            </p>
          </div>
          <Badge tone={snapshot.briefing.alerts.length > 0 ? "amber" : "green"}>
            {snapshot.briefing.alerts.length > 0 ? "À surveiller" : "RAS"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-medium text-[var(--text-2)]">
              Actions recommandées
            </h2>
            <ul className="flex flex-col gap-2">
              {snapshot.briefing.actions.map((action) => (
                <li
                  key={action}
                  className="rounded-lg border border-[var(--border)] bg-black/15 px-3 py-2 text-sm text-[var(--text-2)]"
                >
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-medium text-[var(--text-2)]">Alertes</h2>
            {snapshot.briefing.alerts.length === 0 ? (
              <p className="rounded-lg border border-[var(--border)] bg-black/15 px-3 py-2 text-sm text-[var(--text-2)]">
                Aucun signal critique.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {snapshot.briefing.alerts.map((alert) => (
                  <li
                    key={alert}
                    className="rounded-lg border border-[rgba(255,159,10,0.35)] bg-[rgba(255,159,10,0.08)] px-3 py-2 text-sm"
                    style={{ color: "var(--amber)" }}
                  >
                    {alert}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12px] font-semibold tracking-wide text-[var(--text-2)] uppercase">
                Synthèse IA
              </p>
              <Badge tone={snapshot.aiConfigured ? "blue" : "neutral"}>
                {snapshot.aiConfigured ? "Anthropic prêt" : "Clé manquante"}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
              Le Manager transforme les journaux agents, digests et quotas en
              briefing lisible. Les actions restent consultatives : rien
              d&apos;impactant n&apos;est déclenché automatiquement.
            </p>
          </div>
          <form action={generateManagerBriefingAction}>
            <Button type="submit" disabled={!snapshot.aiConfigured}>
              Générer le briefing IA
            </Button>
          </form>
        </div>

        {snapshot.managerAi ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <p className="text-xl font-semibold leading-snug">
                {snapshot.managerAi.briefing}
              </p>
              <p className="mt-1 text-[12px] text-[var(--text-2)]">
                Généré le {formatDate(snapshot.managerAi.generatedAt)} ·{" "}
                {snapshot.managerAi.model} · confiance {snapshot.managerAi.confidence}
              </p>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-medium text-[var(--text-2)]">Priorités</h2>
              <BulletList items={snapshot.managerAi.priorities} empty="Aucune priorité IA." />
            </div>
            <div>
              <h2 className="mb-2 text-sm font-medium text-[var(--text-2)]">Risques</h2>
              <BulletList items={snapshot.managerAi.risks} empty="Aucun risque IA signalé." />
            </div>
            <div>
              <h2 className="mb-2 text-sm font-medium text-[var(--text-2)]">Opportunités</h2>
              <BulletList
                items={snapshot.managerAi.opportunities}
                empty="Aucune opportunité IA signalée."
              />
            </div>
            <div>
              <h2 className="mb-2 text-sm font-medium text-[var(--text-2)]">Prochaines actions</h2>
              <BulletList
                items={snapshot.managerAi.nextActions}
                empty="Aucune action IA proposée."
              />
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-lg border border-[var(--border)] bg-black/15 px-3 py-2 text-sm text-[var(--text-2)]">
            Aucun briefing IA généré aujourd&apos;hui.
          </p>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-wide text-[var(--text-2)] uppercase">
              Validations sensibles
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
              Les agents peuvent déposer ici une action à risque. Le Manager
              centralise, journalise, puis attend une décision humaine avant
              toute exécution.
            </p>
          </div>
          <Badge
            tone={
              snapshot.actionRequests.some((request) => request.status === "pending")
                ? "amber"
                : "green"
            }
          >
            {snapshot.actionRequests.filter((request) => request.status === "pending").length} en attente
          </Badge>
        </div>

        {snapshot.actionRequests.length === 0 ? (
          <p className="rounded-lg border border-[var(--border)] bg-black/15 px-3 py-2 text-sm text-[var(--text-2)]">
            Aucune action sensible à valider.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {snapshot.actionRequests.map((request) => (
              <li key={request.id} className="rounded-xl border border-[var(--border)] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{request.agent}</Badge>
                  <Badge tone={riskTone(request.risk)}>risque {request.risk}</Badge>
                  <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                  <span className="text-[12px] text-[var(--text-2)]">
                    {formatDate(request.created_at)}
                  </span>
                </div>
                <p className="font-medium">{request.action}</p>
                <div className="mt-3">
                  <JsonBlock value={request.payload} />
                </div>

                {request.status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={approveManagerActionAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <ConfirmButton
                        className="btn btn-primary px-3 py-1.5 text-sm"
                        message="Approuver cette action sensible ?"
                      >
                        Approuver
                      </ConfirmButton>
                    </form>
                    <form action={rejectManagerActionAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <ConfirmButton
                        className="btn btn-ghost px-3 py-1.5 text-sm"
                        message="Refuser cette action sensible ?"
                      >
                        Refuser
                      </ConfirmButton>
                    </form>
                  </div>
                )}

                {request.status === "approved" &&
                  (request.agent === "loyalty_agent" || request.agent === "reputation") && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={executeManagerActionAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <ConfirmButton
                        className="btn btn-primary px-3 py-1.5 text-sm"
                        message="Exécuter cette action approuvée maintenant ?"
                      >
                        {request.agent === "reputation" ? "Valider le brouillon" : "Exécuter"}
                      </ConfirmButton>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--text-2)]">Aujourd&apos;hui</h2>
            <Badge tone={snapshot.today ? "green" : "neutral"}>
              {snapshot.today ? "Digest prêt" : "En attente"}
            </Badge>
          </div>
          {snapshot.today ? (
            <JsonBlock value={snapshot.today.summary} />
          ) : (
            <p className="text-sm text-[var(--text-2)]">
              Aucun résumé généré aujourd&apos;hui. Le cron de l&apos;Agent Fidélisation
              alimentera cette section après son prochain passage.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">Usage du mois</h2>
          {snapshot.usage.length === 0 ? (
            <p className="text-sm text-[var(--text-2)]">Aucun usage mesuré ce mois-ci.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {snapshot.usage.map((row) => (
                <li
                  key={row.metric}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-black/15 px-3 py-2"
                >
                  <span className="text-sm">{metricLabel(row.metric)}</span>
                  <span className="text-sm tabular-nums text-[var(--text-2)]">
                    {row.quantity}/{row.limit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">
            Historique des digests
          </h2>
          {snapshot.recentDigests.length === 0 ? (
            <p className="text-sm text-[var(--text-2)]">Aucun digest disponible.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {snapshot.recentDigests.map((digest) => (
                <li key={digest.id} className="rounded-lg border border-[var(--border)] p-3">
                  <p className="mb-2 text-sm font-medium">{digest.digest_date}</p>
                  <JsonBlock value={digest.summary} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-medium text-[var(--text-2)]">
            Journal des agents
          </h2>
          {snapshot.recentAuditLogs.length === 0 ? (
            <p className="text-sm text-[var(--text-2)]">Aucune trace d&apos;agent.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {snapshot.recentAuditLogs.map((log) => (
                <li key={log.id} className="rounded-lg border border-[var(--border)] p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{log.agent}</Badge>
                    <span className="text-sm font-medium">{log.action}</span>
                    <span className="text-[12px] text-[var(--text-2)]">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <JsonBlock value={log.payload} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
