import type { ReactNode } from "react";
import { useLocale } from "@/lib/locale";

/** Displays a fixed interface label in the user's selected language. */
export function LocalizedText({ source }: { source: string }) {
  const { ui } = useLocale();
  return <>{ui(source)}</>;
}

/** Localizes a label chosen by a conditional expression. */
export function LocalizedValue({ value }: { value: ReactNode }) {
  const { ui } = useLocale();
  return <>{typeof value === "string" ? ui(value) : value}</>;
}
