// src/components/Courses.jsx

import React, { useState, useEffect, useRef } from 'react';
import CourseList from './CourseList';
import HoleList from './HoleList';
import AddCourseModal from './AddCourseModal';
import AddHoleModal from './AddHoleModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function Courses() {
    const [courses, setCourses] = useState(() => {
        const saved = localStorage.getItem('courses');
        return saved ? JSON.parse(saved) : [];
    });
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseTournamentName, setNewCourseTournamentName] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editingHoleData, setEditingHoleData] = useState({});
    const [swipedCourseId, setSwipedCourseId] = useState(null);
    const [isAddHoleModalOpen, setIsAddHoleModalOpen] = useState(false);

    // State for delete confirmation modal
    const [isDeleteConfirmationModalOpen, setIsDeleteConfirmationModalOpen] = useState(false);
    const [holeToDeleteId, setHoleToDeleteId] = useState(null);

    const swipeRefs = useRef({});
    const holeListRef = useRef(null); // Ref for the HoleList container

    useEffect(() => {
        localStorage.setItem('courses', JSON.stringify(courses));
    }, [courses]);

    // Effect for click-outside detection when a course is selected
    useEffect(() => {
        function handleClickOutside(event) {
            // Only act if a course is selected and an edit is potentially open
            if (selectedCourse && holeListRef.current && !holeListRef.current.contains(event.target)) {
                // Check if the click was not on an editing hole or any related modal
                const isClickOnModal = event.target.closest('.modal-overlay') || event.target.closest('.modal-content');
                // Assuming HoleItem has a class 'HoleItem' or similar structure
                const isClickOnHoleItem = event.target.closest('.HoleItem') || event.target.closest('li.mb-4');

                // If not clicking inside hole list, and not clicking on a modal (AddHoleModal, DeleteConfirmationModal)
                // and not clicking on a HoleItem itself (to allow editing to happen),
                // then close all editing holes.
                if (!isClickOnModal && !isClickOnHoleItem) {
                    closeAllHoleEdits();
                }
            }
        }

        // Attach event listener only when a course is selected
        if (selectedCourse) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedCourse, courses]); // Depend on selectedCourse and courses to re-evaluate listener

    // Function to close all editing holes
    const closeAllHoleEdits = () => {
        if (!selectedCourse) return;

        setCourses(prevCourses => prevCourses.map(course => {
            if (course.id === selectedCourse.id) {
                return {
                    ...course,
                    holes: course.holes.map(hole => ({
                        ...hole,
                        editing: false // Set all holes to not editing
                    }))
                };
            }
            return course;
        }));
        setSelectedCourse(prev => ({
            ...prev,
            holes: prev.holes.map(hole => ({
                ...hole,
                editing: false // Set all holes to not editing in selectedCourse state
            }))
        }));
        setEditingHoleData({}); // Clear editing data
    };


    // --- REVISED SWIPE HANDLING FUNCTIONS WITH DEBUGGING LOGS ---
    const handleTouchStart = (e, id) => {
        console.log(`[TOUCH START] ID: ${id}`);
        swipeRefs.current[id] = { startX: e.touches[0].clientX, currentX: 0 };

        if (swipedCourseId && swipedCourseId !== id) {
            console.log(`[TOUCH START] Closing previous swiped item: ${swipedCourseId}`);
            setSwipedCourseId(null);
        }

        const el = document.getElementById(`course-${id}`);
        if (el) {
            console.log(`[TOUCH START] Setting transition to ease for ID: ${id}`);
            el.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                if (el && swipeRefs.current[id]) {
                    console.log(`[TOUCH START] Setting transition to none for ID: ${id}`);
                    el.style.transition = 'none';
                }
            }, 0);
        } else {
            console.error(`[TOUCH START] Element not found for ID: ${id}`);
        }
    };

    const handleTouchMove = (e, id) => {
        const swipeRef = swipeRefs.current[id];
        if (!swipeRef) {
            console.warn(`[TOUCH MOVE] No swipeRef for ID: ${id}. TouchStart may not have fired.`);
            return;
        }

        const deltaX = e.touches[0].clientX - swipeRef.startX;
        const el = document.getElementById(`course-${id}`);
        if (!el) {
            console.error(`[TOUCH MOVE] Element not found for ID: ${id}`);
            return;
        }

        const transformX = Math.max(-80, Math.min(0, deltaX));
        el.style.transform = `translateX(${transformX}px)`;
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

        if (swipeRef.currentX <= -40) {
            console.log(`[TOUCH END] Swiped past threshold. Setting swipedCourseId to: ${id}`);
            setSwipedCourseId(id);
        } else {
            console.log(`[TOUCH END] Not swiped past threshold. Setting swipedCourseId to: null`);
            setSwipedCourseId(null);
        }

        swipeRefs.current[id] = null;
        console.log(`[TOUCH END] Cleared swipeRef for ID: ${id}`);
    };

    // --- Course Management Functions ---

    const handleAddCourse = (courseName, tournamentName) => {

        const defaultHoles = Array.from({ length: 18 }, (_, index) => ({
            id: Date.now() + index,
            number: (index + 1).toString(),
            par: '3',
            note: '',
            editing: false,
        }));
        setCourses([...courses, { id: Date.now(), name: courseName, tournamentName: tournamentName, holes: defaultHoles }]);
        setIsAddCourseModalOpen(false);
        setNewCourseName('');
        setNewCourseTournamentName('');
    };

    const handleDeleteCourse = (id) => {
        setCourses(courses.filter((course) => course.id !== id));
        if (swipedCourseId === id) setSwipedCourseId(null);
    };


    // Function to delete a specific hole from the selected course
    const deleteHoleConfirmed = (holeIdToDelete) => {
        if (!selectedCourse) return;


        const updatedHoles = selectedCourse.holes.filter(
            (hole) => hole.id !== holeIdToDelete
        );

        const updatedCourses = courses.map((course) =>
            course.id === selectedCourse.id
                ? { ...course, holes: updatedHoles }
                : course
        );

        setCourses(updatedCourses);

        setSelectedCourse((prev) => ({ ...prev, holes: updatedHoles }));
    };

    const handleDeleteHoleClick = (holeId) => {
        setHoleToDeleteId(holeId);
        setIsDeleteConfirmationModalOpen(true);
    };

    const handleConfirmDeleteHole = () => {
        if (holeToDeleteId) {
            deleteHoleConfirmed(holeToDeleteId);
            setIsDeleteConfirmationModalOpen(false);
            setHoleToDeleteId(null);
            handleToggleEditingHole(holeToDeleteId); // Ensure edit mode is closed for the deleted hole
        }
    };

    const handleCancelDeleteHole = () => {
        setIsDeleteConfirmationModalOpen(false);
        setHoleToDeleteId(null);
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
        // Close other open edits when one is toggled
        closeAllHoleEdits();

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
                    : { ...hole, editing: false } // Ensures only one is editing at a time
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

    const backToList = () => {
        closeAllHoleEdits(); // Close all edits when going back to courses
        setSelectedCourse(null);
    };

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

    // --- Conditional Rendering for Course List vs. Hole List ---
    if (selectedCourse) {
        return (
            <div className="relative min-h-screen bg-gray-100 p-4">
                <button onClick={backToList} className="mb-4 px-3 py-1 border border-black text-black rounded hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200">
                    ← Back to Courses
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-3">
                        {selectedCourse.name}
                    </h2>
                    {selectedCourse.tournamentName && (
                        <p className="text-lg text-gray-600">{selectedCourse.tournamentName}</p>
                    )}
                </div>
                <div ref={holeListRef}> {/* Attach ref to the HoleList's container */}
                    <HoleList
                        holes={selectedCourse.holes || []}
                        editingHoleData={editingHoleData}
                        setEditingHoleData={setEditingHoleData}
                        toggleEditing={handleToggleEditingHole}
                        saveHoleChanges={handleSaveHoleChanges}
                        onDeleteClick={handleDeleteHoleClick}
                        onDragEnd={onDragEnd}
                    />
                </div>

                <button
                    onClick={() => setIsAddHoleModalOpen(true)}
                    className="fixed bottom-6 right-6 !bg-green-600 hover:bg-blue-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50"
                    aria-label="Add Hole"
                >
                    <span className="text-2xl">＋</span>
                </button>
                <AddHoleModal
                    isOpen={isAddHoleModalOpen}
                    onClose={() => setIsAddHoleModalOpen(false)}
                    onAddHole={handleAddHole}
                />

                <DeleteConfirmationModal
                    isOpen={isDeleteConfirmationModalOpen}
                    onClose={handleCancelDeleteHole}
                    onConfirm={handleConfirmDeleteHole}
                    message={`Are you sure you want to delete Hole ${selectedCourse.holes.find(h => h.id === holeToDeleteId)?.number || ''}? This action cannot be undone.`}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center pt-5">DG Courses</h2>
            <p className='text-center mb-6'>This is a list of courses that you've taken notes for.</p>
            <button
                onClick={() => setIsAddCourseModalOpen(true)}
                className="fab-fix fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50"
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
                newCourseTournamentName={newCourseTournamentName}
                setNewCourseTournamentName={setNewCourseTournamentName}
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