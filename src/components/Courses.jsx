import React, { useState, useEffect } from 'react';

export default function Courses() {
    const [courses, setCourses] = useState(() => {
        const saved = localStorage.getItem('courses');
        return saved ? JSON.parse(saved) : [];
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null); // NEW: track selected course for detail view

    useEffect(() => {
        localStorage.setItem('courses', JSON.stringify(courses));
    }, [courses]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setNewCourseName('');
        setIsModalOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newCourseName.trim()) return;
        setCourses([...courses, { id: Date.now(), name: newCourseName, holes: [] }]);
        closeModal();
    };

    // NEW: Handler to add holes inside selected course
    const addHole = (holeNumber, holePar) => {
        if (!holeNumber.trim() || !holePar.trim()) return;
        const newHole = { id: Date.now(), number: holeNumber, par: holePar };
        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedHoles = [...(course.holes || []), newHole];
                return { ...course, holes: updatedHoles };
            }
            return course;
        });
        setCourses(updatedCourses);
        // update selectedCourse state with holes too
        setSelectedCourse(prev => ({
            ...prev,
            holes: [...(prev.holes || []), newHole],
        }));
    };

    // NEW: Back button handler to leave detail view
    const backToList = () => {
        setSelectedCourse(null);
    };

    // === RENDERING ===

    // If a course is selected, show detail view
    if (selectedCourse) {
        return (
            <div className="relative min-h-screen bg-gray-100 p-4">
                <button
                    onClick={backToList}
                    className="mb-4 text-blue-600 underline"
                >
                    ← Back to Courses
                </button>
                <h2 className="text-2xl font-bold mb-4 text-center pt-5">
                    {selectedCourse.name} - Holes
                </h2>
                <ul>
                    {(selectedCourse.holes || []).length === 0 && <li>No holes added yet.</li>}
                    {(selectedCourse.holes || []).map(hole => (
                        <li
                            key={hole.id}
                            className="mb-2 border rounded p-2 bg-white"
                        >
                            Hole {hole.number} - Par {hole.par}
                        </li>
                    ))}
                </ul>

                {/* Simple add hole form */}
                <AddHoleForm onAddHole={addHole} />
            </div>
        );
    }

    // Otherwise, show course list view with FAB and modal (your existing UI)
    return (
        <div className="relative min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center pt-5">Disc Golf Courses</h2>

            {/* Course List */}
            <ul>
                {courses.length === 0 && <li>No courses added yet.</li>}
                {courses.map(course => (
                    <li
                        key={course.id}
                        className="mb-2 border rounded p-2 bg-white cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedCourse(course)} // NEW: select course on click
                    >
                        {course.name}
                    </li>
                ))}
            </ul>

            {/* Floating Action Button */}
            <button
                onClick={openModal}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white text-3xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
                aria-label="Add new course"
            >
                +
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80 max-w-full">
                        <h2 className="text-xl font-semibold mb-4">Add New Course</h2>
                        <form onSubmit={handleSubmit}>
                            <label className="block mb-2 font-medium" htmlFor="courseName">
                                Course Name
                            </label>
                            <input
                                id="courseName"
                                type="text"
                                value={newCourseName}
                                onChange={(e) => setNewCourseName(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper component for adding holes
function AddHoleForm({ onAddHole }) {
    const [holeNumber, setHoleNumber] = useState('');
    const [holePar, setHolePar] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddHole(holeNumber, holePar);
        setHoleNumber('');
        setHolePar('');
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 max-w-xs mx-auto space-y-2">
            <input
                type="number"
                placeholder="Hole Number"
                value={holeNumber}
                onChange={(e) => setHoleNumber(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
            />
            <input
                type="number"
                placeholder="Par"
                value={holePar}
                onChange={(e) => setHolePar(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
            />
            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
                Add Hole
            </button>
        </form>
    );
}
