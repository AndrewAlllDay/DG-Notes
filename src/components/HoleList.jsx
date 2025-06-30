// src/components/HoleList.jsx
import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import HoleItem from './HoleItem'; // <--- ADDED: Import HoleItem

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
                        {(!holes || holes.length === 0) && <li className="text-center text-gray-600 dark:text-gray-300 text-lg">No holes added yet.</li>}

                        {/* Map over holes to render HoleItem components */}
                        {holes && holes.filter(Boolean).map((hole, index) => (
                            <Draggable key={hole.id} draggableId={hole.id} index={index}>
                                {(providedDraggable) => (
                                    <HoleItem
                                        hole={hole}
                                        index={index}
                                        editingHoleData={editingHoleData}
                                        setEditingHoleData={setEditingHoleData}
                                        onToggleEdit={() => toggleEditing(hole.id)}
                                        onSave={() => saveHoleChanges(hole.id)}
                                        onDelete={() => deleteHole(hole.id)}
                                        // Pass the draggable props down to the HoleItem
                                        draggableProps={providedDraggable.draggableProps}
                                        dragHandleProps={providedDraggable.dragHandleProps}
                                        innerRef={providedDraggable.innerRef}
                                    />
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    );
}
