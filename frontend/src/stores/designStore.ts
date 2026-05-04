import { apiClient } from "@/api/client";
import { Design, DesignCustomization, DesignTemplate } from "@/types";
import { create } from "zustand";

interface DesignState {
    templates: DesignTemplate[];
    currentDesign: Design | null;
    userDesigns: Design[];
    isLoading: boolean;
    error: string | null;

    // Templates
    fetchTemplates: () => Promise<void>;
    getTemplate: (id: string) => DesignTemplate | undefined;

    // Design operations
    createDesign: (name: string, customization: DesignCustomization) => Promise<Design>;
    saveDesign: (design: Design) => Promise<void>;
    loadDesign: (id: string) => Promise<void>;
    deleteDesign: (id: string) => Promise<void>;
    loadUserDesigns: () => Promise<void>;

    // Current design editing
    setCurrentDesign: (design: Design | null) => void;
    updateCustomization: (customization: Partial<DesignCustomization>) => void;
    generatePreview: (customization: DesignCustomization) => Promise<string>;

    setError: (error: string | null) => void;
}

export const useDesignStore = create<DesignState>((set, get) => ({
    templates: [],
    currentDesign: null,
    userDesigns: [],
    isLoading: false,
    error: null,

    fetchTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
            const templates = await apiClient.getDesignTemplates();
            set({ templates, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    getTemplate: (id: string) => {
        return get().templates.find((t) => t.id === id);
    },

    createDesign: async (name: string, customization: DesignCustomization) => {
        set({ isLoading: true, error: null });
        try {
            // Persist a compact placeholder path; DB column is varchar(255).
            const imageUrl = `/design-previews/${customization.templateId}.png`;

            const newDesign = await apiClient.saveDesign({
                name,
                customization,
                imageUrl,
            });
            set({ isLoading: false });
            return newDesign;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    saveDesign: async (design: Design) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.saveDesign(design);
            set({ isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    loadDesign: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const design = await apiClient.getDesign(id);
            set({ currentDesign: design, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    deleteDesign: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.deleteDesign(id);
            set((state) => ({
                userDesigns: state.userDesigns.filter((d) => d.id !== id),
                isLoading: false,
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    loadUserDesigns: async () => {
        set({ isLoading: true, error: null });
        try {
            const designs = await apiClient.getUserDesigns();
            set({ userDesigns: designs, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    setCurrentDesign: (design: Design | null) => {
        set({ currentDesign: design });
    },

    updateCustomization: (customization: Partial<DesignCustomization>) => {
        set((state) => {
            if (!state.currentDesign) return state;
            return {
                currentDesign: {
                    ...state.currentDesign,
                    customization: {
                        ...state.currentDesign.customization,
                        ...customization,
                    },
                },
            };
        });
    },

    generatePreview: async (customization: DesignCustomization) => {
        // For MVP, generate a data URL from canvas
        // This is a placeholder - actual implementation would use canvas rendering
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available");

        // Simple placeholder: gradient representing indigo
        const gradient = ctx.createLinearGradient(0, 0, 400, 400);
        gradient.addColorStop(0, customization.primaryColor);
        gradient.addColorStop(1, customization.accentColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 400);

        return canvas.toDataURL("image/png");
    },

    setError: (error: string | null) => {
        set({ error });
    },
}));
