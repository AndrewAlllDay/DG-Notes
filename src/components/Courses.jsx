import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';  // Pencil icon

export default function Courses() {
    const [courses, setCourses] = useState(() => {
        const saved = localStorage.getItem('courses');
        return saved ? JSON.parse(saved) : [];
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);

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

    const addHole = (holeNumber, holePar, holeNote) => {
        if (!holeNumber.trim() || !holePar.trim()) return;
        const newHole = { id: Date.now(), number: holeNumber, par: holePar, note: holeNote || '', editing: false };
        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedHoles = [...(course.holes || []), newHole];
                return { ...course, holes: updatedHoles };
            }
            return course;
        });
        setCourses(updatedCourses);
        setSelectedCourse(prev => ({
            ...prev,
            holes: [...(prev.holes || []), newHole],
        }));
    };

    const updateHole = (holeId, updatedHole) => {
        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedHoles = course.holes.map(hole => {
                    if (hole.id === holeId) {
                        return { ...hole, ...updatedHole, editing: false };
                    }
                    return hole;
                });
                return { ...course, holes: updatedHoles };
            }
            return course;
        });
        setCourses(updatedCourses);
        setSelectedCourse(prev => ({
            ...prev,
            holes: prev.holes.map(hole =>
                hole.id === holeId ? { ...hole, ...updatedHole, editing: false } : hole
            ),
        }));
    };

    const toggleEditing = (holeId) => {
        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedHoles = course.holes.map(hole => {
                    if (hole.id === holeId) {
                        return { ...hole, editing: !hole.editing }; // Toggle editing state
                    }
                    return hole;
                });
                return { ...course, holes: updatedHoles };
            }
            return course;
        });
        setCourses(updatedCourses);
        setSelectedCourse(prev => ({
            ...prev,
            holes: prev.holes.map(hole =>
                hole.id === holeId ? { ...hole, editing: !hole.editing } : hole
            ),
        }));
    };

    const backToList = () => {
        setSelectedCourse(null);
    };

    if (selectedCourse) {
        return (
            <div className="relative min-h-screen bg-gray-100 p-4">
                <button onClick={backToList} className="mb-4 text-blue-600 underline">
                    ← Back to Courses
                </button>
                <h2 className="text-2xl font-bold mb-4 text-center pt-5">{selectedCourse.name} - Holes</h2>
                <ul>
                    {(selectedCourse.holes || []).length === 0 && <li>No holes added yet.</li>}
                    {(selectedCourse.holes || []).map(hole => (
                        <li key={hole.id} className="mb-4 border rounded p-4 bg-white flex justify-between items-center">
                            <div className="flex-grow">
                                {hole.editing ? (
                                    <div>
                                        <input
                                            type="number"
                                            value={hole.number}
                                            onChange={(e) => updateHole(hole.id, { number: e.target.value })}
                                            className="w-full mt-2 p-2 border rounded"
                                        />
                                        <input
                                            type="number"
                                            value={hole.par}
                                            onChange={(e) => updateHole(hole.id, { par: e.target.value })}
                                            className="w-full mt-2 p-2 border rounded"
                                        />
                                        <textarea
                                            value={hole.note}
                                            onChange={(e) => updateHole(hole.id, { note: e.target.value })}
                                            className="w-full mt-2 p-2 border rounded"
                                        />
                                        <button
                                            onClick={() => updateHole(hole.id, hole)}
                                            className="bg-blue-600 text-white py-1 px-4 mt-2 rounded"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <p>Hole {hole.number} - Par {hole.par}</p>
                                        <p>{hole.note || 'No note added yet.'}</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => toggleEditing(hole.id)}
                                className="text-gray-500 hover:text-gray-700 ml-4"
                                aria-label="Edit Hole"
                            >
                                <Edit size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
                <AddHoleForm onAddHole={addHole} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center pt-5">Disc Golf Courses</h2>

            {/* 🔘 Floating Action Button (FAB) */}
            <button
                onClick={openModal}
                className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50"
                aria-label="Add Course"
            >
                <span className="text-2xl">＋</span>
            </button>

            {/* 🧾 Modal for Add Course Form */}
            {isModalOpen && (
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
                                    onClick={closeModal}
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
            )}

            <ul className="space-y-4 mt-6">
                {courses.length === 0 ? (
                    <li>No courses added yet.</li>
                ) : (
                    courses.map(course => (
                        <li
                            key={course.id}
                            className="mb-4 border rounded p-4 bg-white cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedCourse(course)}
                        >
                            {course.name}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}

// AddHoleForm component definition

function AddHoleForm({ onAddHole }) {
    const [holeNumber, setHoleNumber] = useState('');
    const [holePar, setHolePar] = useState('');
    const [holeNote, setHoleNote] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddHole(holeNumber, holePar, holeNote);
        setHoleNumber('');
        setHolePar('');
        setHoleNote('');
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 max-w-xs mx-auto space-y-2">
            <input
                type="number"



                ChatGPT said:placeholder="Hole Number"
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
            <textarea
                placeholder="Add a note"
                value={holeNote}
                onChange={(e) => setHoleNote(e.target.value)}
                className="w-full border rounded px-3 py-2"
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" >
                Add Hole
            </button>
        </form>
    );
}