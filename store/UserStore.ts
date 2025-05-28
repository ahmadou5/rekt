import { create } from "zustand";

interface UserStore {
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userEmail: null,
  setUserEmail: (email: string | null) => set({ userEmail: email }),
}));
