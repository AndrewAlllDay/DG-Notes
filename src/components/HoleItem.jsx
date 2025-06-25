// src/components/HoleItem.jsx
import React from 'react';
import { Edit, Save, X, Trash } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

export default function HoleItem({
    hole,
    index,
    editingHoleData,
    setEditingHoleData,
    onToggleEdit,
    onSave,
    onDelete,
}) {
    const isCurrentlyEditing = hole.editing;

    const handleCancelEdit = () => {
        onToggleEdit(hole.id);
    };

    return (
        <Draggable draggableId={String(hole.id)} index={index}>
            {(provided, snapshot) => (
                <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
                        mb-4 border rounded p-4 bg-white flex justify-between items-start HoleItem
                        transition-all duration-200 ease-in-out
                        ${snapshot.isDragging ? 'ring-2 ring-blue-400 shadow-lg scale-105 opacity-90' : ''}
                        ${isCurrentlyEditing ? 'border-blue-500' : 'border-gray-200'}
                    `}
                >
                    {/* Hole Number Badge (visible only in read-only mode) */}
                    {!isCurrentlyEditing && (
                        <div className="w-10 h-10 rounded-full bg-indigo-400 text-white flex items-center justify-center text-lg font-bold mr-4 flex-shrink-0 shadow-sm">
                            {hole.number}
                        </div>
                    )}

                    <div className="flex-grow">
                        {isCurrentlyEditing ? (
                            <div className="space-y-2">
                                <label className="block">
                                    <span className="text-gray-700 text-sm">Hole Number:</span>
                                    <input
                                        type="number"
                                        placeholder="Hole Number"
                                        value={editingHoleData.number}
                                        onChange={(e) =>
                                            setEditingHoleData((prev) => ({ ...prev, number: e.target.value }))
                                        }
                                        className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-gray-700 text-sm">Par:</span>
                                    <input
                                        type="number"
                                        placeholder="Par"
                                        value={editingHoleData.par}
                                        onChange={(e) =>
                                            setEditingHoleData((prev) => ({ ...prev, par: e.target.value }))
                                        }
                                        className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-gray-700 text-sm">Note:</span>
                                    <textarea
                                        placeholder="Add a note"
                                        value={editingHoleData.note}
                                        onChange={(e) =>
                                            setEditingHoleData((prev) => ({ ...prev, note: e.target.value }))
                                        }
                                        className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        rows="3"
                                    />
                                </label>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    <button
                                        onClick={onSave}
                                        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center gap-1 transition-colors"
                                    >
                                        <Save size={16} /> Save Changes
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 flex items-center gap-1 transition-colors"
                                    >
                                        <X size={16} /> Cancel
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 flex items-center gap-1 transition-colors"
                                    >
                                        <Trash size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // UPDATED: Removed " - Par {hole.par}"
                            <div className=''>
                                <p className='mb-2'><span className='font-bold text-lg'>Hole {hole.number}</span></p>
                                <p className='text-gray-700 text-sm whitespace-pre-wrap'>{hole.note || 'No note added yet.'}</p>
                            </div>
                        )}
                    </div>
                    {!isCurrentlyEditing && (
                        <button
                            onClick={onToggleEdit}
                            className="text-gray-500 !bg-transparent hover:text-gray-700 ml-4 mt-1 flex-shrink-0"
                            aria-label="Edit Hole"
                        >
                            <Edit size={16} />
                        </button>
                    )}
                </li>
            )}
        </Draggable>
    );
}