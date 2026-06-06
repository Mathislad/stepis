import "server-only";

const BASE_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export interface AnthropicTextResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

interface GenerateTextParams {
  system: string;
  prompt: string;
  maxTokens?: number;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function anthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL);
}

export async function generateAnthropicText({
  system,
  prompt,
  maxTokens = 900,
}: GenerateTextParams): Promise<AnthropicTextResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
  if (!model) throw new Error("ANTHROPIC_MODEL manquant");

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": API_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status} ${detail}`.trim());
  }

  const payload: unknown = await res.json();
  if (!isRecord(payload)) throw new Error("Anthropic response invalide");
  const content = Array.isArray(payload.content) ? payload.content : [];
  const text = content
    .map((part) => (isRecord(part) && part.type === "text" ? str(part.text) : ""))
    .filter(Boolean)
    .join("\n")
    .trim();

  const usage = isRecord(payload.usage) ? payload.usage : {};
  return {
    text,
    model,
    inputTokens: num(usage.input_tokens),
    outputTokens: num(usage.output_tokens),
  };
}
