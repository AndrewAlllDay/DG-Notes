// src/components/Courses.jsx

import React, { useState, useEffect, useRef } from 'react';
import CourseList from './CourseList';
import HoleList from './HoleList';
import AddCourseModal from './AddCourseModal';
import AddHoleModal from './AddHoleModal';

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

    const swipeRefs = useRef({});

    useEffect(() => {
        localStorage.setItem('courses', JSON.stringify(courses));
    }, [courses]);

    // --- REVISED SWIPE HANDLING FUNCTIONS WITH DEBUGGING LOGS ---
    const handleTouchStart = (e, id) => {
        console.log(`[TOUCH START] ID: ${id}`);
        // Store initial touch position and ensure currentX is reset for new swipe
        swipeRefs.current[id] = { startX: e.touches[0].clientX, currentX: 0 };

        // If another course was swiped open, close it cleanly
        if (swipedCourseId && swipedCourseId !== id) {
            console.log(`[TOUCH START] Closing previous swiped item: ${swipedCourseId}`);
            setSwipedCourseId(null);
        }

        // Ensure the current element has transition enabled, then disable for current drag
        const el = document.getElementById(`course-${id}`);
        if (el) {
            console.log(`[TOUCH START] Setting transition to ease for ID: ${id}`);
            el.style.transition = 'transform 0.3s ease';
            // Delay to ensure transition property is applied before immediately setting to 'none'
            // This can prevent flicker if a previous snap-back was still transitioning
            setTimeout(() => {
                if (el && swipeRefs.current[id]) { // Check if element and ref still exist
                    console.log(`[TOUCH START] Setting transition to none for ID: ${id}`);
                    el.style.transition = 'none'; // Disable transition during drag
                }
            }, 0);
        } else {
            console.error(`[TOUCH START] Element not found for ID: ${id}`);
        }
    };

    const handleTouchMove = (e, id) => {
        const swipeRef = swipeRefs.current[id];
        if (!swipeRef) {
            // This can happen if touchstart didn't register or swipeRefs.current[id] was cleared
            console.warn(`[TOUCH MOVE] No swipeRef for ID: ${id}. TouchStart may not have fired.`);
            return;
        }

        const deltaX = e.touches[0].clientX - swipeRef.startX;
        const el = document.getElementById(`course-${id}`);
        if (!el) {
            console.error(`[TOUCH MOVE] Element not found for ID: ${id}`);
            return;
        }

        // Clamp deltaX to prevent dragging too far right (0px) or too far left (-80px)
        const transformX = Math.max(-80, Math.min(0, deltaX));

        // Apply transform directly for a smooth, real-time dragging effect
        el.style.transform = `translateX(${transformX}px)`;
        // Ensure transition is off during the drag
        el.style.transition = 'none';

        swipeRef.currentX = transformX;
        console.log(`[TOUCH MOVE] ID: ${id}, deltaX: ${deltaX}, transformX: ${transformX}`);
    };

    const handleTouchEnd = (id) => {
        const swipeRef = swipeRefs.current[id];
        if (!swipeRef) {
            console.warn(`[TOUCH END] No swipeRef for ID: ${id}. TouchStart/Move may not have fired or ref cleared.`);
            return;
        }

        const el = document.getElementById(`course-${id}`);
        if (!el) {
            console.error(`[TOUCH END] Element not found for ID: ${id}`);
            return;
        }

        console.log(`[TOUCH END] Re-enabling transition for ID: ${id}`);
        el.style.transition = 'transform 0.5s ease';

        // Decide the final state based on how far the element was dragged
        if (swipeRef.currentX <= -40) {
            console.log(`[TOUCH END] Swiped past threshold. Setting swipedCourseId to: ${id}`);
            setSwipedCourseId(id); // Set the state to open this item
        } else {
            console.log(`[TOUCH END] Not swiped past threshold. Setting swipedCourseId to: null`);
            setSwipedCourseId(null); // Snap back to closed position
        }

        // Clear the touch data for this item
        swipeRefs.current[id] = null;
        console.log(`[TOUCH END] Cleared swipeRef for ID: ${id}`);
    };

    // --- Course Management Functions (No Changes) ---
    const handleAddCourse = (courseName) => {
        const defaultHoles = Array.from({ length: 18 }, (_, index) => ({
            id: Date.now() + index,
            number: (index + 1).toString(),
            par: '3',
            note: '',
            editing: false,
        }));
        setCourses([...courses, { id: Date.now(), name: courseName, holes: defaultHoles }]);
        setIsAddCourseModalOpen(false);
        setNewCourseName('');
    };

    const handleDeleteCourse = (id) => {
        setCourses(courses.filter((course) => course.id !== id));
        if (swipedCourseId === id) setSwipedCourseId(null);
    };

    const handleAddHole = (holeNumber, holePar, holeNote) => {
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

    const handleToggleEditingHole = (holeId) => {
        const holeToEdit = selectedCourse.holes.find((h) => h.id === holeId);
        if (holeToEdit) {
            setEditingHoleData({
                number: holeToEdit.number,
                par: holeToEdit.par,
                note: holeToEdit.note,
            });
        }
        setCourses((prevCourses) =>
            prevCourses.map((course) => {
                if (course.id === selectedCourse.id) {
                    const updatedHoles = course.holes.map((hole) => ({
                        ...hole,
                        editing: hole.id === holeId ? !hole.editing : false,
                    }));
                    return { ...course, holes: updatedHoles };
                }
                return course;
            })
        );
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
                                editing: false,
                            }
                            : hole
                    );
                    return { ...course, holes: updatedHoles };
                }
                return course;
            })
        );
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

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index) {
            return;
        }
        const currentHoles = Array.from(selectedCourse.holes);
        const [reorderedHole] = currentHoles.splice(source.index, 1);
        currentHoles.splice(destination.index, 0, reorderedHole);
        setCourses((prevCourses) =>
            prevCourses.map((course) =>
                course.id === selectedCourse.id
                    ? { ...course, holes: currentHoles }
                    : course
            )
        );
        setSelectedCourse((prev) => ({
            ...prev,
            holes: currentHoles,
        }));
    };

    // --- Conditional Rendering for Course List vs. Hole List (No Changes) ---
    if (selectedCourse) {
        return (
            <div className="relative min-h-screen bg-gray-100 p-4">
                <button onClick={backToList} className="mb-4 px-3 py-1 border border-black text-black rounded hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200">
                    ← Back to Courses
                </button>
                <h2 className="text-2xl font-bold mb-4 text-center pt-5">
                    {selectedCourse.name} - Holes
                </h2>
                <HoleList
                    holes={selectedCourse.holes || []}
                    editingHoleData={editingHoleData}
                    setEditingHoleData={setEditingHoleData}
                    toggleEditing={handleToggleEditingHole}
                    saveHoleChanges={handleSaveHoleChanges}
                    onDragEnd={onDragEnd}
                />
                <button
                    onClick={() => setIsAddHoleModalOpen(true)}
                    className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50"
                    aria-label="Add Hole"
                >
                    ＋
                </button>
                <AddHoleModal
                    isOpen={isAddHoleModalOpen}
                    onClose={() => setIsAddHoleModalOpen(false)}
                    onAddHole={handleAddHole}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center pt-5">DG Courses</h2>
            <p className='text-center mb-4'>This is a list of courses that you've taken notes for.</p>
            {/* The Export All Data button has been removed from here */}
            <button
                onClick={() => setIsAddCourseModalOpen(true)}
                className="fab-fix fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50"
                aria-label="Add Course"
            >
                <span className="text-2xl">＋</span>
            </button>
            <AddCourseModal
                isOpen={isAddCourseModalOpen}
                onClose={() => setIsAddCourseModalOpen(false)}
                onSubmit={handleAddCourse}
                newCourseName={newCourseName}
                setNewCourseName={setNewCourseName}
            />
            <CourseList
                courses={courses}
                setSelectedCourse={setSelectedCourse}
                deleteCourse={handleDeleteCourse}
                swipedCourseId={swipedCourseId}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
            />
        </div>
    );
}