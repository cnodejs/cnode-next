import { micromark } from "micromark";
import { linkUsers } from "./at";

export function renderMarkdown(content: string | null | undefined, mdrender: boolean) {
  const text = content || "";
  if (!mdrender) return text;
  return micromark(linkUsers(text));
}
