import React from 'react';
import { Edit } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

export default function HoleItem({
    hole,
    index,
    editingHoleData,
    setEditingHoleData,
    onToggleEdit,
    onSave,
}) {
    return (
        <Draggable draggableId={String(hole.id)} index={index}>
            {(provided) => (
                <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="mb-4 border rounded p-4 bg-white flex justify-between items-start"
                >
                    <div className="flex-grow">
                        {hole.editing ? (
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    placeholder="Hole Number"
                                    value={editingHoleData.number}
                                    onChange={(e) =>
                                        setEditingHoleData((prev) => ({ ...prev, number: e.target.value }))
                                    }
                                    className="w-full mt-2 p-2 border rounded"
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Par"
                                    value={editingHoleData.par}
                                    onChange={(e) =>
                                        setEditingHoleData((prev) => ({ ...prev, par: e.target.value }))
                                    }
                                    className="w-full mt-2 p-2 border rounded"
                                    required
                                />
                                <textarea
                                    placeholder="Add a note"
                                    value={editingHoleData.note}
                                    onChange={(e) =>
                                        setEditingHoleData((prev) => ({ ...prev, note: e.target.value }))
                                    }
                                    className="w-full mt-2 p-2 border rounded"
                                />
                                <button
                                    onClick={onSave}
                                    className="bg-blue-600 text-white py-1 px-4 mt-2 rounded hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p>Hole {hole.number} - Par {hole.par}</p>
                                <p>{hole.note || 'No note added yet.'}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onToggleEdit}
                        className="text-gray-500 hover:text-gray-700 ml-4 mt-1"
                        aria-label="Edit Hole"
                    >
                        <Edit size={16} />
                    </button>
                </li>
            )}
        </Draggable>
    );
}