// src/components/AddHoleModal.jsx

import React from 'react';
import AddHoleForm from './AddHoleForm';

export default function AddHoleModal({ isOpen, onClose, onAddHole }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-xl font-semibold mb-4">Add New Hole</h3>
                <AddHoleForm
                    // MODIFIED: Capture the tournamentName from AddHoleForm and pass it to onAddHole
                    onAddHole={(n, p, note, tournament) => {
                        onAddHole(n, p, note, tournament); // Pass all four arguments
                        onClose(); // Close modal after adding
                    }}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
}