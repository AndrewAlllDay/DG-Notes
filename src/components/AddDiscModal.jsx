// src/components/AddDiscModal.jsx

import React from 'react';

export default function AddDiscModal({
    isOpen,
    onClose,
    onSubmit,
    newDiscName,
    setNewDiscName,
    newDiscManufacturer,
    setNewDiscManufacturer,
    newDiscType,
    setNewDiscType,
    // Add new props for plastic type
    newDiscPlastic,
    setNewDiscPlastic,
}) {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic validation: Disc Name and Manufacturer are required
        if (!newDiscName.trim() || !newDiscManufacturer.trim()) {
            // You might want to add visual feedback for the user here (e.g., a toast notification)
            alert("Disc Name and Manufacturer are required!"); // Simple alert for demonstration
            return;
        }
        onSubmit(
            newDiscName,
            newDiscManufacturer,
            newDiscType,
            newDiscPlastic // Pass the new plastic type to the onSubmit handler
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Disc</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="discName" className="block text-sm font-medium text-gray-700 mb-1">Disc Name (e.g., Destroyer)</label>
                        <input
                            type="text"
                            id="discName"
                            placeholder="Disc Name"
                            value={newDiscName}
                            onChange={(e) => setNewDiscName(e.target.value)}
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="discManufacturer" className="block text-sm font-medium text-gray-700 mb-1">Manufacturer (e.g., Innova)</label>
                        <input
                            type="text"
                            id="discManufacturer"
                            placeholder="Manufacturer"
                            value={newDiscManufacturer}
                            onChange={(e) => setNewDiscManufacturer(e.target.value)}
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="discType" className="block text-sm font-medium text-gray-700 mb-1">Disc Type</label>
                        <select
                            id="discType"
                            value={newDiscType}
                            onChange={(e) => setNewDiscType(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select Type (Optional)</option>
                            <option value="Distance Driver">Distance Driver</option>
                            <option value="Fairway Driver">Fairway Driver</option>
                            <option value="Mid-range">Mid-range</option>
                            <option value="Putter">Putter</option>
                            <option value="Hybrid">Hybrid</option>
                        </select>
                    </div>
                    {/* New input field for Plastic Type */}
                    <div>
                        <label htmlFor="discPlastic" className="block text-sm font-medium text-gray-700 mb-1">Plastic Type (e.g., Star, DX)</label>
                        <input
                            type="text"
                            id="discPlastic"
                            placeholder="Plastic Type (Optional)"
                            value={newDiscPlastic}
                            onChange={(e) => setNewDiscPlastic(e.target.value)}
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 text-gray-800 font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold transition-colors"
                        >
                            Add Disc
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}