import React, { useEffect, useState } from 'react';
import { Edit, Save, X, Trash } from 'lucide-react';

// Define the desired order of disc types for display (can be moved to a shared utility if used elsewhere)
const DISC_TYPE_ORDER = [
    'Distance Driver',
    'Fairway Driver',
    'Midrange',
    'Putt/Approach',
    'Hybrid',
    'Other' // For discs without a specified type
];

export default function HoleItem({
    hole,
    index,
    editingHoleData,
    setEditingHoleData,
    onToggleEdit,
    onSave,
    onDelete,
    draggableProps,
    dragHandleProps,
    innerRef,
    discs
}) {
    const isCurrentlyEditing = hole.editing;

    const [currentEditNumber, setCurrentEditNumber] = useState(hole.number);
    const [currentEditPar, setCurrentEditPar] = useState(hole.par);
    const [currentEditNote, setCurrentEditNote] = useState(hole.note);
    const [currentEditDiscId, setCurrentEditDiscId] = useState(hole.discId || '');

    useEffect(() => {
        if (isCurrentlyEditing && editingHoleData && editingHoleData.id === hole.id) {
            setCurrentEditNumber(editingHoleData.number || '');
            setCurrentEditPar(editingHoleData.par || '');
            setCurrentEditNote(editingHoleData.note || '');
            setCurrentEditDiscId(editingHoleData.discId || '');
        } else if (!isCurrentlyEditing) {
            setCurrentEditNumber(hole.number);
            setCurrentEditPar(hole.par);
            setCurrentEditNote(hole.note);
            setCurrentEditDiscId(hole.discId || '');
        }
    }, [isCurrentlyEditing, editingHoleData, hole]);

    const handleLocalInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'number') setCurrentEditNumber(value);
        else if (name === 'par') setCurrentEditPar(value);
        else if (name === 'note') setCurrentEditNote(value);
        else if (name === 'discId') setCurrentEditDiscId(value);

        setEditingHoleData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCancelEdit = () => {
        onToggleEdit(hole.id, hole);
        setCurrentEditNumber(hole.number);
        setCurrentEditPar(hole.par);
        setCurrentEditNote(hole.note);
        setCurrentEditDiscId(hole.discId || '');
    };

    const displayDisc = hole.discId && discs ? discs.find(d => d.id === hole.discId) : null;

    // --- New logic to group discs by type for the dropdown ---
    const groupedDiscs = {};
    if (discs) {
        discs.forEach(disc => {
            const type = (disc.type && disc.type.trim() !== '') ? disc.type : 'Other';
            if (!groupedDiscs[type]) {
                groupedDiscs[type] = [];
            }
            groupedDiscs[type].push(disc);
        });
    }

    // Sort the disc types according to the predefined order, or put 'Other' at the end
    const sortedDiscTypes = Object.keys(groupedDiscs).sort((a, b) => {
        const indexA = DISC_TYPE_ORDER.indexOf(a);
        const indexB = DISC_TYPE_ORDER.indexOf(b);

        // Handle types not in DISC_TYPE_ORDER (put them at the end)
        if (indexA === -1 && indexB === -1) return a.localeCompare(b); // Alphabetical for unknown types
        if (indexA === -1) return 1; // a comes after b
        if (indexB === -1) return -1; // b comes after a
        return indexA - indexB;
    });

    return (
        <li
            ref={innerRef}
            {...draggableProps}
            {...dragHandleProps}
            className={`
                mb-4 border rounded p-4 bg-white flex justify-between items-start HoleItem
                transition-all duration-200 ease-in-out
                ${isCurrentlyEditing ? 'border-blue-500' : 'border-gray-200'}
            `}
            data-hole-id={hole.id}
        >
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
                                name="number"
                                value={currentEditNumber}
                                onChange={handleLocalInputChange}
                                className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </label>
                        <label className="block">
                            <span className="text-gray-700 text-sm">Par:</span>
                            <input
                                type="number"
                                placeholder="Par"
                                name="par"
                                value={currentEditPar}
                                onChange={handleLocalInputChange}
                                className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </label>
                        <label className="block">
                            <span className="text-gray-700 text-sm">Note:</span>
                            <textarea
                                placeholder="Add a note"
                                name="note"
                                value={currentEditNote}
                                onChange={handleLocalInputChange}
                                className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                rows="3"
                            />
                        </label>

                        <label className="block">
                            <span className="text-gray-700 text-sm">Recommended Disc:</span>
                            <select
                                name="discId"
                                value={currentEditDiscId}
                                onChange={handleLocalInputChange}
                                className="w-full mt-1 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">No Disc Selected</option>
                                {sortedDiscTypes.map(type => (
                                    <optgroup key={type} label={type}>
                                        {groupedDiscs[type].map(disc => (
                                            <option key={disc.id} value={disc.id}>
                                                {disc.name} ({disc.manufacturer})
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {discs && discs.length === 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    No discs found in your bag. Add some in "In The Bag" section.
                                </p>
                            )}
                        </label>

                        <div className="flex flex-wrap gap-2 mt-3">
                            <button
                                onClick={() => onSave(hole.id)}
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
                                onClick={() => onDelete(hole.id)}
                                className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 flex items-center gap-1 transition-colors"
                            >
                                <Trash size={16} /> Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    // Display mode (reverted to original display, without disc type)
                    <div className=''>
                        <p className='mb-2'><span className='font-bold text-lg'>Hole {hole.number}</span> - Par {hole.par}</p>

                        {/* Display the recommended disc as before */}
                        {displayDisc && (
                            <p className="text-gray-600 text-sm italic mt-1">
                                Recommended: {displayDisc.name} ({displayDisc.manufacturer})
                            </p>
                        )}

                        {hole.note && <p className='text-gray-700 text-sm whitespace-pre-wrap'>{hole.note}</p>}
                        {!hole.note && <p className='text-gray-500 text-sm italic'>No note added yet.</p>}
                    </div>
                )}
            </div>
            {!isCurrentlyEditing && (
                <button
                    onClick={() => onToggleEdit(hole.id, hole)}
                    className="text-gray-500 !bg-transparent hover:text-gray-700 ml-4 mt-1 flex-shrink-0"
                    aria-label="Edit Hole"
                >
                    <Edit size={16} />
                </button>
            )}
        </li>
    );
}