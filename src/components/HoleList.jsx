import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import HoleItem from './HoleItem';

export default function HoleList({
    holes,
    editingHoleData,
    setEditingHoleData,
    toggleEditing,
    saveHoleChanges,
    onDeleteClick,
    onDragEnd,
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
                        {holes.length === 0 && <li>No holes added yet.</li>}
                        {holes.filter(Boolean).map((hole, index) => (
                            <HoleItem
                                key={hole.id}
                                hole={hole}
                                index={index}
                                editingHoleData={editingHoleData}
                                setEditingHoleData={setEditingHoleData}
                                onToggleEdit={() => toggleEditing(hole.id)}
                                onSave={() => saveHoleChanges(hole.id)}
                                onDelete={() => onDeleteClick(hole.id)}
                            />
                        ))}
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
    );
}