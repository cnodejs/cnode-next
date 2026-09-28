export type UserUniqueConflict = "loginname" | "email" | null;

export function userUniqueConflict(error: unknown): UserUniqueConflict {
  if (!error || typeof error !== "object") return null;
  const value = error as {
    code?: string;
    constraint?: string;
    message?: string;
    detail?: string;
    cause?: unknown;
  };
  const description = `${value.constraint || ""} ${value.message || ""} ${value.detail || ""}`;
  if (value.code === "23505" || /unique/i.test(description)) {
    if (/loginname/i.test(description)) return "loginname";
    if (/email/i.test(description)) return "email";
  }
  return value.cause ? userUniqueConflict(value.cause) : null;
}
