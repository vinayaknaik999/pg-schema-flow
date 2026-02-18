"use client";

import { useSchemaStore } from "@/lib/store";
import { Plus, Trash2, X, GripVertical } from "lucide-react";
import { Rnd } from "react-rnd";
import { useEffect, useState, useMemo, useRef } from "react";
import { POSTGRES_TYPES } from "@/lib/postgres-types";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Column Component ---
interface SortableColumnProps {
    col: any;
    selectedNodeId: string;
    updateColumn: any;
    deleteColumn: any;
    typeCategories: any;
    enums: any;
}

function SortableColumn({ col, selectedNodeId, updateColumn, deleteColumn, typeCategories, enums }: SortableColumnProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: col.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700 space-y-3 group">
            <div className="flex gap-2 items-center">
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                </div>

                <input
                    type="text"
                    value={col.name}
                    onChange={(e) => updateColumn(selectedNodeId, col.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs"
                    placeholder="Column Name"
                    autoFocus={col.name === 'new_column'} // Simplified auto-focus check
                />
                <select
                    value={col.type}
                    onChange={(e) => updateColumn(selectedNodeId, col.id, { type: e.target.value })}
                    className="w-32 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs"
                >
                    {Object.entries(typeCategories).map(([category, types]: [string, any]) => (
                        <optgroup key={category} label={category}>
                            {types.map((t: any) => (
                                <option key={t.name} value={t.name}>{t.name}</option>
                            ))}
                        </optgroup>
                    ))}
                    {enums.length > 0 && (
                        <optgroup label="Custom Enums">
                            {enums.map((e: any) => (
                                <option key={e.id} value={e.name}>{e.name}</option>
                            ))}
                        </optgroup>
                    )}
                </select>
            </div>

            {/* Advanced Properties */}
            <div className="grid grid-cols-2 gap-2 pl-6">
                {(() => {
                    const caps = POSTGRES_TYPES.find(t => t.name === col.type);
                    return (
                        <>
                            {caps?.hasLength && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-500">Len/Prec</span>
                                    <input
                                        type="number"
                                        value={col.length || ''}
                                        onChange={(e) => updateColumn(selectedNodeId, col.id, { length: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]"
                                        placeholder={caps.name === 'numeric' || caps.name === 'decimal' ? 'Precision' : 'Length'}
                                    />
                                </div>
                            )}
                            {caps?.hasScale && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-500">Scale</span>
                                    <input
                                        type="number"
                                        value={col.scale || ''}
                                        onChange={(e) => updateColumn(selectedNodeId, col.id, { scale: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]"
                                        placeholder="Scale"
                                    />
                                </div>
                            )}
                        </>
                    );
                })()}
                <div className="flex items-center gap-1 col-span-2">
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">Default</span>
                    <input
                        type="text"
                        value={col.defaultValue || ''}
                        onChange={(e) => updateColumn(selectedNodeId, col.id, { defaultValue: e.target.value })}
                        className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]"
                        placeholder="e.g. 0, 'active', true"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 pl-6">
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={col.isPk}
                            onChange={(e) => updateColumn(selectedNodeId, col.id, { isPk: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">PK</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={col.isNullable}
                            onChange={(e) => updateColumn(selectedNodeId, col.id, { isNullable: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">Nullable</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={col.isUnique}
                            onChange={(e) => updateColumn(selectedNodeId, col.id, { isUnique: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">Unique</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer" title="Array Type []">
                        <input
                            type="checkbox"
                            checked={col.isArray}
                            onChange={(e) => updateColumn(selectedNodeId, col.id, { isArray: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">Array []</span>
                    </label>
                </div>

                <button
                    onClick={() => deleteColumn(selectedNodeId, col.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export default function PropertiesPanel() {
    const {
        selectedNodeId,
        nodes,
        updateTable,
        updateColumn,
        addColumn,
        moveColumn,
        deleteColumn,
        setSelectedNode,
        enums
    } = useSchemaStore();

    const [mounted, setMounted] = useState(false);
    const columnsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sensors for Drag and Drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // delayed drag to prevent accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Group types by category
    const typeCategories = useMemo(() => {
        const groups: Record<string, typeof POSTGRES_TYPES> = {};
        POSTGRES_TYPES.forEach(t => {
            if (!groups[t.category]) groups[t.category] = [];
            groups[t.category].push(t);
        });
        return groups;
    }, []);

    const selectedNode = nodes.find((n) => n.id === selectedNodeId);

    // Auto-scroll to bottom when columns change (length increase)
    useEffect(() => {
        if (selectedNode && columnsEndRef.current) {
            columnsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedNode?.data.columns.length]);

    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!mounted || !selectedNode) {
        return null;
    }

    const { name, columns } = selectedNode.data;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = columns.findIndex((col) => col.id === active.id);
            const newIndex = columns.findIndex((col) => col.id === over?.id);
            moveColumn(selectedNode.id, oldIndex, newIndex);
        }
    };

    return (
        <Rnd
            default={{
                x: window.innerWidth - 380,
                y: 80,
                width: 360,
                height: window.innerHeight * 0.75,
            }}
            size={isCollapsed ? { width: 360, height: 45 } : undefined}
            minWidth={280}
            minHeight={45}
            enableResizing={!isCollapsed}
            bounds="parent"
            className="z-50 pointer-events-auto"
            dragHandleClassName="drag-handle"
        >
            <div className="w-full h-full bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div
                    className="drag-handle p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 cursor-move select-none"
                    onDoubleClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                            {isCollapsed ? "▼" : "▲"}
                        </button>
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Table Properties</span>
                    </div>
                    <button
                        onClick={() => setSelectedNode(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {!isCollapsed && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-slate-800">
                        {/* Table Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Table Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => updateTable(selectedNode.id, { name: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Columns */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Columns</label>
                                <button
                                    onClick={() => addColumn(selectedNode.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-blue-600"
                                    title="Add Column"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={columns.map(col => col.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {columns.map((col) => (
                                            <SortableColumn
                                                key={col.id}
                                                col={col}
                                                selectedNodeId={selectedNode.id}
                                                updateColumn={updateColumn}
                                                deleteColumn={deleteColumn}
                                                typeCategories={typeCategories}
                                                enums={enums}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                                {/* Invisible element to scroll to */}
                                <div ref={columnsEndRef} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Rnd>
    );
}
