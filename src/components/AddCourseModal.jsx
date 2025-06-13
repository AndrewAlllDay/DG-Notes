// src/components/AddCourseModal.jsx

import React from 'react';

export default function AddCourseModal({
    isOpen,
    onClose,
    onSubmit,
    newCourseName,
    setNewCourseName,
    newTournamentName, // <--- ACCEPT NEW PROP
    setNewTournamentName, // <--- ACCEPT NEW PROP
}) {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newCourseName.trim()) {
            onSubmit(newCourseName, newTournamentName); // <--- PASS BOTH VALUES
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-80">
                <h3 className="text-lg font-bold mb-4">Add New Course</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="courseName" className="block text-gray-700 text-sm font-bold mb-2">
                            Course Name:
                        </label>
                        <input
                            type="text"
                            id="courseName"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={newCourseName}
                            onChange={(e) => setNewCourseName(e.target.value)}
                            required
                        />
                    </div>
                    {/* NEW INPUT FIELD FOR TOURNAMENT NAME */}
                    <div className="mb-4">
                        <label htmlFor="tournamentName" className="block text-gray-700 text-sm font-bold mb-2">
                            Upcoming Tournament:
                        </label>
                        <input
                            type="text"
                            id="tournamentName"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={newTournamentName}
                            onChange={(e) => setNewTournamentName(e.target.value)}
                        // This field is optional, so no 'required' attribute
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="!bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Add Course
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-700 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}