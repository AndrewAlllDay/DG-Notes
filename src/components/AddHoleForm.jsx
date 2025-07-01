import React, { useState, useEffect } from 'react'; // <--- ADD useEffect import

export default function AddHoleForm({ onAddHole, onCancel, discs }) { // <--- ADD 'discs' PROP HERE
    const [holeNumber, setHoleNumber] = useState('');
    const [holePar, setHolePar] = useState('');
    const [holeNote, setHoleNote] = useState('');
    // REMOVED: No longer tracking tournamentName here for hole context
    // const [tournamentName, setTournamentName] = useState(''); // This state is for Course, not Hole.

    const [selectedDiscId, setSelectedDiscId] = useState(''); // <--- NEW STATE FOR SELECTED DISC

    // Reset form fields when the component is mounted or props change (e.g., modal opens)
    // Use useEffect to clear form when it's logically "closed" or resetting
    useEffect(() => {
        // You might need a prop like 'isVisible' or 'isNewHole' to trigger proper reset,
        // but for now, we'll assume this form's lifecycle aligns with a submission/cancel.
        // A simple way to reset after submit/cancel is within handleSubmit and onCancel
        // or by having the parent (AddHoleModal) control the initial states more directly.
        // For simplicity, we'll rely on the handleSubmit and onCancel to clear.
    }, []); // Empty dependency array means it runs once on mount

    const handleSubmit = (e) => {
        e.preventDefault();
        // MODIFIED: Pass selectedDiscId as the fourth argument
        onAddHole(holeNumber, holePar, holeNote, selectedDiscId); // <--- PASS selectedDiscId
        // Clear form fields after submission
        setHoleNumber('');
        setHolePar('');
        setHoleNote('');
        setSelectedDiscId(''); // <--- Clear selected disc after submission
    };

    // Also clear if cancelled
    const handleCancel = () => {
        setHoleNumber('');
        setHolePar('');
        setHoleNote('');
        setSelectedDiscId(''); // <--- Clear selected disc on cancel
        onCancel();
    };

    // Define the desired order of disc types for display (can be moved to a shared utility if used elsewhere)
    const DISC_TYPE_ORDER = [
        'Distance Driver',
        'Fairway Driver',
        'Midrange',
        'Putt/Approach',
        'Hybrid',
        'Other' // For discs without a specified type
    ];

    // Logic to group discs by type for the dropdown (copied from HoleItem.jsx)
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

    // Sort the disc types according to the predefined order, or put 'Other' at the end (copied from HoleItem.jsx)
    const sortedDiscTypes = Object.keys(groupedDiscs).sort((a, b) => {
        const indexA = DISC_TYPE_ORDER.indexOf(a);
        const indexB = DISC_TYPE_ORDER.indexOf(b);

        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="holeNumber" className="block text-gray-700 text-sm font-bold mb-1">
                Hole Number:
            </label>
            <input
                type="number" // Changed to type="number"
                id="holeNumber"
                placeholder="e.g., 1, 10"
                value={holeNumber}
                onChange={(e) => setHoleNumber(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
            />
            <label htmlFor="holePar" className="block text-gray-700 text-sm font-bold mb-1">
                Par:
            </label>
            <input
                type="number" // Changed to type="number"
                id="holePar"
                placeholder="e.g., 3, 4"
                value={holePar}
                onChange={(e) => setHolePar(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
            />

            {/* --- MOVED DISC SELECTION DROPDOWN (NOW BEFORE NOTES) --- */}
            <label htmlFor="discSelect" className="block text-gray-700 text-sm font-bold mb-1">
                Recommended Disc:
            </label>
            <select
                id="discSelect"
                className="w-full border rounded px-3 py-2"
                value={selectedDiscId}
                onChange={(e) => setSelectedDiscId(e.target.value)}
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
            {discs && discs.length === 0 && ( // Ensure discs is not null/undefined
                <p className="text-sm text-gray-500 mt-2">
                    No discs found in your bag. Add some in the "In The Bag" section to select here.
                </p>
            )}
            {/* --- END MOVED DISC SELECTION DROPDOWN --- */}

            {/* --- MOVED NOTES FIELD (NOW AFTER DISC SELECTION) --- */}
            <label htmlFor="holeNote" className="block text-gray-700 text-sm font-bold mb-1">
                Notes:
            </label>
            <textarea
                id="holeNote"
                placeholder="Any specific tips or observations for this hole?"
                value={holeNote}
                onChange={(e) => setHoleNote(e.target.value)}
                className="w-full border rounded px-3 py-2 h-24 resize-none" // Added h-24 and resize-none for better textarea
            />
            {/* --- END MOVED NOTES FIELD --- */}

            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={handleCancel} // <--- Call new handleCancel
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="!bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Add Hole
                </button>
            </div>
        </form>
    );
}