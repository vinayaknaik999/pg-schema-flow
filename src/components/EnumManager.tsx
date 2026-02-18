import { useState } from 'react';
import { useSchemaStore } from '@/lib/store';
import { Plus, Trash2, X, List } from 'lucide-react';
import { useToastStore } from './ui/Toast';

export default function EnumManager({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { enums, addEnum, deleteEnum, updateEnum } = useSchemaStore();
    const [newEnumName, setNewEnumName] = useState('');
    const [newEnumValues, setNewEnumValues] = useState('');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (!newEnumName.trim() || !newEnumValues.trim()) {
            useToastStore.getState().addToast('Name and values are required', 'error');
            return;
        }
        if (enums.some(e => e.name === newEnumName.trim())) {
            useToastStore.getState().addToast('Enum name already exists', 'error');
            return;
        }

        const values = newEnumValues.split(',').map(v => v.trim()).filter(Boolean);
        if (values.length === 0) {
            useToastStore.getState().addToast('At least one value is required', 'error');
            return;
        }

        addEnum(newEnumName.trim(), values);
        setNewEnumName('');
        setNewEnumValues('');
        useToastStore.getState().addToast('Enum created', 'success');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 m-4 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <List className="w-5 h-5 text-blue-500" />
                        Manage Enums
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Enum Name</label>
                        <input
                            type="text"
                            value={newEnumName}
                            onChange={(e) => setNewEnumName(e.target.value)}
                            placeholder="e.g., status, role"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Values (comma separated)</label>
                        <input
                            type="text"
                            value={newEnumValues}
                            onChange={(e) => setNewEnumValues(e.target.value)}
                            placeholder="e.g., active, inactive, pending"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" /> Create Enum
                    </button>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex-1 overflow-y-auto min-h-[200px]">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Existing Enums</h4>
                    {enums.length === 0 && (
                        <p className="text-sm text-slate-400 italic text-center py-4">No enums defined.</p>
                    )}
                    <div className="space-y-3">
                        {enums.map((e) => (
                            <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700 flex justify-between items-start group">
                                <div>
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{e.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{e.values.join(', ')}</div>
                                </div>
                                <button
                                    onClick={() => deleteEnum(e.id)}
                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                    title="Delete Enum"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
