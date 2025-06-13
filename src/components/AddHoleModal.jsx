import React from 'react';
import AddHoleForm from './AddHoleForm'; // Assuming you move the existing AddHoleForm into 'components'

export default function AddHoleModal({ isOpen, onClose, onAddHole }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-xl font-semibold mb-4">Add New Hole</h3>
                <AddHoleForm
                    onAddHole={(n, p, note) => {
                        onAddHole(n, p, note);
                        onClose(); // Close modal after adding
                    }}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
}