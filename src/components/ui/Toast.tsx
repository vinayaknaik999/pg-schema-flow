import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type) => {
        const id = crypto.randomUUID();
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 3000);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const ToastContainer = () => {
    const toasts = useToastStore((state) => state.toasts);
    const removeToast = useToastStore((state) => state.removeToast);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={clsx(
                        "pointer-events-auto flex items-center gap-2 px-4 py-3 rounded shadow-lg border animate-in slide-in-from-right-full transition-all text-sm font-medium",
                        toast.type === 'error' && "bg-red-50 text-red-900 border-red-200 dark:bg-red-900/90 dark:text-red-100 dark:border-red-800",
                        toast.type === 'success' && "bg-green-50 text-green-900 border-green-200 dark:bg-green-900/90 dark:text-green-100 dark:border-green-800",
                        toast.type === 'info' && "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/90 dark:text-blue-100 dark:border-blue-800"
                    )}
                >
                    {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
                    {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
                    {toast.type === 'info' && <Info className="w-4 h-4" />}
                    <span>{toast.message}</span>
                    <button onClick={() => removeToast(toast.id)} className="ml-2 hover:opacity-75">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}
        </div>
    );
};
