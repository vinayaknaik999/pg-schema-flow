"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore, loadProject, saveCurrentProject } from '@/lib/projects';
import { Plus, Trash2, FolderOpen, Edit2, Check, X, Search, Monitor, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { confirmAction } from '@/components/ui/ConfirmationDialog';

type SortOrder = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export default function ProjectDashboard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const router = useRouter();
    const { projects, currentProjectId, addProject, deleteProject, updateProjectName } = useProjectStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    // Auto-load initial project or create default if none exist (optional logic)
    useEffect(() => {
    }, [projects.length, currentProjectId]);

    const confirmCreate = async () => {
        if (!newProjectName.trim()) return;

        await saveCurrentProject();
        const newId = addProject(newProjectName.trim());
        await loadProject(newId);

        setIsCreating(false);
        setNewProjectName('');
        onClose();
        router.push(`/project/${newId}`);
    };

    const handleSwitch = async (id: string) => {
        if (id === currentProjectId) {
            onClose();
            return;
        }
        await saveCurrentProject();
        await loadProject(id);
        onClose();
        router.push(`/project/${id}`);
    };

    const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        confirmAction({
            title: 'Delete Project',
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            danger: true,
            onConfirm: () => {
                deleteProject(id);
                if (currentProjectId === id) {
                    router.push('/');
                }
            }
        });
    };

    const startEditing = (e: React.MouseEvent, project: { id: string, name: string }) => {
        e.stopPropagation();
        setEditingId(project.id);
        setEditName(project.name);
    };

    const saveEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingId) {
            updateProjectName(editingId, editName);
            setEditingId(null);
        }
    };

    const filteredAndSortedProjects = useMemo(() => {
        let filtered = projects;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
        }

        return filtered.sort((a, b) => {
            switch (sortOrder) {
                case 'newest': return b.lastModified - a.lastModified;
                case 'oldest': return a.lastModified - b.lastModified;
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                default: return 0;
            }
        });
    }, [projects, searchQuery, sortOrder]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header Section */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            Projects Library
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {!isCreating ? (
                        <div className="flex flex-col sm:flex-row gap-3 justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                />
                            </div>

                            <div className="flex gap-2">
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="name-asc">Name (A-Z)</option>
                                    <option value="name-desc">Name (Z-A)</option>
                                </select>

                                <button
                                    onClick={() => {
                                        setNewProjectName(`Project ${projects.length + 1}`);
                                        setIsCreating(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow-md active:scale-95 whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Project
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Enter project name..."
                                className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmCreate();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={confirmCreate}
                                    disabled={!newProjectName.trim()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Projects List */}
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/30">
                    {filteredAndSortedProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-lg font-medium">No projects found</p>
                            {searchQuery && <p className="text-sm">Try distinct search terms</p>}
                            {!searchQuery && (
                                <button
                                    onClick={() => {
                                        setNewProjectName(`Project ${projects.length + 1}`);
                                        setIsCreating(true);
                                    }}
                                    className="mt-4 text-blue-600 hover:underline text-sm"
                                >
                                    Create your first project
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredAndSortedProjects.map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() => handleSwitch(project.id)}
                                    className={clsx(
                                        "group flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer",
                                        currentProjectId === project.id
                                            ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 ring-1 ring-blue-200 dark:ring-blue-800"
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-sm"
                                    )}
                                >
                                    {/* Icon Column */}
                                    <div className={clsx(
                                        "p-2 rounded-lg shrink-0",
                                        currentProjectId === project.id
                                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-slate-600 group-hover:text-blue-500 transition-colors"
                                    )}>
                                        <Monitor className="w-5 h-5" />
                                    </div>

                                    {/* Info Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {editingId === project.id ? (
                                                <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full max-w-xs px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(e as any)}
                                                    />
                                                    <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm sm:text-base">
                                                        {project.name}
                                                    </h3>
                                                    {currentProjectId === project.id && (
                                                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
                                                            Active
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDistanceToNow(project.lastModified, { addSuffix: true })}
                                            </span>
                                            <span className="font-mono opacity-50 hidden sm:inline">
                                                ID: {project.id.slice(0, 8)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions Column */}
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => startEditing(e, project)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Rename"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, project.id, project.name)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-400">
                    {filteredAndSortedProjects.length} project{filteredAndSortedProjects.length !== 1 ? 's' : ''} found
                </div>
            </div>
        </div>
    );
}
