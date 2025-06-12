import React, { useState, useEffect, useRef } from 'react';
import { Edit, Trash } from 'lucide-react';

export default function Courses() {
    const [courses, setCourses] = useState(() => {
        const saved = localStorage.getItem('courses');
        return saved ? JSON.parse(saved) : [];
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editingHoleData, setEditingHoleData] = useState({});
    const [swipedCourseId, setSwipedCourseId] = useState(null);
    const swipeRefs = useRef({});

    useEffect(() => {
        localStorage.setItem('courses', JSON.stringify(courses));
    }, [courses]);

    // Modal handlers
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

    // Delete course
    const deleteCourse = (e, id) => {
        e.stopPropagation();
        setCourses(courses.filter((course) => course.id !== id));
        if (swipedCourseId === id) setSwipedCourseId(null);
    };

    // Hole-related functions unchanged
    const addHole = (holeNumber, holePar, holeNote) => {
        if (!holeNumber.trim() || !holePar.trim()) return;
        const newHole = {
            id: Date.now(),
            number: holeNumber,
            par: holePar,
            note: holeNote || '',
            editing: false,
        };
        const updatedCourses = courses.map((course) => {
            if (course.id === selectedCourse.id) {
                return { ...course, holes: [...(course.holes || []), newHole] };
            }
            return course;
        });
        setCourses(updatedCourses);
        setSelectedCourse((prev) => ({
            ...prev,
            holes: [...(prev.holes || []), newHole],
        }));
    };

    const toggleEditing = (holeId) => {
        const holeToEdit = selectedCourse.holes.find((h) => h.id === holeId);
        setEditingHoleData({
            number: holeToEdit.number,
            par: holeToEdit.par,
            note: holeToEdit.note,
        });

        const updatedCourses = courses.map((course) => {
            if (course.id === selectedCourse.id) {
                const updatedHoles = course.holes.map((hole) => ({
                    ...hole,
                    editing: hole.id === holeId ? !hole.editing : false,
                }));
                return { ...course, holes: updatedHoles };
            }
            return course;
        });
        setCourses(updatedCourses);

        setSelectedCourse((prev) => ({
            ...prev,
            holes: prev.holes.map((hole) =>
                hole.id === holeId
                    ? { ...hole, editing: !hole.editing }
                    : { ...hole, editing: false }
            ),
        }));
    };

    const saveHoleChanges = (holeId) => {
        const updatedCourses = courses.map((course) => {
            if (course.id === selectedCourse.id) {
                const updatedHoles = course.holes.map((hole) =>
                    hole.id === holeId
                        ? {
                            ...hole,
                            number: editingHoleData.number,
                            par: editingHoleData.par,
                            note: editingHoleData.note,
                            editing: false,
                        }
                        : hole
                );
                return { ...course, holes: updatedHoles };
            }
            return course;
        });

        setCourses(updatedCourses);
        setSelectedCourse((prev) => ({
            ...prev,
            holes: prev.holes.map((hole) =>
                hole.id === holeId
                    ? {
                        ...hole,
                        number: editingHoleData.number,
                        par: editingHoleData.par,
                        note: editingHoleData.note,
                        editing: false,
                    }
                    : hole
            ),
        }));
        setEditingHoleData({});
    };

    const backToList = () => setSelectedCourse(null);

    // Swipe handlers
    const handleTouchStart = (e, id) => {
        swipeRefs.current[id] = { startX: e.touches[0].clientX };

        // Close any other open swipe
        if (swipedCourseId && swipedCourseId !== id) {
            const prevEl = document.getElementById(`course-${swipedCourseId}`);
            if (prevEl) {
                prevEl.style.transition = 'transform 0.3s ease';
                prevEl.style.transform = 'translateX(0)';
            }
            setSwipedCourseId(null);
        }
    };

    const handleTouchMove = (e, id) => {
        if (!swipeRefs.current[id]) return;

        const deltaX = e.touches[0].clientX - swipeRefs.current[id].startX;
        const el = document.getElementById(`course-${id}`);
        if (!el) return;

        if (deltaX < -30) {
            // Swipe left to open
            el.style.transition = 'transform 0.3s ease';
            el.style.transform = 'translateX(-80px)';
            setSwipedCourseId(id);
        } else if (deltaX > 30) {
            // Swipe right to close
            el.style.transition = 'transform 0.3s ease';
            el.style.transform = 'translateX(0)';
            setSwipedCourseId(null);
        }
    };

    const handleTouchEnd = (id) => {
        const el = document.getElementById(`course-${id}`);
        if (!el) return;

        if (swipedCourseId === id) {
            // Keep open
            el.style.transition = 'transform 0.3s ease';
            el.style.transform = 'translateX(-80px)';
        } else {
            // Close
            el.style.transition = 'transform 0.3s ease';
            el.style.transform = 'translateX(0)';
        }

        swipeRefs.current[id] = null;
    };

    // Clean up transition style after animation ends to avoid interference
    useEffect(() => {
        const cleanupFns = [];
        courses.forEach((course) => {
            const el = document.getElementById(`course-${course.id}`);
            if (!el) return;
            const onTransitionEnd = () => {
                el.style.transition = '';
            };
            el.addEventListener('transitionend', onTransitionEnd);
            cleanupFns.push(() => el.removeEventListener('transitionend', onTransitionEnd));
        });
        return () => cleanupFns.forEach((fn) => fn());
    }, [courses]);

    if (selectedCourse) {
        return (
            <div className="relative min-h-screen bg-gray-100 p-4">
                <button onClick={backToList} className="mb-4 text-blue-600 underline">
                    ← Back to Courses
                </button>
                <h2 className="text-2xl font-bold mb-4 text-center pt-5">
                    {selectedCourse.name} - Holes
                </h2>
                <ul>
                    {(selectedCourse.holes || []).length === 0 && <li>No holes added yet.</li>}
                    {(selectedCourse.holes || []).map((hole) => (
                        <li
                            key={hole.id}
                            className="mb-4 border rounded p-4 bg-white flex justify-between items-start"
                        >
                            <div className="flex-grow">
                                {hole.editing ? (
                                    <div className="space-y-2">
                                        <input
                                            type="number"
                                            value={editingHoleData.number}
                                            onChange={(e) =>
                                                setEditingHoleData((prev) => ({ ...prev, number: e.target.value }))
                                            }
                                            className="w-full mt-2 p-2 border rounded"
                                        />
                                        <input
                                            type="number"
                                            value={editingHoleData.par}
                                            onChange={(e) =>
                                                setEditingHoleData((prev) => ({ ...prev, par: e.target.value }))
                                            }
                                            className="w-full mt-2 p-2 border rounded"
                                        />
                                        <textarea
                                            value={editingHoleData.note}
                                            onChange={(e) =>
                                                setEditingHoleData((prev) => ({ ...prev, note: e.target.value }))
                                            }
                                            className="w-full mt-2 p-2 border rounded"
                                        />
                                        <button
                                            onClick={() => saveHoleChanges(hole.id)}
                                            className="bg-blue-600 text-white py-1 px-4 mt-2 rounded hover:bg-blue-700"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <p>
                                            Hole {hole.number} - Par {hole.par}
                                        </p>
                                        <p>{hole.note || 'No note added yet.'}</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => toggleEditing(hole.id)}
                                className="text-gray-500 hover:text-gray-700 ml-4 mt-1"
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

            {/* FAB */}
            <button
                onClick={openModal}
                className="fab-fix fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50"
                aria-label="Add Course"
            >
                <span className="text-2xl">＋</span>
            </button>

            {/* Modal */}
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
                    courses.map((course) => (
                        <li
                            key={course.id}
                            className="relative h-16 overflow-hidden select-none touch-pan-y"
                        >
                            {/* Delete Button */}
                            <button
                                onClick={(e) => deleteCourse(e, course.id)}
                                className="fab-fix absolute right-0 top-0 bottom-0 w-20 bg-red-600 text-white flex items-center justify-center z-0"
                                aria-label={`Delete ${course.name}`}
                            >
                                <Trash />
                            </button>

                            {/* Swipeable Course Name */}
                            <div
                                id={`course-${course.id}`}
                                className="absolute inset-0 bg-white border z-10 flex items-center px-4 cursor-pointer hover:bg-gray-50"
                                style={{
                                    transform: swipedCourseId === course.id ? 'translateX(-80px)' : 'translateX(0)',
                                    transition: 'transform 0.3s ease',
                                }}
                                onClick={() => {
                                    if (swipedCourseId === course.id) {
                                        // If open, close on tap
                                        setSwipedCourseId(null);
                                        return;
                                    }
                                    setSelectedCourse(course);
                                }}
                                onTouchStart={(e) => handleTouchStart(e, course.id)}
                                onTouchMove={(e) => handleTouchMove(e, course.id)}
                                onTouchEnd={() => handleTouchEnd(course.id)}
                            >
                                {course.name}
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}

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
                type="text"
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
            <textarea
                placeholder="Add a note"
                value={holeNote}
                onChange={(e) => setHoleNote(e.target.value)}
                className="w-full border rounded px-3 py-2"
            />
            <button
                type="submit"
                className="w-full btn-fix text-white py-2 rounded hover:bg-blue-700"
            >
                Add Hole
            </button>
        </form>
    );
}
