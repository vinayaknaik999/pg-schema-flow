import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Edge, Node, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, Connection, addEdge } from '@xyflow/react';
import { get, set, del } from 'idb-keyval';
import { temporal } from 'zundo';
import { useToastStore } from '@/components/ui/Toast';

export interface Column {
    id: string;
    name: string;
    type: string;
    isPk: boolean;
    isNullable: boolean;
    isUnique: boolean;
    isArray?: boolean;
    length?: number;
    scale?: number;
    defaultValue?: string;
}

export interface EnumType {
    id: string;
    name: string;
    values: string[];
}

export interface TableData extends Record<string, unknown> {
    name: string;
    columns: Column[];
    comment?: string;
}

export type TableNode = Node<TableData, 'table'>;

interface SchemaState {
    nodes: TableNode[];
    edges: Edge[];
    enums: EnumType[];
    onNodesChange: OnNodesChange<TableNode>;
    onEdgesChange: OnEdgesChange;
    addTable: (name: string) => void;
    updateTable: (id: string, data: Partial<TableData>) => void;
    onConnect: (connection: Connection) => void;
    selectedNodeId: string | null;
    setSelectedNode: (id: string | null) => void;
    updateColumn: (tableId: string, columnId: string, data: Partial<Column>) => void;
    addColumn: (tableId: string, columnId?: string) => void;
    moveColumn: (tableId: string, fromIndex: number, toIndex: number) => void;
    deleteColumn: (tableId: string, columnId: string) => void;
    deleteTable: (tableId: string) => void;
    duplicateTable: (tableId: string) => void;
    setSchema: (nodes: TableNode[], edges: Edge[]) => void;


    updateNodePosition: (id: string, position: { x: number; y: number }) => void;

    // Enums
    addEnum: (name: string, values: string[]) => void;
    updateEnum: (id: string, data: Partial<EnumType>) => void;
    deleteEnum: (id: string) => void;

    deleteEdge: (edgeId: string) => void;

    // UI State
    contextMenu: { type: 'pane' | 'node' | 'column' | 'edge'; id?: string; colId?: string; top: number; left: number } | null;
    setContextMenu: (menu: { type: 'pane' | 'node' | 'column' | 'edge'; id?: string; colId?: string; top: number; left: number } | null) => void;
}

const storage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

