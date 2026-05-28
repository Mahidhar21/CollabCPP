import { create } from 'zustand';

const useAppStore = create((set) => ({
  sidebarOpen: true,
  apiHealth: null,
  apiHealthLoading: false,
  apiHealthError: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setApiHealth: (health) =>
    set({ apiHealth: health, apiHealthError: null }),

  setApiHealthLoading: (loading) => set({ apiHealthLoading: loading }),

  setApiHealthError: (error) =>
    set({ apiHealthError: error, apiHealth: null }),
}));

export default useAppStore;
