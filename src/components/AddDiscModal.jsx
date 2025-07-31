import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export default function AddDiscModal({
    isOpen,
    onClose,
    onSubmit,
    initialData = null,
    discTypes = [],
}) {
    // Internal state for the form fields that the user can edit
    const [color, setColor] = useState('');
    const [type, setType] = useState('');

    // Determine the mode based on the presence of an ID in the initial data
    const isEditing = initialData && initialData.id;

    // This effect synchronizes the modal's state with the data passed to it
    useEffect(() => {
        if (isOpen && initialData) {
            // When editing or adding, pre-fill the editable fields
            setColor(initialData.color || '');
            setType(initialData.type || '');
        } else {
            // When the modal closes, reset the fields
            setColor('');
            setType('');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // The data that will be passed back to the parent component
        const submittedData = {
            name: initialData.name,
            manufacturer: initialData.manufacturer,
            type: type,
            speed: initialData.speed ?? null,
            glide: initialData.glide ?? null,
            turn: initialData.turn ?? null,
            fade: initialData.fade ?? null,
            stability: initialData.stability ?? null,
            plastic: initialData.plastic || '',
            color: color.trim(),
        };

        onSubmit(submittedData);
    };

    const modalTitle = isEditing ? 'Edit Your Disc' : 'Add Your Disc Details';

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-xl font-bold text-gray-800 dark:text-white">{modalTitle}</Dialog.Title>
                        <Dialog.Close asChild>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close">
                                <X size={20} />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Non-Editable Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Disc</label>
                            <p className="w-full border rounded px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {initialData?.manufacturer} {initialData?.name}
                            </p>
                        </div>

                        {/* Editable dropdown for Disc Type */}
                        <div>
                            <label htmlFor="discType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disc Type</label>
                            <select
                                id="discType"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a Type</option>
                                {discTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                                {!discTypes.includes('Other') && <option value="Other">Other</option>}
                            </select>
                        </div>

                        {/* Editable Fields for User Details */}
                        <div>
                            <label htmlFor="discColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disc Color (e.g., Blue, Red)</label>
                            <input
                                type="text"
                                id="discColor"
                                placeholder="Disc Color (Optional)"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
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
                                {isEditing ? 'Update Disc' : 'Add Disc to Bag'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}