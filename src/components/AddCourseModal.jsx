// src/components/AddCourseModal.jsx

import React from 'react'; // Removed useState as props now manage state
import { X } from 'lucide-react';

export default function AddCourseModal({
    isOpen,
    onClose,
    onAddCourse,
    // --- NEW PROPS ACCEPTED HERE ---
    newCourseName,
    setNewCourseName,
    newCourseTournamentName,
    setNewCourseTournamentName,
    // --- END NEW PROPS ---
}) {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        // Trim inputs and check for minimum requirements
        if (!newCourseName.trim()) { // Use newCourseName directly from props
            alert("Course name cannot be empty.");
            return;
        }
        onAddCourse(newCourseName.trim(), newCourseTournamentName.trim()); // Use props directly
        // The parent (Courses.jsx) will handle clearing the state after adding
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-auto relative animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Add New Course</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">Course Name</label>
                        <input
                            type="text"
                            id="courseName"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={newCourseName} // Use prop value
                            onChange={(e) => setNewCourseName(e.target.value)} // Use prop setter
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="tournamentName" className="block text-sm font-medium text-gray-700">Tournament Name (Optional)</label>
                        <input
                            type="text"
                            id="tournamentName"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={newCourseTournamentName} // Use prop value
                            onChange={(e) => setNewCourseTournamentName(e.target.value)} // Use prop setter
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Add Course
                    </button>
                </form>
            </div>
        </div>
    );
}