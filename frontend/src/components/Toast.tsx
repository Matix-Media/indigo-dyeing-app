import React from "react";
import { useToastStore } from "../stores/toastStore";

const Toast: React.FC = () => {
    const { toasts, removeToast } = useToastStore();

    const getIcon = (type: string) => {
        switch (type) {
            case "success":
                return "✅";
            case "error":
                return "❌";
            case "warning":
                return "⚠️";
            case "info":
                return "ℹ️";
            default:
                return "📢";
        }
    };

    const getColors = (type: string) => {
        switch (type) {
            case "success":
                return "bg-green-50 border-green-200 text-green-800";
            case "error":
                return "bg-red-50 border-red-200 text-red-800";
            case "warning":
                return "bg-yellow-50 border-yellow-200 text-yellow-800";
            case "info":
                return "bg-blue-50 border-blue-200 text-blue-800";
            default:
                return "bg-gray-50 border-gray-200 text-gray-800";
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 ${getColors(
                        toast.type,
                    )}`}
                >
                    <span className="text-xl flex-shrink-0">{getIcon(toast.type)}</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium">{toast.message}</p>
                    </div>
                    <button onClick={() => removeToast(toast.id)} className="flex-shrink-0 text-lg opacity-70 hover:opacity-100 transition">
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default Toast;
