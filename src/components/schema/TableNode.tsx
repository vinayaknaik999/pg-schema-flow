import { memo, useState, useRef, useEffect, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { clsx } from 'clsx';
import { Key, Trash2, Plus, GripVertical, AlertTriangle, AlertCircle, KeyRound } from 'lucide-react';
import { confirmAction } from '../ui/ConfirmationDialog';
import { useShallow } from 'zustand/react/shallow';
import { TableNode, useSchemaStore } from '@/lib/store';

const TableNodeComponent = ({ id, data, selected }: NodeProps<TableNode>) => {
    const setSelectedNode = useSchemaStore((state) => state.setSelectedNode);
    const addColumn = useSchemaStore((state) => state.addColumn);
    const updateColumn = useSchemaStore((state) => state.updateColumn);
    const deleteColumn = useSchemaStore((state) => state.deleteColumn);
    const deleteTable = useSchemaStore((state) => state.deleteTable);
    const setContextMenu = useSchemaStore((state) => state.setContextMenu);

    // Global validation: Duplicate table names
    // Use useShallow to prevent infinite loops and unnecessary re-renders
    const tableNames = useSchemaStore(useShallow((state) => state.nodes.map(n => n.data.name)));
    const isDuplicateTableName = useMemo(() => {
        return tableNames.filter(name => name === data.name).length > 1;
    }, [tableNames, data.name]);

    // Local validation
    const hasPk = useMemo(() => data.columns.some(c => c.isPk), [data.columns]);
    const duplicateColumns = useMemo(() => {
        const names = data.columns.map(c => c.name);
        return data.columns.filter((c, index) => names.indexOf(c.name) !== index).map(c => c.name);
    }, [data.columns]);

    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when entering edit mode
    useEffect(() => {
        if (editingColumnId && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingColumnId]);

    const handleAddColumn = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newColId = crypto.randomUUID();
        addColumn(id, newColId);
        setEditingColumnId(newColId);
    };

    // Helper to handle column deletion from the node
    const handleDeleteColumn = (e: React.MouseEvent, colId: string) => {
        e.stopPropagation();
        deleteColumn(id, colId);
    };


    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(id);
            }}
            className={clsx(
                "min-w-[200px] bg-white dark:bg-slate-800 rounded-md shadow-lg border-2 transition-colors font-sans",
                selected ? "border-blue-500 shadow-blue-500/20" :
                    isDuplicateTableName ? "border-red-500 shadow-red-500/20" :
                        "border-slate-200 dark:border-slate-700"
            )}
        >
            {/* Header */}
            <div className={clsx(
                "px-3 py-2 border-b flex items-center justify-between handle group",
                isDuplicateTableName ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            )}>
                <div className="flex items-center gap-2 min-w-0">
                    <div className={clsx("font-bold text-sm truncate", isDuplicateTableName ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100")}>
                        {data.name}
                    </div>
                    {/* Validation Indicators */}
                    {isDuplicateTableName && <span title="Duplicate table name"><AlertCircle className="w-4 h-4 text-red-500" /></span>}
                    {!hasPk && <span title="Missing Primary Key"><AlertTriangle className="w-4 h-4 text-amber-500" /></span>}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        title="Delete Table"
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500 transition-colors nodrag"
                        onClick={(e) => {
                            e.stopPropagation();
                            confirmAction({
                                title: 'Delete Table?',
                                message: `Are you sure you want to delete the table "${data.name}"?`,
                                confirmText: 'Delete',
                                danger: true,
                                onConfirm: () => deleteTable(id)
                            });
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <GripVertical className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing" />
                </div>
            </div>

            {/* Columns */}
            <div className="flex flex-col">
                {data.columns.map((col) => {
                    const isDup = duplicateColumns.includes(col.name);

                    return (
                        <div
                            key={col.id}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({
                                    type: 'column',
                                    id: id,
                                    colId: col.id,
                                    top: e.clientY,
                                    left: e.clientX
                                });
                            }}
                            className={clsx(
                                "group relative px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs border-b border-transparent hover:border-slate-100 dark:hover:border-slate-700 last:border-0",
                                isDup && "bg-red-50 dark:bg-red-900/10"
                            )}
                        >
                            {/* Left Handle */}
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={`${col.id}-target`}
                                className="!w-2 !h-2 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity !-left-[5px]"
                            />

                            <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                                {col.isPk && (
                                    <KeyRound className="w-3 h-3 text-yellow-500 shrink-0" aria-label="Primary Key" />
                                )}

                                {editingColumnId === col.id ? (
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        defaultValue={col.name}
                                        className="w-full bg-white dark:bg-slate-900 border border-blue-500 rounded px-1 py-0.5 outline-none text-slate-900 dark:text-slate-100 "
                                        onBlur={(e) => {
                                            updateColumn(id, col.id, { name: e.target.value });
                                            setEditingColumnId(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                updateColumn(id, col.id, { name: e.currentTarget.value });
                                                setEditingColumnId(null);
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span
                                        className={clsx("font-medium truncate cursor-text",
                                            col.isPk ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-300",
                                            isDup && "text-red-500 dark:text-red-400"
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingColumnId(col.id);
                                            setSelectedNode(id);
                                        }}
                                        title={isDup ? "Duplicate column name" : undefined}
                                    >
                                        {col.name}
                                    </span>
                                )}
                                {isDup && <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-slate-400 font-mono text-[10px]">{col.type}</span>
                                <button
                                    onClick={(e) => handleDeleteColumn(e, col.id)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-slate-400 hover:text-red-500 transition-all nodrag"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Right Handle */}
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`${col.id}-source`}
                                className="!w-2 !h-2 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity !-right-[5px]"
                            />
                        </div>
                    );
                })}

                {/* Quick Add Button */}
                <button
                    onClick={handleAddColumn}
                    className="flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-700/50"
                >
                    <Plus className="w-3 h-3" />
                    <span className="font-medium">Add Column</span>
                </button>
            </div>
        </div>
    );
};

export default memo(TableNodeComponent);
