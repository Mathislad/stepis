import "server-only";
import { generateAnthropicText } from "@/lib/anthropic/client";
import type { Json, ManagerAiSummary } from "@/types/database";
import type { ManagerSnapshot } from "@/lib/manager/digest";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringArray(value: unknown, fallback: string[] = []): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 5)
    : fallback;
}

function asJson(value: ManagerAiSummary): Json {
  return {
    generatedAt: value.generatedAt,
    model: value.model,
    briefing: value.briefing,
    priorities: value.priorities,
    risks: value.risks,
    opportunities: value.opportunities,
    nextActions: value.nextActions,
    confidence: value.confidence,
    usage: {
      inputTokens: value.usage.inputTokens,
      outputTokens: value.usage.outputTokens,
    },
  };
}

function compactSnapshot(snapshot: ManagerSnapshot) {
  return {
    deterministicBriefing: snapshot.briefing,
    todayDigest: snapshot.today?.summary ?? null,
    recentDigests: snapshot.recentDigests.slice(0, 5).map((digest) => ({
      date: digest.digest_date,
      summary: digest.summary,
    })),
    auditLogs: snapshot.recentAuditLogs.slice(0, 10).map((log) => ({
      agent: log.agent,
      action: log.action,
      payload: log.payload,
      createdAt: log.created_at,
    })),
    usage: snapshot.usage,
  };
}

function parseAiJson(text: string): Omit<ManagerAiSummary, "generatedAt" | "model" | "usage"> {
  const fallback = {
    briefing: text || "Synthèse IA indisponible.",
    priorities: ["Relire les alertes du Manager déterministe."],
    risks: [],
    opportunities: [],
    nextActions: ["Relancer la synthèse lorsque les données seront plus complètes."],
    confidence: "low",
  };

  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return fallback;
    const briefing = typeof parsed.briefing === "string" ? parsed.briefing.trim() : "";
    return {
      briefing: briefing || fallback.briefing,
      priorities: stringArray(parsed.priorities, fallback.priorities),
      risks: stringArray(parsed.risks),
      opportunities: stringArray(parsed.opportunities),
      nextActions: stringArray(parsed.nextActions, fallback.nextActions),
      confidence: typeof parsed.confidence === "string" ? parsed.confidence : "medium",
    };
  } catch {
    return fallback;
  }
}

export async function generateManagerAiSummary(
  snapshot: ManagerSnapshot,
): Promise<ManagerAiSummary> {
  const result = await generateAnthropicText({
    maxTokens: 900,
    system:
      "Tu es le Manager F5L d'un SaaS multi-tenant pour TPE françaises. " +
      "Tu écris en français, clair, concret, sans jargon. Tu ne proposes jamais d'action illégale ou non conforme Google/RGPD. " +
      "Réponds uniquement en JSON valide.",
    prompt: JSON.stringify({
      task:
        "Produis un briefing quotidien pour un commerçant. Format JSON strict avec les clés briefing, priorities, risks, opportunities, nextActions, confidence. " +
        "briefing est une phrase courte. Chaque liste contient au maximum 5 éléments actionnables.",
      snapshot: compactSnapshot(snapshot),
    }),
  });
  const parsed = parseAiJson(result.text);

  return {
    ...parsed,
    generatedAt: new Date().toISOString(),
    model: result.model,
    usage: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    },
  };
}

export function managerAiToJson(summary: ManagerAiSummary): Json {
  return asJson(summary);
}
