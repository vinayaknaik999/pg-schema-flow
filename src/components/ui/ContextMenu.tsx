import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export interface ContextMenuProps {
    top: number;
    left: number;
    items: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
        danger?: boolean;
    }[];
    onClose: () => void;
}

export const ContextMenu = ({ top, left, items, onClose }: ContextMenuProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={ref}
            style={{ top, left }}
            className="absolute z-50 min-w-[160px] bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={() => {
                        item.onClick();
                        onClose();
                    }}
                    className={clsx(
                        "w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700",
                        item.danger ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" : "text-slate-700 dark:text-slate-200"
                    )}
                >
                    {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                    {item.label}
                </button>
            ))}
        </div>
    );
};
