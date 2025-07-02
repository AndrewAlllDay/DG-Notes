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
    setNewDiscName: setPropNewDiscName,
    newDiscManufacturer: propNewDiscManufacturer,
    setNewDiscManufacturer: setPropNewDiscManufacturer,
    newDiscType: propNewDiscType,
    setNewDiscType: setPropNewDiscType,
    newDiscPlastic: propNewDiscPlastic,
    setNewDiscPlastic: setPropNewDiscPlastic,
    newDiscColor: propNewDiscColor,
    setNewDiscColor: setPropNewDiscColor,
    newDiscSpeed: propNewDiscSpeed,
    setNewDiscSpeed: setPropNewDiscSpeed,
}) {
    // INTERNAL STATE for form fields
    const [name, setName] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [type, setType] = useState('');
    const [plastic, setPlastic] = useState('');
    const [color, setColor] = useState('');
    const [speed, setSpeed] = useState(''); // Internal state for speed

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
                // Crucial for speed: convert to string and handle undefined/null
                setSpeed(initialData.speed !== undefined && initialData.speed !== null ? String(initialData.speed) : '');
            } else {
                // ADD MODE: Optionally use parent's newDisc... props or clear
                // If the parent explicitly passes blank values for a new disc, use them.
                // Otherwise, ensure they are cleared.
                setName(propNewDiscName || '');
                setManufacturer(propNewDiscManufacturer || '');
                setType(propNewDiscType || '');
                setPlastic(propNewDiscPlastic || '');
                setColor(propNewDiscColor || '');
                setSpeed(propNewDiscSpeed || '');
            }
        } else {
            // When modal closes, reset internal form state
            setName('');
            setManufacturer('');
            setType('');
            setPlastic('');
            setColor('');
            setSpeed('');
        }
    }, [
        isOpen,
        initialData,
        // Include propNewDisc... values as dependencies in case the parent updates them
        // while the modal is closed and then opens it for a new disc.
        propNewDiscName, propNewDiscManufacturer, propNewDiscType,
        propNewDiscPlastic, propNewDiscColor, propNewDiscSpeed
    ]);


    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation: Disc Name and Manufacturer are required
        if (!name.trim() || !manufacturer.trim()) {
            alert("Disc Name and Manufacturer are required!");
            return;
        }

        // Validate disc speed if it's not empty, ensure it's a number
        if (speed && isNaN(Number(speed))) {
            alert("Disc Speed must be a number!");
            return;
        }

        // Call the parent's onSubmit with the INTERNAL state values
        onSubmit(
            name,
            manufacturer,
            type,
            plastic,
            color,
            Number(speed) || null // Pass speed as a number, or null if empty/invalid
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
                    {/* NEW: Input field for Disc Speed */}
                    <div>
                        <label htmlFor="discSpeed" className="block text-sm font-medium text-gray-700 mb-1">Disc Speed (e.g., 12)</label>
                        <input
                            type="number"
                            id="discSpeed"
                            placeholder="Disc Speed (Optional)"
                            value={speed}
                            onChange={(e) => setSpeed(e.target.value)}
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                            max="15"
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