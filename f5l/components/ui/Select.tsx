import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Menu déroulant stylé (réutilise la classe `.input`). */
export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("input cursor-pointer", className)} {...props} />;
}
