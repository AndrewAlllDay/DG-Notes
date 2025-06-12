import React, { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

export default function Courses() {
    const [courses, setCourses] = useState(() => {
        const saved = localStorage.getItem('courses');
        return saved ? JSON.parse(saved) : [];
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editingHoleData, setEditingHoleData] = useState({});
    const [confirmDelete, setConfirmDelete] = useState({ open: false, course: null });

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

    const toggleEditing = (holeId) => {
        const holeToEdit = selectedCourse.holes.find(h => h.id === holeId);
        setEditingHoleData({
            number: holeToEdit.number,
            par: holeToEdit.par,
            note: holeToEdit.note
        });

        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedHoles = course.holes.map(hole => {
                    if (hole.id === holeId) {
                        return { ...hole, editing: !hole.editing };
                    }
                    return { ...hole, editing: false };
                });
                return { ...course, holes: updatedHoles };
            }
            return course;
        });
        setCourses(updatedCourses);

        setSelectedCourse(prev => ({
            ...prev,
            holes: prev.holes.map(hole =>
                hole.id === holeId
                    ? { ...hole, editing: !hole.editing }
                    : { ...hole, editing: false }
            ),
        }));
    };

    const saveHoleChanges = (holeId) => {
        const updatedCourses = courses.map(course => {
            if (course.id === selectedCourse.id) {
                const updatedHoles = course.holes.map(hole =>
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
        setSelectedCourse(prev => ({
            ...prev,
            holes: prev.holes.map(hole =>
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

    const backToList = () => {
        setSelectedCourse(null);
    };

    const confirmDeleteCourse = (course) => {
        setConfirmDelete({ open: true, course });
    };

    const cancelDelete = () => {
        setConfirmDelete({ open: false, course: null });
    };

    const deleteCourse = () => {
        if (!confirmDelete.course) return;
        setCourses(courses.filter(c => c.id !== confirmDelete.course.id));
        setConfirmDelete({ open: false, course: null });
        if (selectedCourse && selectedCourse.id === confirmDelete.course.id) {
            setSelectedCourse(null);
        }
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
                        <li key={hole.id} className="mb-4 border rounded p-4 bg-white flex justify-between items-start">
                            <div className="flex-grow">
                                {hole.editing ? (
                                    <div className="space-y-2">
                                        <input
                                            type="number"
                                            value={editingHoleData.number}
                                            onChange={(e) => setEditingHoleData(prev => ({ ...prev, number: e.target.value }))}
                                            className="w-full mt-2 p-2 border rounded"
                                        />
                                        <input
                                            type="number"
                                            value={editingHoleData.par}
                                            onChange={(e) => setEditingHoleData(prev => ({ ...prev, par: e.target.value }))}
                                            className="w-full mt-2 p-2 border rounded"
                                        />
                                        <textarea
                                            value={editingHoleData.note}
                                            onChange={(e) => setEditingHoleData(prev => ({ ...prev, note: e.target.value }))}
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
                                        <p>Hole {hole.number} - Par {hole.par}</p>
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

            {/* Floating Action Button (FAB) */}
            <button
                onClick={openModal}
                className="fab-fix fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50"
                aria-label="Add Course"
            >
                <span className="text-2xl fab-fix">＋</span>
            </button>

            {/* Modal for Add Course Form */}
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
                                    className="btn-fix bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    Add Course
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List of courses with swipe-to-delete */}
            <ul className="space-y-4 mt-6 max-w-md mx-auto">
                {courses.length === 0 ? (
                    <li>No courses added yet.</li>
                ) : (
                    courses.map((course) => (
                        <CourseItem
                            key={course.id}
                            course={course}
                            onSelect={() => setSelectedCourse(course)}
                            onDelete={() => confirmDeleteCourse(course)}
                        />
                    ))
                )}
            </ul>

            {/* Custom Delete Confirmation Modal */}
            {confirmDelete.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-60">
                    <div className="bg-white rounded-lg p-6 w-80 text-center shadow-lg">
                        <h3 className="text-lg font-semibold mb-4">Delete Course</h3>
                        <p className="mb-6">
                            Are you sure you want to delete <strong>{confirmDelete.course?.name}</strong>?
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteCourse}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CourseItem({ course, onSelect, onDelete }) {
    const [isSwiped, setIsSwiped] = useState(false);

    const handlers = useSwipeable({
        onSwipedLeft: () => setIsSwiped(true),
        onSwipedRight: () => setIsSwiped(false),
        preventDefaultTouchmoveEvent: true,
        trackMouse: true,
    });

    return (
        <li {...handlers} className="relative overflow-hidden bg-white rounded shadow-md max-w-md mx-auto">
            {/* Delete button behind */}
            <button
                onClick={onDelete}
                className="absolute top-0 right-0 h-full bg-red-600 text-white px-6 flex items-center justify-center font-semibold select-none"
                style={{ width: '100px', zIndex: 0 }}
            >
                Delete
            </button>

            {/* Sliding content */}
            <div
                onClick={() => !isSwiped && onSelect()}
                className={`p-4 cursor-pointer select-none transition-transform duration-300 ease-in-out`}
                style={{
                    transform: isSwiped ? 'translateX(-100px)' : 'translateX(0)'
                }}
            >
                {course.name}
            </div>
        </li>
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
            <button type="submit" className="btn-fix w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Add Hole
            </button>
        </form>
    );
}
