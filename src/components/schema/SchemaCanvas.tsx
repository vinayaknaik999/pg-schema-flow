"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ConnectionLineType,
    Node,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Copy, Trash2, Plus, Maximize } from 'lucide-react';

import { useSchemaStore } from '@/lib/store';
import TableNodeComponent from './TableNode';
import { ContextMenu } from '../ui/ContextMenu';
import { confirmAction } from '../ui/ConfirmationDialog';

const nodeTypes = {
    table: TableNodeComponent,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export default function SchemaCanvas() {
    const {
        nodes, edges, onNodesChange, onEdgesChange, onConnect,
        addTable, duplicateTable, deleteTable,
        updateColumn, deleteColumn, deleteEdge,
        contextMenu, setContextMenu
    } = useSchemaStore();
    const reactFlow = useReactFlow();

    const onPaneContextMenu = useCallback(
        (event: React.MouseEvent | MouseEvent) => {
            event.preventDefault();
            setContextMenu({
                type: 'pane',
                top: event.clientY,
                left: event.clientX,
            });
        },
        [setContextMenu]
    );

    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            event.preventDefault();
            setContextMenu({
                type: 'node',
                id: node.id,
                top: event.clientY,
                left: event.clientX,
            });
        },
        [setContextMenu]
    );

    const onEdgeContextMenu = useCallback(
        (event: React.MouseEvent, edge: any) => {
            event.preventDefault();
            setContextMenu({
                type: 'edge',
                id: edge.id,
                top: event.clientY,
                left: event.clientX,
            });
        },
        [setContextMenu]
    );

    const onPaneClick = useCallback(() => {
        setContextMenu(null);
        useSchemaStore.getState().setSelectedNode(null);
    }, [setContextMenu]);

    const handleAddTable = useCallback(() => {
        if (contextMenu) {
            // Calculate position relative to the flow pane if possible, or just screen center mapping
            // Simpler: Just add at center or mapped position.
            // For now, simple addTable adds at (100, 100), we could improve this to use `reactFlow.screenToFlowPosition`
            // But addTable in store is simple. Let's just use default addTable.
            // Ideally we'd update addTable to accept position.
            // Let's stick to default for now or pass menu position if we update store.
            // The store's addTable puts it at 100,100.
            // Let's modify store later if needed.
            addTable(`new_table_${Math.floor(Math.random() * 1000)}`);
        }
        setContextMenu(null);
    }, [addTable, contextMenu, setContextMenu]);

    const handleDuplicate = useCallback(() => {
        if (contextMenu?.id) {
            duplicateTable(contextMenu.id);
        }
        setContextMenu(null);
    }, [duplicateTable, contextMenu, setContextMenu]);

    const handleDelete = useCallback(() => {
        if (contextMenu?.id) {
            confirmAction({
                title: 'Delete Table?',
                message: 'Are you sure you want to delete this table? This action cannot be undone unless you use the undo button immediately.',
                confirmText: 'Delete Table',
                danger: true,
                onConfirm: () => deleteTable(contextMenu.id!)
            });
        }
        setContextMenu(null);
    }, [deleteTable, contextMenu, setContextMenu]);

    // Column Actions
    const getColumn = useCallback(() => {
        if (contextMenu?.id && contextMenu?.colId) {
            const node = nodes.find(n => n.id === contextMenu.id);
            const col = node?.data.columns.find(c => c.id === contextMenu.colId);
            return { node, col };
        }
        return { node: null, col: null };
    }, [contextMenu, nodes]);

    const handleTogglePk = useCallback(() => {
        const { col } = getColumn();
        if (contextMenu?.id && contextMenu?.colId && col) {
            updateColumn(contextMenu.id, contextMenu.colId, { isPk: !col.isPk });
        }
        setContextMenu(null);
    }, [contextMenu, updateColumn, getColumn, setContextMenu]);

    const handleToggleUnique = useCallback(() => {
        const { col } = getColumn();
        if (contextMenu?.id && contextMenu?.colId && col) {
            updateColumn(contextMenu.id, contextMenu.colId, { isUnique: !col.isUnique });
        }
        setContextMenu(null);
    }, [contextMenu, updateColumn, getColumn, setContextMenu]);

    const handleToggleNullable = useCallback(() => {
        const { col } = getColumn();
        if (contextMenu?.id && contextMenu?.colId && col) {
            updateColumn(contextMenu.id, contextMenu.colId, { isNullable: !col.isNullable });
        }
        setContextMenu(null);
    }, [contextMenu, updateColumn, getColumn, setContextMenu]);

    const handleDeleteColumn = useCallback(() => {
        if (contextMenu?.id && contextMenu?.colId) {
            deleteColumn(contextMenu.id, contextMenu.colId);
        }
        setContextMenu(null);
    }, [contextMenu, deleteColumn, setContextMenu]);

    const handleDeleteEdge = useCallback(() => {
        if (contextMenu?.id) {
            confirmAction({
                title: 'Delete Relationship?',
                message: 'Are you sure you want to remove this connection?',
                confirmText: 'Delete',
                danger: true,
                onConfirm: () => deleteEdge(contextMenu.id!)
            });
        }
        setContextMenu(null);
    }, [contextMenu, deleteEdge, setContextMenu]);

    // Generate menu items based on type
    const menuItems = useMemo(() => {
        if (!contextMenu) return [];

        if (contextMenu.type === 'pane') {
            return [
                {
                    label: 'Add Table',
                    onClick: handleAddTable,
                    icon: <Plus className="w-4 h-4" />,
                },
                {
                    label: 'Fit View',
                    onClick: () => {
                        reactFlow.fitView();
                        setContextMenu(null);
                    },
                    icon: <Maximize className="w-4 h-4" />,
                },
            ];
        }

        if (contextMenu.type === 'node') {
            return [
                {
                    label: 'Duplicate',
                    onClick: handleDuplicate,
                    icon: <Copy className="w-4 h-4" />,
                },
                {
                    label: 'Delete',
                    onClick: handleDelete,
                    danger: true,
                    icon: <Trash2 className="w-4 h-4" />,
                },
            ];
        }

        if (contextMenu.type === 'column') {
            const { col } = getColumn();
            return [
                {
                    label: col?.isPk ? 'Unset Primary Key' : 'Set Primary Key',
                    onClick: handleTogglePk,
                    icon: <div className={col?.isPk ? "text-blue-500" : ""}>PK</div>, // Simple text icon or Lucide Key
                },
                {
                    label: col?.isUnique ? 'Unset Unique' : 'Set Unique',
                    onClick: handleToggleUnique,
                    icon: <div className={col?.isUnique ? "text-blue-500" : ""}>UQ</div>,
                },
                {
                    label: col?.isNullable ? 'Set Not Null' : 'Set Nullable',
                    onClick: handleToggleNullable,
                    icon: <div className={col?.isNullable ? "text-blue-500" : ""}>NU</div>,
                },
                {
                    label: 'Delete Column',
                    onClick: handleDeleteColumn,
                    danger: true,
                    icon: <Trash2 className="w-4 h-4" />,
                },
            ];
        }

        if (contextMenu.type === 'edge') {
            return [
                {
                    label: 'Delete Relationship',
                    onClick: handleDeleteEdge,
                    danger: true,
                    icon: <Trash2 className="w-4 h-4" />,
                },
            ];
        }

        return [];
    }, [contextMenu, handleAddTable, handleDuplicate, handleDelete, handleTogglePk, handleToggleUnique, handleToggleNullable, handleDeleteColumn, handleDeleteEdge, reactFlow, getColumn, setContextMenu]);


    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-900" onContextMenu={(e) => e.preventDefault()}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onPaneClick={onPaneClick}
                onPaneContextMenu={onPaneContextMenu}
                onNodeContextMenu={onNodeContextMenu}
                onEdgeContextMenu={onEdgeContextMenu}
                fitView
                connectionLineType={ConnectionLineType.SmoothStep}
            >
                <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
                    <defs>
                        {/* One-to-Many (Crow's Foot) */}
                        <marker
                            id="crows-foot-many"
                            viewBox="0 0 12 12"
                            refX={12}
                            refY={6}
                            markerWidth={12}
                            markerHeight={12}
                            orient="auto-start-reverse"
                        >
                            <path d="M0,6 L12,6 M12,6 L0,0 M12,6 L0,12 M8,6 L8,0 M8,6 L8,12" stroke="#64748b" strokeWidth="1.5" fill="none" />
                        </marker>

                        {/* One-to-One (Double Dash) */}
                        <marker
                            id="one-to-one"
                            viewBox="0 0 12 12"
                            refX={12}
                            refY={6}
                            markerWidth={12}
                            markerHeight={12}
                            orient="auto-start-reverse"
                        >
                            <path d="M0,6 L12,6 M8,2 L8,10 M4,2 L4,10" stroke="#64748b" strokeWidth="1.5" fill="none" />
                        </marker>
                    </defs>
                </svg>
                <Background />
                <Controls />
                <MiniMap />
                {contextMenu && (
                    <ContextMenu
                        top={contextMenu.top}
                        left={contextMenu.left}
                        onClose={() => setContextMenu(null)}
                        items={menuItems}
                    />
                )}
            </ReactFlow>
        </div>
    );
}

