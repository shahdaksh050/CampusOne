import { create } from 'zustand';

export const useAppStore = create((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
}));
