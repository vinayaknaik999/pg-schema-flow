"use client";

import { useSchemaStore } from "@/lib/store";
import { generateSQL } from "@/lib/sql-generator";
import { useState, useEffect } from "react";
import { usePGlite } from "@/lib/pglite";
import { Rnd } from "react-rnd";
import { Copy, Check, Play } from "lucide-react";

export default function SqlPreview() {
    const { nodes, edges } = useSchemaStore();
    const [generatedSql, setGeneratedSql] = useState("");
    const db = usePGlite();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const sql = generateSQL(nodes, edges, useSchemaStore.getState().enums);
            setGeneratedSql(sql);
        } catch (e) {
            console.error("Error generating SQL:", e);
            setGeneratedSql("-- Error generating SQL: " + (e instanceof Error ? e.message : String(e)));
        }
    }, [nodes, edges]);

    const [isCollapsed, setIsCollapsed] = useState(false);
    // Initialize with a default value, update on mount
    const [lastHeight, setLastHeight] = useState(600);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setLastHeight(window.innerHeight * 0.75);
        }
    }, []);

    const runQuery = async () => {
        if (!db) return;
        setStatus("idle");
        setError(null);
        try {
            // Reset DB first (for mock purpose, usually we drop schema)
            // For now, simpler: just try to run.
            // PGlite runs in memory, so refreshing page resets it unless persisted.
            await db.exec(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
            await db.exec(generatedSql);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 3000);
        } catch (e) {
            setStatus("error");
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("An unknown error occurred");
            }
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedSql);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Rnd
            default={{
                x: window.innerWidth - 400,
                y: 80,
                width: 380,
                height: window.innerHeight * 0.75,
            }}
            size={isCollapsed ? { width: 380, height: 45 } : undefined}
            minWidth={200}
            minHeight={45}
            enableResizing={!isCollapsed}
            bounds="parent"
            className="z-40 pointer-events-auto"
            dragHandleClassName="drag-handle"
        >
            <div className="w-full h-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div
                    className="drag-handle p-2 px-3 border-b border-slate-200 dark:border-slate-700 font-bold flex justify-between items-center bg-slate-50 dark:bg-slate-900 cursor-move rounded-t-lg select-none"
                    onDoubleClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                            {isCollapsed ? "▼" : "▲"}
                        </button>
                        <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">SQL Preview</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isCollapsed && (
                            <>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                                    title="Copy SQL"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={runQuery}
                                    className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-[10px] uppercase font-bold tracking-wide rounded hover:bg-green-700 transition"
                                    title="Run in PGlite"
                                >
                                    <Play className="w-3 h-3" />
                                    Run
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {!isCollapsed && (
                    <>
                        <div className="flex-1 overflow-auto p-3 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre">
                            {generatedSql || "-- No tables defined"}
                        </div>
                        {(status === 'success' || error) && (
                            <div className={`p-2 text-xs border-t ${status === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                                {status === 'success' ? "Schema applied successfully!" : error}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Rnd>
    );
}
