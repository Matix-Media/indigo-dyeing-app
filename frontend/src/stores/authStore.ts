import { apiClient } from "@/api/client";
import { User } from "@/types";
import { create } from "zustand";

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, role: "user" | "workshop") => Promise<void>;
    logout: () => void;
    getCurrentUser: () => Promise<void>;
    setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem("token") || null,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.login({ email, password });
            localStorage.setItem("token", response.token);
            set({ user: response.user, token: response.token, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.message || "Login failed";
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    register: async (email: string, password: string, name: string, role: "user" | "workshop") => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.register({ email, password, name, role });
            localStorage.setItem("token", response.token);
            set({ user: response.user, token: response.token, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.message || "Registration failed";
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, error: null });
    },

    getCurrentUser: async () => {
        set({ isLoading: true });
        try {
            const user = await apiClient.getCurrentUser();
            set({ user, isLoading: false });
        } catch (error) {
            set({ user: null, isLoading: false });
        }
    },

    setError: (error: string | null) => {
        set({ error });
    },
}));
