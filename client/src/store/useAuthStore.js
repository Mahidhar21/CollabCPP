import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api.js';
import { clearStoredToken, getStoredToken, setStoredToken } from '../utils/token.js';
import useSocketStore from './useSocketStore.js';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: getStoredToken(),
      isAuthenticated: !!getStoredToken(),
      isLoading: false,
      isInitialized: false,
      error: null,

      setAuth: ({ user, token }) => {
        setStoredToken(token);
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });
      },

      clearAuth: () => {
        clearStoredToken();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setError: (error) => set({ error }),

      setLoading: (isLoading) => set({ isLoading }),

      initializeAuth: async () => {
        const token = getStoredToken();
        if (!token) {
          set({ isInitialized: true, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const { data } = await authApi.getMe();
          set({
            user: data.data.user,
            token,
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
            error: null,
          });
        } catch {
          get().clearAuth();
          set({ isInitialized: true, isLoading: false });
        }
      },

      signup: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.signup(payload);
          get().setAuth(data.data);
          set({ isLoading: false });
          return data.data;
        } catch (err) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authApi.login(payload);
          get().setAuth(data.data);
          set({ isLoading: false });
          return data.data;
        } catch (err) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      logout: () => {
        useSocketStore.getState().disconnect();
        get().clearAuth();
      },
    }),
    {
      name: 'collabcpp-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setStoredToken(state.token);
        }
      },
    }
  )
);

export default useAuthStore;
