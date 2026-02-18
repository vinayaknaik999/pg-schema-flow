"use client";

import { useSchemaStore } from "@/lib/store";
import { Undo2, Redo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { StoreApi, useStore } from "zustand";

interface TemporalState {
    undo: () => void;
    redo: () => void;
    pastStates: unknown[];
    futureStates: unknown[];
}

export default function UndoRedoControls() {
    const temporal = (useSchemaStore as unknown as { temporal: StoreApi<TemporalState> }).temporal;
    const { undo, redo, pastStates, futureStates } = useStore(temporal, (state) => state);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    useEffect(() => {
        setCanUndo(pastStates.length > 0);
        setCanRedo(futureStates.length > 0);
    }, [pastStates, futureStates]);

    return (
        <div className="flex bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <button
                onClick={() => undo()}
                disabled={!canUndo}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border-r border-slate-200 dark:border-slate-700"
                title="Undo"
            >
                <Undo2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>
            <button
                onClick={() => redo()}
                disabled={!canRedo}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo"
            >
                <Redo2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>
        </div>
    );
}
