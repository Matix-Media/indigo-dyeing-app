import { useToastStore } from "../stores/toastStore";

export const useToast = () => {
    const addToast = useToastStore((state) => state.addToast);

    return {
        success: (message: string, duration?: number) => addToast(message, "success", duration),
        error: (message: string, duration?: number) => addToast(message, "error", duration),
        info: (message: string, duration?: number) => addToast(message, "info", duration),
        warning: (message: string, duration?: number) => addToast(message, "warning", duration),
    };
};

export const handleApiError = (error: any, defaultMessage: string = "An error occurred"): string => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.message) {
        return error.message;
    }
    return defaultMessage;
};
