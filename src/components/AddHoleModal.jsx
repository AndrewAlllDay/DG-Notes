// src/components/AddHoleModal.jsx

import React from 'react';
import AddHoleForm from './AddHoleForm';

export default function AddHoleModal({ isOpen, onClose, onAddHole, discs }) { // <--- ADD 'discs' PROP HERE
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-xl font-semibold mb-4">Add New Hole</h3>
                <AddHoleForm
                    // MODIFIED: Capture the tournamentName from AddHoleForm and pass it to onAddHole
                    // MODIFIED: Pass the discs prop down to AddHoleForm
                    onAddHole={(n, p, note, discId) => { // <--- Changed 'tournament' to 'discId'
                        onAddHole(n, p, note, discId); // Pass all four arguments
                        onClose(); // Close modal after adding
                    }}
                    onCancel={onClose}
                    discs={discs} // <--- PASS DISCS DOWN TO ADDHOLEFORM
                />
            </div>
        </div>
    );
}