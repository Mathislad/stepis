import type { Channel, Formula, UsageMetric } from "@/types/database";

export const MONTHLY_USAGE_LIMITS: Record<Formula, Record<UsageMetric, number>> = {
  starter: {
    sms: 150,
    email: 1000,
    ai_tokens: 0,
    call_minutes: 0,
  },
  business: {
    sms: 400,
    email: 3000,
    ai_tokens: 0,
    call_minutes: 0,
  },
  full: {
    sms: 900,
    email: 8000,
    ai_tokens: 0,
    call_minutes: 0,
  },
};

export function metricForChannel(channel: Channel): UsageMetric | null {
  if (channel === "sms") return "sms";
  if (channel === "email") return "email";
  return null;
}

export function limitFor(formula: Formula, metric: UsageMetric): number {
  return MONTHLY_USAGE_LIMITS[formula][metric];
}