export const useSchemaStore = create<SchemaState>()(
    temporal(
        persist(
            immer((set) => ({
                nodes: [],
                edges: [],
                enums: [],
                onNodesChange: (changes) => {
                    set((state) => {
                        state.nodes = applyNodeChanges(changes, state.nodes) as TableNode[];
                    });
                },
                onEdgesChange: (changes) => {
                    set((state) => {
                        state.edges = applyEdgeChanges(changes, state.edges);
                    });
                },
                onConnect: (connection) => {
                    set((state) => {
                        // Validation Logic
                        const { source, target, sourceHandle, targetHandle } = connection;
                        if (!source || !target || !sourceHandle || !targetHandle) return;

                        // 1. Self-loop check (same column)
                        if (source === target && sourceHandle === targetHandle.replace('-target', '-source')) {
                            useToastStore.getState().addToast('Cannot connect a column to itself', 'error');
                            return;
                        }

                        // 2. Duplicate validation
                        const isDuplicate = state.edges.some(
                            e => e.source === source && e.target === target && e.sourceHandle === sourceHandle && e.targetHandle === targetHandle
                        );
                        if (isDuplicate) {
                            useToastStore.getState().addToast('Relationship already exists', 'error');
                            return;
                        }

                        // 3. Type compatibility
                        // We need to look up the columns to check types.
                        const sourceNode = state.nodes.find(n => n.id === source);
                        const targetNode = state.nodes.find(n => n.id === target);

                        if (!sourceNode || !targetNode) return;

                        const sourceColId = sourceHandle.replace('-source', '');
                        const targetColId = targetHandle.replace('-target', '');

                        const sourceCol = sourceNode.data.columns.find(c => c.id === sourceColId);
                        const targetCol = targetNode.data.columns.find(c => c.id === targetColId);

                        if (!sourceCol || !targetCol) return;

                        // Allow compatible types (e.g. serial <-> integer, varchar <-> text)
                        // Simple strict check for now, can be expanded.
                        const isCompatible =
                            sourceCol.type === targetCol.type ||
                            (sourceCol.type === 'serial' && targetCol.type === 'integer') ||
                            (sourceCol.type === 'integer' && targetCol.type === 'serial');

                        if (!isCompatible) {
                            useToastStore.getState().addToast(`Type mismatch: Cannot connect ${sourceCol.type} to ${targetCol.type}`, 'error');
                            return;
                        }

                        state.edges = addEdge({
                            ...connection,
                            type: 'smoothstep',
                            animated: false,
                            style: { stroke: '#64748b', strokeWidth: 1.5 },
                            markerEnd: 'crows-foot-many',
                        }, state.edges);

                        useToastStore.getState().addToast('Relationship created', 'success');
                    });
                },
                deleteEdge: (edgeId) => {
                    set((state) => {
                        state.edges = state.edges.filter((e) => e.id !== edgeId);
                    });
                },
                selectedNodeId: null,
                setSelectedNode: (id) => {
                    set((state) => {
                        state.selectedNodeId = id;
                    });
                },
                updateColumn: (tableId, columnId, data) => {
                    set((state) => {
                        const node = state.nodes.find((n) => n.id === tableId);
                        if (node) {
                            const col = node.data.columns.find((c) => c.id === columnId);
                            if (col) Object.assign(col, data);
                        }
                    });
                },
                addColumn: (tableId, columnId) => {
                    set((state) => {
                        const node = state.nodes.find((n) => n.id === tableId);
                        if (node) {
                            node.data.columns.push({
                                id: columnId || crypto.randomUUID(),
                                name: 'new_column',
                                type: 'varchar',
                                isPk: false,
                                isNullable: true,
                                isUnique: false,
                                isArray: false,
                            });
                        }
                    });
                },
                moveColumn: (tableId, fromIndex, toIndex) => {
                    set((state) => {
                        const node = state.nodes.find((n) => n.id === tableId);
                        if (node) {
                            const [movedColumn] = node.data.columns.splice(fromIndex, 1);
                            node.data.columns.splice(toIndex, 0, movedColumn);
                        }
                    });
                },
                deleteColumn: (tableId, columnId) => {
                    set((state) => {
                        const node = state.nodes.find((n) => n.id === tableId);
                        if (node) {
                            node.data.columns = node.data.columns.filter((c) => c.id !== columnId);
                        }
                    });
                },
                addTable: (name) => {
                    const id = crypto.randomUUID();
                    const newNode: TableNode = {
                        id,
                        type: 'table',
                        position: { x: 100, y: 100 },
                        data: {
                            name,
                            columns: [
                                {
                                    id: crypto.randomUUID(),
                                    name: 'id',
                                    type: 'serial',
                                    isPk: true,
                                    isNullable: false,
                                    isUnique: true,
                                    isArray: false,
                                },
                            ],
                        },
                        measured: { width: 300, height: 200 }, // Initial measurement
                    };
                    set((state) => {
                        state.nodes.push(newNode);
                    });
                },
                updateTable: (id, data) => {
                    set((state) => {
                        const node = state.nodes.find((n) => n.id === id);
                        if (node) {
                            Object.assign(node.data, data);
                        }
                    });
                },
                deleteTable: (id) => {
                    set((state) => {
                        state.nodes = state.nodes.filter((n) => n.id !== id);
                        state.edges = state.edges.filter((e) => e.source !== id && e.target !== id);
                        if (state.selectedNodeId === id) {
                            state.selectedNodeId = null;
                        }
                    });
                },
                duplicateTable: (id) => {
                    set((state) => {
                        const node = state.nodes.find((n) => n.id === id);
                        if (node) {
                            const newId = crypto.randomUUID();
                            const newNode: TableNode = {
                                ...JSON.parse(JSON.stringify(node)),
                                id: newId,
                                position: { x: node.position.x + 20, y: node.position.y + 20 },
                                data: {
                                    ...node.data,
                                    name: `${node.data.name}_copy`,
                                    columns: node.data.columns.map(col => ({ ...col, id: crypto.randomUUID() }))
                                },
                                selected: true
                            };
                            state.nodes.push(newNode);
                            state.selectedNodeId = newId;
                        }
                    });
                },
                updateNodePosition: (id, position) => {
                    set((state) => {
                        const node = state.nodes.find((n) => n.id === id);
                        if (node) {
                            node.position = position;
                        }
                    });
                },
                addEnum: (name, values) => {
                    set((state) => {
                        state.enums.push({
                            id: crypto.randomUUID(),
                            name,
                            values
                        });
                    });
                },
                updateEnum: (id, data) => {
                    set((state) => {
                        const e = state.enums.find((e) => e.id === id);
                        if (e) Object.assign(e, data);
                    });
                },
                deleteEnum: (id) => {
                    set((state) => {
                        state.enums = state.enums.filter((e) => e.id !== id);
                    });
                },
                setSchema: (nodes: TableNode[], edges: Edge[]) => {
                    set((state) => {
                        state.nodes = nodes;
                        state.edges = edges;
                    });
                },
                contextMenu: null,
                setContextMenu: (menu) => {
                    set((state) => {
                        state.contextMenu = menu;
                    });
                },
            })),
            {
                name: 'schema-storage',
                storage: createJSONStorage(() => storage),
            }
        ),
        {
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges
            }),
        }
    )
);
