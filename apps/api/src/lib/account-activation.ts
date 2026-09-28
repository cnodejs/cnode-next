export interface PendingAccount {
  id: number;
  email: string;
  pass: string | null;
  active: boolean | null;
}

export interface AccountActivationDependencies {
  createKey(): string;
  now(): number;
  sendActivation(email: string, key: string): Promise<void>;
}

export function activeAccount<T extends { active: boolean | null }>(user: T | null): T | null {
  return user?.active ? user : null;
}

export async function createPendingAccount(
  input: { loginname: string; passhash: string; email: string },
  dependencies: AccountActivationDependencies & {
    createUser(input: {
      loginname: string;
      pass: string;
      email: string;
      active: false;
      retrieveKey: string;
      retrieveTime: number;
    }): Promise<unknown>;
  },
) {
  const retrieveKey = dependencies.createKey();
  await dependencies.createUser({
    loginname: input.loginname,
    pass: input.passhash,
    email: input.email,
    active: false,
    retrieveKey,
    retrieveTime: dependencies.now(),
  });
  try {
    await dependencies.sendActivation(input.email, retrieveKey);
    return { status: "created" as const };
  } catch {
    return { status: "email_failed" as const };
  }
}

export async function resendAccountActivation(
  input: { name: string; pass: string },
  dependencies: AccountActivationDependencies & {
    findUser(name: string): Promise<PendingAccount | null>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    updateKey(userId: number, key: string, time: number): Promise<void>;
  },
) {
  const user = await dependencies.findUser(input.name);
  if (!user?.pass || user.active || !(await dependencies.verifyPassword(input.pass, user.pass))) {
    return { status: "ignored" as const };
  }

  const retrieveKey = dependencies.createKey();
  await dependencies.updateKey(user.id, retrieveKey, dependencies.now());
  try {
    await dependencies.sendActivation(user.email, retrieveKey);
    return { status: "sent" as const };
  } catch {
    return { status: "email_failed" as const };
  }
}
