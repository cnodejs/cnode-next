import { create } from "zustand";
import { apiFetch } from "~/lib/api-client";

export interface AuthUser {
  loginname: string;
  avatar_url: string;
  is_admin?: boolean;
  is_mod?: boolean;
  roles?: string[];
  id?: string | number;
}

interface AuthState {
  user: AuthUser | null;
  unreadCount: number;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setUnreadCount: (n: number) => void;
  hydrateFromLoader: (user: AuthUser | null) => void;
  fetchUnread: () => Promise<void>;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  unreadCount: 0,
  hydrated: false,
  setUser: (user) => set({ user }),
  setUnreadCount: (n) => set({ unreadCount: n }),
  hydrateFromLoader: (user) => {
    if (get().hydrated) return;
    set({ user, hydrated: true });
    if (user) {
      void get().fetchUnread();
    }
  },
  fetchUnread: async () => {
    try {
      const res = await apiFetch<{ success: boolean; data: number }>("/api/v1/message/count");
      if (res.success) set({ unreadCount: res.data });
    } catch {
      // ignore
    }
  },
  clear: () => set({ user: null, unreadCount: 0, hydrated: true }),
}));
