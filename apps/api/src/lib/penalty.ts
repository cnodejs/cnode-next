import { eq } from "drizzle-orm";
import { users } from "@cnode/db";
import { auditQueries, getDb } from "./db";
import { boolValue } from "./db-compat";

type PenaltyState = {
  strikes?: number;
  muteUntil?: number | null;
};

function parsePenaltyState(value: unknown): PenaltyState {
  if (typeof value !== "string" || !value.trim().startsWith("{")) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

export async function ensureMuteNotExpired(user: any) {
  const state = parsePenaltyState(user.level);
  if (state.muteUntil && Date.now() > state.muteUntil && !user.isBlock) {
    const nextLevel = JSON.stringify({ ...state, muteUntil: null });
    await getDb().update(users).set({ isMuted: boolValue(false), level: nextLevel } as any).where(eq(users.id, user.id));
    return { ...user, isMuted: false, level: nextLevel };
  }
  return user;
}

export async function applyProgressivePenalty(authorId: number, operatorId: number, operatorName: string, reason: string) {
  const db = getDb();
  const user = (await db.select().from(users).where(eq(users.id, authorId)).limit(1))[0] as any;
  if (!user) return null;
  const state = parsePenaltyState(user.level);
  const strikes = Number(state.strikes || 0) + 1;
  let action = "warning";
  const updates: any = { level: JSON.stringify({ ...state, strikes }) };

  if (strikes === 2) {
    action = "temp_mute_7d";
    updates.isMuted = boolValue(true);
    updates.level = JSON.stringify({ ...state, strikes, muteUntil: Date.now() + 7 * 86400000 });
  } else if (strikes === 3) {
    action = "temp_mute_30d";
    updates.isMuted = boolValue(true);
    updates.level = JSON.stringify({ ...state, strikes, muteUntil: Date.now() + 30 * 86400000 });
  } else if (strikes >= 4) {
    action = "permanent_block_mute";
    updates.isMuted = boolValue(true);
    updates.isBlock = boolValue(true);
    updates.level = JSON.stringify({ ...state, strikes, muteUntil: null });
  }

  await db.update(users).set(updates).where(eq(users.id, authorId));
  await auditQueries.log(operatorId, operatorName, `progressive_penalty_${action}`, { type: "user", id: String(authorId), name: user.loginname }, "success", reason);
  return { action, strikes };
}
