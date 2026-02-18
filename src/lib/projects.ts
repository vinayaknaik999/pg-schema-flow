import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { useSchemaStore, TableNode } from './store';
import { Edge } from '@xyflow/react';

export interface ProjectMetadata {
    id: string;
    name: string;
    lastModified: number;
    preview?: string; // Optional data URI for thumbnail
}

interface ProjectState {
    projects: ProjectMetadata[];
    currentProjectId: string | null;
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    addProject: (name: string) => string;
    deleteProject: (id: string) => void;
    updateProjectName: (id: string, name: string) => void;
    setCurrentProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            projects: [],
            currentProjectId: null,
            hasHydrated: false,
            setHasHydrated: (state) => set({ hasHydrated: state }),
            addProject: (name) => {
                const id = crypto.randomUUID();
                const newProject: ProjectMetadata = {
                    id,
                    name,
                    lastModified: Date.now(),
                };
                set((state) => ({
                    projects: [newProject, ...state.projects],
                    currentProjectId: id,
                }));
                return id;
            },
            deleteProject: (id) => {
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== id),
                    currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
                }));
                del(`project-schema-${id}`);
            },
            updateProjectName: (id, name) => {
                set((state) => ({
                    projects: state.projects.map((p) => (p.id === id ? { ...p, name } : p)),
                }));
            },
            setCurrentProject: (id) => {
                set({ currentProjectId: id });
            },
        }),
        {
            name: 'project-list',
            storage: createJSONStorage(() => ({
                getItem: async (name) => (await get(name)) || null,
                setItem: async (name, value) => await set(name, value),
                removeItem: async (name) => await del(name),
            })),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

// Helper to save current schema to the active project slot
export const saveCurrentProject = async () => {
    const { nodes, edges } = useSchemaStore.getState();
    const { currentProjectId, projects } = useProjectStore.getState();

    if (!currentProjectId) return;

    // Save schema data
    const schemaData = { nodes, edges };
    await set(`project-schema-${currentProjectId}`, JSON.stringify(schemaData));

    // Update last modified
    useProjectStore.setState((state) => ({
        projects: state.projects.map((p) =>
            p.id === currentProjectId ? { ...p, lastModified: Date.now() } : p
        ),
    }));
};

// Helper to load a project into the schema store
export const loadProject = async (projectId: string) => {
    const schemaJson = await get(`project-schema-${projectId}`);
    if (schemaJson) {
        try {
            const { nodes, edges } = JSON.parse(schemaJson);
            useSchemaStore.getState().setSchema(nodes, edges);
            useProjectStore.getState().setCurrentProject(projectId);
        } catch (e) {
            console.error('Failed to parse project schema', e);
        }
    } else {
        // New empty project
        useSchemaStore.getState().setSchema([], []);
        useProjectStore.getState().setCurrentProject(projectId);
    }
};

// Hook to auto-save on changes (debounce this in component)
