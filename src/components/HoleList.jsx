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
                        {/* Message for when there are no holes */}
                        {(!holes || holes.length === 0) && <li>No holes added yet.</li>}

                        {/* Map over holes to render HoleItem components */}
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
                        {/* The placeholder element required by react-beautiful-dnd */}
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    );
}