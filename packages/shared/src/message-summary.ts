import { decodeNamedCharacterReference } from "decode-named-character-reference";

const DEFAULT_MESSAGE_SUMMARY_LENGTH = 160;

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#(?:x[\da-f]+|\d+)|[a-z][a-z\d]+);/gi, (entity, name: string) => {
    if (name.startsWith("#")) {
      const hex = name[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isNaN(codePoint) || codePoint > 0x10ffff
        ? entity
        : String.fromCodePoint(codePoint);
    }
    return decodeNamedCharacterReference(name) || entity;
  });
}

export function messageContentSummary(content: string | null | undefined, maxLength = DEFAULT_MESSAGE_SUMMARY_LENGTH) {
  if (!content || maxLength <= 0) return "";

  const plainText = decodeHtmlEntities(
    content
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/```(?:\w+)?\s*([\s\S]*?)```/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s+/gm, "")
      .replace(/([*_~])\1?([^\n]*?)\1?\1/g, "$2"),
  )
    .replace(/\s+/g, " ")
    .trim();

  const characters = Array.from(plainText);
  return characters.length > maxLength ? `${characters.slice(0, maxLength).join("")}…` : plainText;
}
