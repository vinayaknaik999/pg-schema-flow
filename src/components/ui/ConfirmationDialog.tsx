import React, { useEffect, useState } from 'react';
import { create } from 'zustand';
import { clsx } from 'clsx';
import { BadgeAlert, X } from 'lucide-react';

interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    danger?: boolean;
}

interface ConfirmationStore {
    isOpen: boolean;
    options: ConfirmationOptions | null;
    open: (options: ConfirmationOptions) => void;
    close: () => void;
}

export const useConfirmationStore = create<ConfirmationStore>((set) => ({
    isOpen: false,
    options: null,
    open: (options) => set({ isOpen: true, options }),
    close: () => set({ isOpen: false, options: null }),
}));

export const confirmAction = (options: ConfirmationOptions) => {
    useConfirmationStore.getState().open(options);
};

export const ConfirmationDialog = () => {
    const { isOpen, options, close } = useConfirmationStore();

    if (!isOpen || !options) return null;

    const handleConfirm = () => {
        options.onConfirm();
        close();
    };

    const handleCancel = () => {
        if (options.onCancel) options.onCancel();
        close();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 m-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4">
                    <div className={clsx("p-3 rounded-full", options.danger ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600")}>
                        <BadgeAlert className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            {options.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {options.message}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
                    >
                        {options.cancelText || 'Cancel'}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium text-white rounded-md transition-colors",
                            options.danger
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {options.confirmText || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};
