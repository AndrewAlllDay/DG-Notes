// src/components/HoleList.jsx
import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import HoleItem from './HoleItem';

export default function HoleList({
    holes,
    editingHoleData,
    setEditingHoleData,
    toggleEditing,
    saveHoleChanges,
    onDragEnd,
    deleteHole,
}) {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="holes-list">
                {(provided) => (
                    <ul
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                    >
                        {(!holes || holes.length === 0) && <li>No holes added yet.</li>}

                        {holes && holes.filter(Boolean).map((hole, index) => (
                            <HoleItem
                                key={hole.id}
                                hole={hole}
                                index={index}
                                editingHoleData={editingHoleData}
                                setEditingHoleData={setEditingHoleData}
                                onToggleEdit={() => toggleEditing(hole.id)}
                                onSave={() => saveHoleChanges(hole.id)}
                                onDelete={() => deleteHole(hole.id)}
                            />
                        ))}
                        {/* CORRECTED: Only render your custom placeholder if provided.placeholder exists */}
                        {provided.placeholder && (
                            <li className="p-4 border-2 border-dashed border-gray-400 rounded-lg bg-gray-100 min-h-[72px] flex items-center justify-center text-gray-500 text-sm">
                                Drop hole here
                            </li>
                        )}
                        {/* REMOVED: The redundant {provided.placeholder} line that was outside the <li> */}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    );
}