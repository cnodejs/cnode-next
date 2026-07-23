import { create } from "zustand";

interface UIState {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set({ mobileNavOpen: !get().mobileNavOpen }),
}));
