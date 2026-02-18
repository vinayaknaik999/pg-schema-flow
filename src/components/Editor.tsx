"use client";


import { PGliteProvider } from "@/lib/pglite";
import Image from 'next/image';
import SchemaCanvas from "@/components/schema/SchemaCanvas";
import { useSchemaStore } from "@/lib/store";
import UndoRedoControls from "@/components/UndoRedoControls";
import ExportImportControls from "@/components/ExportImportControls";
import { ToastContainer } from '@/components/ui/Toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useState, useEffect } from 'react';
import { FolderOpen, Plus, List, LayoutTemplate, Github, Moon, Sun } from 'lucide-react';
import ProjectDashboard from "@/components/ProjectDashboard";
import { saveCurrentProject, useProjectStore, loadProject } from "@/lib/projects";
import { useAutoLayout } from '@/hooks/useAutoLayout';
import { useUiStore } from "@/lib/ui-store";
import EnumManager from "@/components/EnumManager";
import dynamic from 'next/dynamic';
import { ReactFlowProvider } from '@xyflow/react';
import { useRouter } from 'next/navigation';

const SqlPreview = dynamic(() => import("@/components/SqlPreview"), { ssr: false });
const PropertiesPanel = dynamic(() => import("@/components/PropertiesPanel"), { ssr: false });

function Header({
    onOpenProjects,
    onAddTable,
    onOpenEnums,
    onLayout,
    theme,
    toggleTheme
}: {
    onOpenProjects: () => void;
    onAddTable: () => void;
    onOpenEnums: () => void;
    onLayout: (direction: 'LR' | 'TB') => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}) {
    return (
        <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl rounded-full px-4 py-2 transition-all hover:shadow-2xl max-w-[95vw]">
            <div className="flex items-center gap-2 shrink-0">
                <Image
                    src="/logo.png"
                    alt="PGSchemaFlow Logo"
                    width={52}
                    height={52}
                    className=""
                />
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 hidden xl:block whitespace-nowrap">
                    PGSchemaFlow
                </h1>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[60vw]">
                <button
                    onClick={onOpenProjects}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 transition text-xs font-medium whitespace-nowrap"
                    title="Projects"
                >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Projects</span>
                </button>

                <button
                    onClick={onAddTable}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition text-xs font-medium shadow-sm hover:shadow active:translate-y-px whitespace-nowrap"
                    title="Add Table"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add Table</span>
                </button>

                <button
                    onClick={onOpenEnums}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 transition text-xs font-medium whitespace-nowrap"
                    title="Enums"
                >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Enums</span>
                </button>

                <button
                    onClick={() => onLayout('LR')}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 transition text-xs font-medium whitespace-nowrap"
                    title="Auto Layout"
                >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Auto Layout</span>
                </button>

                <UndoRedoControls />
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

            <div className="flex items-center gap-1.5 shrink-0 relative">
                <ExportImportControls />
                <a
                    href="https://github.com"
                    target="_blank"
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="View on GitHub"
                >
                    <Github className="w-4 h-4" />
                </a>
                <button
                    onClick={toggleTheme}
                    className="p-1.5 text-slate-400 hover:text-yellow-500 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
                </button>
            </div>
        </header>
    );
}

function EditorContent({ projectId }: { projectId: string }) {
    const addTable = useSchemaStore((state) => state.addTable);
    const [showProjects, setShowProjects] = useState(false);
    const [showEnumManager, setShowEnumManager] = useState(false);
    const currentProjectId = useProjectStore((state) => state.currentProjectId);
    const hasHydrated = useProjectStore((state) => state.hasHydrated);
    const { onLayout } = useAutoLayout();
    const { theme, toggleTheme } = useUiStore();
    const router = useRouter();

    // Load project on mount/id change
    useEffect(() => {
        if (hasHydrated && projectId) {
            const exists = useProjectStore.getState().projects.some(p => p.id === projectId);

            if (exists) {
                loadProject(projectId);
            } else {
                // Project ID not found in metadata -> Redirect to Dashboard
                console.warn(`Project ${projectId} not found. Redirecting to dashboard.`);
                router.push('/');
            }
        }
    }, [projectId, hasHydrated, router]);

    // Apply theme to html
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Auto-save effect
    const nodes = useSchemaStore((state) => state.nodes);
    const edges = useSchemaStore((state) => state.edges);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentProjectId) {
                saveCurrentProject();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [nodes, edges, currentProjectId]);

    return (
        <>
            <main className="w-screen h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                <Header
                    onOpenProjects={() => setShowProjects(true)}
                    onAddTable={() => addTable("new_table")}
                    onOpenEnums={() => setShowEnumManager(true)}
                    onLayout={onLayout}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
                <div className="flex-1 relative overflow-hidden flex">
                    <SchemaCanvas />
                </div>
                <PropertiesPanel />
                <SqlPreview />
            </main>
            <ProjectDashboard isOpen={showProjects} onClose={() => setShowProjects(false)} />
            <EnumManager isOpen={showEnumManager} onClose={() => setShowEnumManager(false)} />
        </>
    );
}

export default function Editor({ projectId }: { projectId: string }) {
    return (
        <PGliteProvider>
            <ReactFlowProvider>
                <EditorContent projectId={projectId} />
            </ReactFlowProvider>
            <ToastContainer />
            <ConfirmationDialog />
        </PGliteProvider>
    );
}
