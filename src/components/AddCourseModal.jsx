import React from 'react';

export default function AddCourseModal({ isOpen, onClose, onSubmit, newCourseName, setNewCourseName }) {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newCourseName.trim()) return;
        onSubmit(newCourseName);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
                <h3 className="text-xl font-semibold mb-4">Add New Course</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Course Name"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        required
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Add Course
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}