// src/components/AddDiscModal.jsx

import React, { useState, useEffect } from 'react';

export default function AddDiscModal({
    isOpen,
    onClose,
    onSubmit,
    initialData = null, // This prop will be 'currentDiscToEdit' when editing
    // The individual newDisc... props below become less crucial for internal state,
    // but we keep them as they are currently used by InTheBagPage.jsx for new disc setup.
    // However, the modal will now prioritize its own internal state for form inputs.
    newDiscName: propNewDiscName, // Renamed to differentiate from internal 'name' state
    setPropNewDiscName,
    newDiscManufacturer: propNewDiscManufacturer,
    setPropNewDiscManufacturer,
    newDiscType: propNewDiscType,
    setPropNewDiscType,
    newDiscPlastic: propNewDiscPlastic,
    setPropNewDiscPlastic,
    newDiscColor: propNewDiscColor,
    setPropNewDiscColor,
    newDiscStability: propNewDiscStability, // Changed from newDiscSpeed
    setPropNewDiscStability, // Changed from setNewDiscSpeed
}) {
    // INTERNAL STATE for form fields
    const [name, setName] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [type, setType] = useState('');
    const [plastic, setPlastic] = useState('');
    const [color, setColor] = useState('');
    const [stability, setStability] = useState(''); // Changed from speed to stability

    // useEffect to synchronize internal state with initialData or clear it
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // EDIT MODE: Populate internal state from initialData (currentDiscToEdit)
                setName(initialData.name || '');
                setManufacturer(initialData.manufacturer || '');
                setType(initialData.type || '');
                setPlastic(initialData.plastic || '');
                setColor(initialData.color || '');
                // Crucial for stability: convert to string and handle undefined/null
                setStability(initialData.stability !== undefined && initialData.stability !== null ? String(initialData.stability) : ''); // Changed from speed
            } else {
                // ADD MODE: Optionally use parent's newDisc... props or clear
                // If the parent explicitly passes blank values for a new disc, use them.
                // Otherwise, ensure they are cleared.
                setName(propNewDiscName || '');
                setManufacturer(propNewDiscManufacturer || '');
                setType(propNewDiscType || '');
                setPlastic(propNewDiscPlastic || '');
                setColor(propNewDiscColor || '');
                setStability(propNewDiscStability || ''); // Changed from propNewDiscSpeed
            }
        } else {
            // When modal closes, reset internal form state
            setName('');
            setManufacturer('');
            setType('');
            setPlastic('');
            setColor('');
            setStability(''); // Changed from speed
        }
    }, [
        isOpen,
        initialData,
        // Include propNewDisc... values as dependencies in case the parent updates them
        // while the modal is closed and then opens it for a new disc.
        propNewDiscName, propNewDiscManufacturer, propNewDiscType,
        propNewDiscPlastic, propNewDiscColor, propNewDiscStability // Changed from propNewDiscSpeed
    ]);


    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation: Disc Name and Manufacturer are required
        if (!name.trim() || !manufacturer.trim()) {
            alert("Disc Name and Manufacturer are required!");
            return;
        }

        // Validate disc stability if it's not empty, ensure it's a number
        if (stability && isNaN(Number(stability))) { // Changed from speed
            alert("Disc Stability must be a number!"); // Changed from Disc Speed
            return;
        }

        // Call the parent's onSubmit with the INTERNAL state values
        onSubmit(
            name,
            manufacturer,
            type,
            plastic,
            color,
            Number(stability) || null // Changed from speed
        );

        // The useEffect will handle clearing the state when the modal closes via onClose
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    {initialData ? 'Edit Disc' : 'Add New Disc'} {/* Dynamic title */}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="discName" className="block text-sm font-medium text-gray-700 mb-1">Disc Name (e.g., Destroyer)</label>
                        <input
                            type="text"
                            id="discName"
                            placeholder="Disc Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                            value={manufacturer}
                            onChange={(e) => setManufacturer(e.target.value)}
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="discType" className="block text-sm font-medium text-gray-700 mb-1">Disc Type</label>
                        <select
                            id="discType"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-white focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Select Type</option>
                            <option value="Distance Driver">Distance Driver</option>
                            <option value="Fairway Driver">Fairway Driver</option>
                            <option value="Midrange">Midrange</option>
                            <option value="Putt/Approach">Putt/Approach</option>
                            <option value="Hybrid">Hybrid</option>
                        </select>
                    </div>
                    {/* Input field for Plastic Type */}
                    <div>
                        <label htmlFor="discPlastic" className="block text-sm font-medium text-gray-700 mb-1">Plastic Type (e.g., Star, DX)</label>
                        <input
                            type="text"
                            id="discPlastic"
                            placeholder="Plastic Type (Optional)"
                            value={plastic}
                            onChange={(e) => setPlastic(e.target.value)}
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* Input field for Disc Color */}
                    <div>
                        <label htmlFor="discColor" className="block text-sm font-medium text-gray-700 mb-1">Disc Color (e.g., Blue, Red)</label>
                        <input
                            type="text"
                            id="discColor"
                            placeholder="Disc Color (Optional)"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {/* NEW: Input field for Disc Stability */}
                    <div>
                        <label htmlFor="discStability" className="block text-sm font-medium text-gray-700 mb-1">Disc Stability (e.g., 0, -1, 1)</label> {/* Updated label */}
                        <input
                            type="number" // Still a number, as stability ratings are numeric
                            id="discStability" // Updated ID
                            placeholder="Disc Stability (Optional)" // Updated placeholder
                            value={stability} // Using the new stability state
                            onChange={(e) => setStability(e.target.value)} // Using the new setStability
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            // You might want to adjust min/max values based on typical stability ratings
                            min="-5" // Common range for stability (understable to overstable)
                            max="5"
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
                            className="!bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold transition-colors"
                        >
                            {initialData ? 'Update Disc' : 'Add Disc'} {/* Dynamic button text */}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}