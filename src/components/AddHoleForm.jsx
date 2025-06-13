import React, { useState } from 'react';

export default function AddHoleForm({ onAddHole, onCancel }) {
    const [holeNumber, setHoleNumber] = useState('');
    const [holePar, setHolePar] = useState('');
    const [holeNote, setHoleNote] = useState('');
    // NEW: State for tournament name
    const [tournamentName, setTournamentName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // MODIFIED: Pass tournamentName as the fourth argument
        onAddHole(holeNumber, holePar, holeNote, tournamentName);
        setHoleNumber('');
        setHolePar('');
        setHoleNote('');
        // NEW: Clear tournament name after submission
        setTournamentName('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                type="text"
                placeholder="Hole Number"
                value={holeNumber}
                onChange={(e) => setHoleNumber(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
            />
            <input
                type="number"
                placeholder="Par"
                value={holePar}
                onChange={(e) => setHolePar(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
            />
            {/* NEW: Input field for Tournament Name */}

            <textarea
                placeholder="Add a note (Optional)" // Clarified optional
                value={holeNote}
                onChange={(e) => setHoleNote(e.target.value)}
                className="w-full border rounded px-3 py-2"
            />
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Add Hole
                </button>
            </div>
        </form>
    );
}