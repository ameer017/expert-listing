import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONE_CLASS = {
  muted: "text-muted",
  error: "text-rose",
} as const;

export function StatusRow({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: keyof typeof TONE_CLASS;
}) {
  return <div className={cn("px-4 py-4 text-sm", TONE_CLASS[tone])}>{children}</div>;
}
