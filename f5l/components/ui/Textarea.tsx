import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Zone de texte multiligne stylée (réutilise la classe `.input`). */
export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input min-h-[88px] resize-y", className)} {...props} />;
}
