"use client";

import { useSchemaStore } from "@/lib/store";
import { generateSQL } from "@/lib/sql-generator";
import { parseSqlToSchema } from "@/lib/sql-importer";
import { useAutoLayout } from "@/hooks/useAutoLayout";
import { Download, Upload, FileJson, FileCode, Database } from "lucide-react";
import { useRef, useState } from "react";
import { useToastStore } from "./ui/Toast";

export default function ExportImportControls() {
    const { nodes, edges, setSchema } = useSchemaStore();
    const { onLayout } = useAutoLayout();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [showSqlModal, setShowSqlModal] = useState(false);
    const [sqlInput, setSqlInput] = useState("");
    const [isImporting, setIsImporting] = useState(false);

    const handleExportJSON = () => {
        const data = JSON.stringify({ nodes, edges }, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "schema.json";
        a.click();
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    const handleExportSQL = () => {
        const sql = generateSQL(nodes, edges, useSchemaStore.getState().enums);
        const blob = new Blob([sql], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "schema.sql";
        a.click();
        URL.revokeObjectURL(url);
        setIsOpen(false);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.nodes && json.edges) {
                    setSchema(json.nodes, json.edges);
                    useToastStore.getState().addToast('Schema imported successfully', 'success');
                    setTimeout(() => onLayout('LR'), 100);
                } else {
                    useToastStore.getState().addToast('Invalid schema file format', 'error');
                }
            } catch (error) {
                console.error("Import error:", error);
                useToastStore.getState().addToast('Failed to parse JSON file', 'error');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsOpen(false);
    };

    const handleImportSql = async () => {
        if (!sqlInput.trim()) return;
        setIsImporting(true);
        try {
            const { nodes: newNodes, edges: newEdges } = await parseSqlToSchema(sqlInput);
            setSchema(newNodes, newEdges);
            useToastStore.getState().addToast('SQL imported successfully', 'success');
            setShowSqlModal(false);
            setSqlInput("");
            setTimeout(() => onLayout('LR'), 100);
        } catch (error) {
            console.error("SQL Import Error:", error);
            useToastStore.getState().addToast('Failed to parse SQL. Check compatibility.', 'error');
        } finally {
            setIsImporting(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 transition text-xs font-medium whitespace-nowrap"
                title="Export / Import"
            >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Export / Import</span>
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 w-48 bg-white dark:bg-slate-800 rounded shadow-xl border border-slate-200 dark:border-slate-700 z-50 flex flex-col py-1">
                    <button
                        onClick={handleExportJSON}
                        className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left text-sm flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                        <FileJson className="w-4 h-4" /> Export JSON
                    </button>
                    <button
                        onClick={handleExportSQL}
                        className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left text-sm flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                        <FileCode className="w-4 h-4" /> Export SQL
                    </button>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left text-sm flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                        <Upload className="w-4 h-4" /> Import JSON
                    </button>
                    <button
                        onClick={() => {
                            setShowSqlModal(true);
                            setIsOpen(false);
                        }}
                        className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-left text-sm flex items-center gap-2 text-slate-700 dark:text-slate-200"
                    >
                        <Database className="w-4 h-4" /> Import SQL
                    </button>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
            />

            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
            {showSqlModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl p-6 m-4 animate-in zoom-in-95 duration-200 flex flex-col h-[80vh]">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Import SQL (Reverse Engineer)</h3>
                        <p className="text-sm text-slate-500 mb-4">Paste your <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded">CREATE TABLE</code> statements here. The system will parse them and generate the diagram.</p>

                        <textarea
                            value={sqlInput}
                            onChange={(e) => setSqlInput(e.target.value)}
                            placeholder="CREATE TABLE users (id SERIAL PRIMARY KEY, ...);"
                            className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                            spellCheck={false}
                        />

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowSqlModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImportSql}
                                disabled={isImporting || !sqlInput.trim()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isImporting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {isImporting ? 'Importing...' : 'Generate Diagram'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
