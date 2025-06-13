import React from 'react';
import HoleItem from './HoleItem'; // Assuming it's in the same 'components' folder

export default function HoleList({
    holes,
    editingHoleData,
    setEditingHoleData,
    toggleEditing,
    saveHoleChanges,
}) {
    return (
        <ul>
            {holes.length === 0 && <li>No holes added yet.</li>}
            {holes.map((hole) => (
                <HoleItem
                    key={hole.id}
                    hole={hole}
                    editingHoleData={editingHoleData}
                    setEditingHoleData={setEditingHoleData}
                    onToggleEdit={() => toggleEditing(hole.id)}
                    onSave={() => saveHoleChanges(hole.id)}
                />
            ))}
        </ul>
    );
}