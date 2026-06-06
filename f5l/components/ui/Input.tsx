import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Champ de saisie stylé. */
export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}
