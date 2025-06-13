import React, { useState, useEffect, useRef } from 'react';
import CourseList from './CourseList';
import HoleList from './HoleList';
import AddCourseModal from './AddCourseModal';
import AddHoleModal from './AddHoleModal'; // This will wrap your AddHoleForm

export default function Courses() {
    const [courses, setCourses] = useState(() => {
        const saved = localStorage.getItem('courses');
        return saved ? JSON.parse(saved) : [];
    });
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editingHoleData, setEditingHoleData] = useState({});
    const [swipedCourseId, setSwipedCourseId] = useState(null);
    const [isAddHoleModalOpen, setIsAddHoleModalOpen] = useState(false);

    // This ref is still managed here as it holds state related to all course swipe gestures
    const swipeRefs = useRef({});

    // Effect to save courses to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('courses', JSON.stringify(courses));
    }, [courses]);

    // --- Course Management Functions ---

    const handleAddCourse = (courseName) => {
        // Generate 18 default holes for the new course
        const defaultHoles = Array.from({ length: 18 }, (_, index) => ({
            id: Date.now() + index, // Unique ID for each hole
            number: (index + 1).toString(), // Hole numbers 1 to 18
            par: '3', // Default par for all holes
            note: '', // No note by default
            editing: false, // Not in editing mode
        }));

        setCourses([...courses, { id: Date.now(), name: courseName, holes: defaultHoles }]);
        setIsAddCourseModalOpen(false);
        setNewCourseName(''); // Clear input after adding
    };

    const handleDeleteCourse = (id) => {
        setCourses(courses.filter((course) => course.id !== id));
        if (swipedCourseId === id) setSwipedCourseId(null); // Reset swiped state if deleted
    };

    // --- Hole Management Functions ---

    const handleAddHole = (holeNumber, holePar, holeNote) => {
        if (!holeNumber.trim() || !holePar.trim()) return; // Basic validation
        const newHole = {
            id: Date.now(),
            number: holeNumber,
            par: holePar,
            note: holeNote || '',
            editing: false,
        };

        const updatedCourses = courses.map((course) => {
            if (course.id === selectedCourse.id) {
                // Ensure holes array exists before spreading
                return { ...course, holes: [...(course.holes || []), newHole] };
            }
            return course;
        });
        setCourses(updatedCourses);

        // Also update the selectedCourse state immediately for UI responsiveness
        setSelectedCourse((prev) => ({
            ...prev,
            holes: [...(prev.holes || []), newHole],
        }));
    };

    const handleToggleEditingHole = (holeId) => {
        const holeToEdit = selectedCourse.holes.find((h) => h.id === holeId);
        if (holeToEdit) {
            setEditingHoleData({
                number: holeToEdit.number,
                par: holeToEdit.par,
                note: holeToEdit.note,
            });
        }

        // Update main courses state
        setCourses((prevCourses) =>
            prevCourses.map((course) => {
                if (course.id === selectedCourse.id) {
                    const updatedHoles = course.holes.map((hole) => ({
                        ...hole,
                        editing: hole.id === holeId ? !hole.editing : false, // Toggle editing for selected, false for others
                    }));
                    return { ...course, holes: updatedHoles };
                }
                return course;
            })
        );

        // Update selectedCourse state for immediate UI reflection
        setSelectedCourse((prev) => ({
            ...prev,
            holes: prev.holes.map((hole) =>
                hole.id === holeId
                    ? { ...hole, editing: !hole.editing }
                    : { ...hole, editing: false }
            ),
        }));
    };

    const handleSaveHoleChanges = (holeId) => {
        // Update main courses state
        setCourses((prevCourses) =>
            prevCourses.map((course) => {
                if (course.id === selectedCourse.id) {
                    const updatedHoles = course.holes.map((hole) =>
                        hole.id === holeId
                            ? {
                                ...hole,
                                number: editingHoleData.number,
                                par: editingHoleData.par,
                                note: editingHoleData.note,
                                editing: false, // Exit editing mode
                            }
                            : hole
                    );
                    return { ...course, holes: updatedHoles };
                }
                return course;
            })
        );

        // Update selectedCourse state for immediate UI reflection
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
        setEditingHoleData({}); // Clear editing data
    };

    const backToList = () => setSelectedCourse(null);

    // --- Swipe Handling Functions (for CourseList) ---
    // These functions are passed down to CourseList and CourseItem
    const handleTouchStart = (e, id) => {
        swipeRefs.current[id] = { startX: e.touches[0].clientX };
        // If another course is swiped open, close it
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

        if (deltaX < -30) { // Swiping left past a threshold
            el.style.transition = 'transform 0.3s ease';
            el.style.transform = 'translateX(-80px)'; // Expose delete button
            setSwipedCourseId(id);
        } else if (deltaX > 30) { // Swiping right past a threshold
            el.style.transition = 'transform 0.3s ease';
            el.style.transform = 'translateX(0)'; // Hide delete button
            setSwipedCourseId(null);
        }
    };

    const handleTouchEnd = (id) => {
        const el = document.getElementById(`course-${id}`);
        if (!el) return;
        el.style.transition = 'transform 0.3s ease'; // Ensure smooth transition on release
        // Keep swiped if it was opened, or close if it was partially opened and released
        el.style.transform = swipedCourseId === id ? 'translateX(-80px)' : 'translateX(0)';
        swipeRefs.current[id] = null; // Clear touch data
    };

    // Effect to remove transition styles after animation to prevent interference
    useEffect(() => {
        const cleanupFns = [];
        courses.forEach((course) => {
            const el = document.getElementById(`course-${course.id}`);
            if (!el) return;
            const onTransitionEnd = () => {
                el.style.transition = ''; // Remove transition style once animation completes
            };
            el.addEventListener('transitionend', onTransitionEnd);
            cleanupFns.push(() => el.removeEventListener('transitionend', onTransitionEnd));
        });
        return () => cleanupFns.forEach((fn) => fn());
    }, [courses, swipedCourseId]); // Re-run if courses or swipedCourseId changes

    // --- Conditional Rendering for Course List vs. Hole List ---

    // If a course is selected, show its holes
    if (selectedCourse) {
        return (
            <div className="relative min-h-screen bg-gray-100 p-4">
                <button onClick={backToList} className="mb-4 text-blue-600 underline">
                    ← Back to Courses
                </button>
                <h2 className="text-2xl font-bold mb-4 text-center pt-5">
                    {selectedCourse.name} - Holes
                </h2>
                <HoleList
                    holes={selectedCourse.holes || []} // Ensure holes is an array
                    editingHoleData={editingHoleData}
                    setEditingHoleData={setEditingHoleData}
                    toggleEditing={handleToggleEditingHole}
                    saveHoleChanges={handleSaveHoleChanges}
                />

                {/* Floating Add Hole Button */}
                <button
                    onClick={() => setIsAddHoleModalOpen(true)}
                    className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50"
                    aria-label="Add Hole"
                >
                    ＋
                </button>

                {/* Add Hole Modal */}
                <AddHoleModal
                    isOpen={isAddHoleModalOpen}
                    onClose={() => setIsAddHoleModalOpen(false)}
                    onAddHole={handleAddHole}
                />
            </div>
        );
    }

    // Otherwise, show the list of courses
    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center pt-5">Disc Golf Courses</h2>

            {/* Floating Add Course Button */}
            <button
                onClick={() => setIsAddCourseModalOpen(true)}
                className="fab-fix fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50"
                aria-label="Add Course"
            >
                <span className="text-2xl">＋</span>
            </button>

            {/* Add Course Modal */}
            <AddCourseModal
                isOpen={isAddCourseModalOpen}
                onClose={() => setIsAddCourseModalOpen(false)}
                onSubmit={handleAddCourse}
                newCourseName={newCourseName}
                setNewCourseName={setNewCourseName}
            />

            {/* List of Courses */}
            <CourseList
                courses={courses}
                setSelectedCourse={setSelectedCourse}
                deleteCourse={handleDeleteCourse}
                swipedCourseId={swipedCourseId}
                setSwipedCourseId={setSwipedCourseId}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
            />
        </div>
    );
}