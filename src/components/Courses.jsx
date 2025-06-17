// src/components/Courses.jsx

import React, { useState, useEffect, useRef } from 'react';
import CourseList from './CourseList'; // Ensure this import is here
import HoleList from './HoleList';
import AddCourseModal from './AddCourseModal';
import AddHoleModal from './AddHoleModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

<<<<<<< Updated upstream
// Import ChevronLeft icon
import { ChevronLeft } from 'lucide-react'; // <-- ADDED THIS IMPORT

=======
>>>>>>> Stashed changes
import {
    subscribeToCourses,
    addCourse,
    deleteCourse,
    addHoleToCourse,
    updateHoleInCourse,
    deleteHoleFromCourse,
    reorderHolesInCourse,
} from '../services/firestoreService.jsx';
<<<<<<< Updated upstream
=======

import { useAuth } from '../context/AuthContext.jsx';
>>>>>>> Stashed changes

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseTournamentName, setNewCourseTournamentName] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editingHoleData, setEditingHoleData] = useState({});
    const [swipedCourseId, setSwipedCourseId] = useState(null);
    const [isAddHoleModalOpen, setIsAddHoleModalOpen] = useState(false);

    const [isDeleteConfirmationModalOpen, setIsDeleteConfirmationModalOpen] = useState(false);
    const [holeToDeleteId, setHoleToDeleteId] = useState(null);

    const swipeRefs = useRef({});
    const holeListRef = useRef(null);

    const { currentUser, loading, error } = useAuth();

    // --- Firestore Data Subscription (now dependent on currentUser) ---
    useEffect(() => {
<<<<<<< Updated upstream
        // This effect will subscribe to real-time updates from Firestore
        const unsubscribe = subscribeToCourses((fetchedCourses) => {
            console.log("Fetched courses in Courses.jsx:", fetchedCourses); // Critical Debug Log
            setCourses(fetchedCourses);
            // If a course was selected, find its updated version from fetchedCourses
            // and update selectedCourse state to reflect real-time changes
            if (selectedCourse) {
                const updatedSelected = fetchedCourses.find(c => c.id === selectedCourse.id);
                if (updatedSelected) {
                    // When the selected course is updated from Firestore, ensure 'editing' flags are preserved for current view
                    setSelectedCourse(prevSelected => {
                        if (!prevSelected || !prevSelected.holes || !updatedSelected.holes) {
                            return updatedSelected;
                        }

                        // Map 'editing' flags from the previous state to the newly fetched holes
                        const mergedHoles = updatedSelected.holes.map(fetchedHole => {
                            const prevHole = prevSelected.holes.find(h => h.id === fetchedHole.id);
                            return { ...fetchedHole, editing: prevHole ? prevHole.editing : false };
                        });

                        return { ...updatedSelected, holes: mergedHoles };
                    });

                } else {
                    // If the selected course was deleted in Firestore
                    setSelectedCourse(null);
=======
        let unsubscribe;
        if (currentUser && !loading) {
            console.log("Courses.jsx: Subscribing to courses for user ID:", currentUser.uid);
            unsubscribe = subscribeToCourses((fetchedCourses) => {
                console.log("Courses.jsx: Fetched courses:", fetchedCourses);
                setCourses(fetchedCourses);
                if (selectedCourse) {
                    const updatedSelected = fetchedCourses.find(c => c.id === selectedCourse.id);
                    if (updatedSelected) {
                        setSelectedCourse(updatedSelected);
                    } else {
                        setSelectedCourse(null);
                    }
>>>>>>> Stashed changes
                }
            }, currentUser.uid);
        } else if (!currentUser && !loading) {
            setCourses([]);
            setSelectedCourse(null);
            console.log("Courses.jsx: User not logged in, clearing courses.");
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [currentUser, loading, selectedCourse]);

    // Effect for click-outside detection when a course is selected
    useEffect(() => {
        function handleClickOutside(event) {
            // Check if the click is outside the holeListRef and not on any modal or hole item specific element
            if (selectedCourse && holeListRef.current && !holeListRef.current.contains(event.target)) {
                // Ensure clicks on modals or actual hole items (when editing) don't close everything
                const isClickOnModal = event.target.closest('.modal-overlay') || event.target.closest('.modal-content');
                const isClickOnHoleItem = event.target.closest('.HoleItem') || event.target.closest('li.mb-4'); // Added li.mb-4 for parent HoleItem

                if (!isClickOnModal && !isClickOnHoleItem) {
                    closeAllHoleEdits();
                }
            }
        }

        if (selectedCourse) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedCourse]);

<<<<<<< Updated upstream
    // Function to close all editing holes
    // This function is now mostly for external triggers (like clicking outside), not internal toggling.
=======
>>>>>>> Stashed changes
    const closeAllHoleEdits = () => {
        if (!selectedCourse) return;

        setSelectedCourse(prev => {
            if (!prev) return null;
            return {
                ...prev,
                holes: prev.holes.map(hole => ({
                    ...hole,
                    editing: false
                }))
            };
        });
        setEditingHoleData({});
    };

    const handleTouchStart = (e, id) => {
        swipeRefs.current[id] = { startX: e.touches[0].clientX, currentX: 0 };
        if (swipedCourseId && swipedCourseId !== id) {
            const prevEl = document.getElementById(`course-${swipedCourseId}`);
            if (prevEl) {
                prevEl.style.transition = 'transform 0.3s ease';
                prevEl.style.transform = 'translateX(0)';
            }
            setSwipedCourseId(null);
        }
        const el = document.getElementById(`course-${id}`);
        if (el) {
            el.style.transition = 'transform 0.0s ease';
        }
    };

    const handleTouchMove = (e, id) => {
        const swipeRef = swipeRefs.current[id];
        if (!swipeRef) return;
        const deltaX = e.touches[0].clientX - swipeRef.startX;
        const el = document.getElementById(`course-${id}`);
        if (!el) return;
        const transformX = Math.max(-80, Math.min(0, deltaX));
        el.style.transform = `translateX(${transformX}px)`;
        swipeRef.currentX = transformX;
    };

    const handleTouchEnd = (id) => {
        const swipeRef = swipeRefs.current[id];
        if (!swipeRef) return;
        const el = document.getElementById(`course-${id}`);
        if (el) {
            el.style.transition = 'transform 0.3s ease';
        }
        if (swipeRef.currentX <= -40) {
            if (el) el.style.transform = `translateX(-80px)`;
            setSwipedCourseId(id);
        } else {
            if (el) el.style.transform = `translateX(0)`;
            setSwipedCourseId(null);
        }
        swipeRefs.current[id] = null;
    };

    // --- Course Management Functions (now passing userId) ---

    const handleAddCourse = async (courseName, tournamentName) => {
        if (!currentUser) {
            alert("Please sign in to add courses.");
            return;
        }
        try {
            await addCourse(courseName, tournamentName, currentUser.uid);
            setIsAddCourseModalOpen(false);
            setNewCourseName('');
            setNewCourseTournamentName('');
        } catch (error) {
            console.error("Failed to add course:", error);
            alert("Failed to add course. Please try again.");
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!currentUser) {
            alert("Please sign in to delete courses.");
            return;
        }
        console.log("Courses.jsx: Attempting to delete course with ID:", id, "for user ID:", currentUser.uid);
        try {
            await deleteCourse(id, currentUser.uid);
            if (swipedCourseId === id) setSwipedCourseId(null);
            if (selectedCourse?.id === id) setSelectedCourse(null);
        } catch (error) {
            console.error("Failed to delete course:", error);
            alert("Failed to delete course. Please try again.");
        }
    };

    const deleteHoleConfirmed = async (holeIdToDelete) => {
        if (!selectedCourse || !currentUser) return;

        try {
            await deleteHoleFromCourse(selectedCourse.id, holeIdToDelete, currentUser.uid);
        } catch (error) {
            console.error("Failed to delete hole:", error);
            alert("Failed to delete hole. Please try again.");
        }
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
            closeAllHoleEdits();
        }
    };

    const handleCancelDeleteHole = () => {
        setIsDeleteConfirmationModalOpen(false);
        setHoleToDeleteId(null);
    };

    const handleAddHole = async (holeNumber, holePar, holeNote) => {
        if (!holeNumber.trim() || !holePar.trim() || !selectedCourse || !currentUser) {
            alert("Please sign in and ensure hole number/par are entered.");
            return;
        }

        const newHole = {
            id: `${selectedCourse.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            number: holeNumber,
            par: holePar,
            note: holeNote || '',
        };

        try {
            await addHoleToCourse(selectedCourse.id, newHole, currentUser.uid);
            setIsAddHoleModalOpen(false);
        } catch (error) {
            console.error("Failed to add hole:", error);
            alert("Failed to add hole. Please try again.");
        }
    };

    const handleToggleEditingHole = (holeId) => {
<<<<<<< Updated upstream
=======
        closeAllHoleEdits();

>>>>>>> Stashed changes
        setSelectedCourse(prev => {
            if (!prev) return null;

<<<<<<< Updated upstream
            const updatedHoles = prev.holes.map(hole => {
                if (hole.id === holeId) {
                    // If it's the target hole, toggle its editing state
                    return { ...hole, editing: !hole.editing };
                } else {
                    // If it's any other hole, ensure it's not in editing mode
                    return { ...hole, editing: false };
                }
            });

            // Find the hole that will be in editing mode after this update
            const holeToEdit = updatedHoles.find((h) => h.id === holeId);

            // Update editingHoleData based on whether the specific hole is now in editing mode
=======
            const updatedHoles = prev.holes.map(hole =>
                hole.id === holeId
                    ? { ...hole, editing: !hole.editing }
                    : { ...hole, editing: false }
            );
            const holeToEdit = updatedHoles.find((h) => h.id === holeId);
>>>>>>> Stashed changes
            if (holeToEdit && holeToEdit.editing) {
                setEditingHoleData({
                    number: holeToEdit.number,
                    par: holeToEdit.par,
                    note: holeToEdit.note,
                });
            } else {
<<<<<<< Updated upstream
                // If toggling off or no hole is in edit mode, clear editing data
=======
>>>>>>> Stashed changes
                setEditingHoleData({});
            }

            return { ...prev, holes: updatedHoles };
        });
    };

    const handleSaveHoleChanges = async (holeId) => {
        if (!selectedCourse || !currentUser) return;

        const updatedHole = {
            id: holeId,
            number: editingHoleData.number,
            par: editingHoleData.par,
            note: editingHoleData.note,
        };

        try {
            await updateHoleInCourse(selectedCourse.id, holeId, updatedHole, currentUser.uid);
            setEditingHoleData({});
            closeAllHoleEdits();
        }
        catch (error) {
            console.error("Failed to save hole changes:", error);
            alert("Failed to save hole changes. Please try again.");
        }
    };

    const backToList = () => {
        closeAllHoleEdits();
        setSelectedCourse(null);
    };

    const onDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index || !selectedCourse || !currentUser) {
            return;
        }

        const currentHoles = Array.from(selectedCourse.holes);
        const [reorderedHole] = currentHoles.splice(source.index, 1);
        currentHoles.splice(destination.index, 0, reorderedHole);

        const holesToSave = currentHoles.map(({ editing, ...rest }) => rest);

        try {
            await reorderHolesInCourse(selectedCourse.id, holesToSave, currentUser.uid);
        } catch (error) {
            console.error("Failed to reorder holes:", error);
            alert("Failed to reorder holes. Please try again.");
        }
    };

    // --- Conditional Rendering based on Authentication ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-xl text-gray-700">
                Loading application...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen text-xl text-red-600">
                Error: {error.message || "Something went wrong with authentication."}
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100 p-4 text-center">
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Welcome to DG Caddy Notes!</h2>
                <p className="text-lg text-gray-600 mb-8">
                    Please sign in to access and manage your courses.
                </p>
                <p className="text-md text-gray-500">
                    Click "Sign In" in the menu to get started.
                </p>
            </div>
        );
    }

    // Render CourseList or HoleList based on selectedCourse
    if (selectedCourse) {
        return (
            <div className="relative min-h-screen bg-gray-100 p-4 pt-5">
                {/* UPDATED BACK BUTTON */}
                <button
                    onClick={backToList}
                    className="mb-4 px-3 py-1 border border-black text-black rounded hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 flex items-center gap-1"
                >
                    <ChevronLeft size={16} /> Back
                </button>

                <div className="text-center mb-6 pt-5">
                    <h2 className="text-2xl font-bold mb-3">
                        {selectedCourse.name}
                    </h2>
                    {selectedCourse.tournamentName && (
                        <p className="text-lg text-gray-600">{selectedCourse.tournamentName}</p>
                    )}
                </div>
                <div ref={holeListRef}>
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

    // Default return block for the main course list
    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <h2 className="text-2xl font-bold mb-4 text-center pt-5">DG Courses</h2>
            <p className='text-center mb-6'>This is a list of courses that you've taken notes for.</p>
            {/* Added CourseList component here! */}
            <CourseList
                courses={courses}
                onSelectCourse={setSelectedCourse}
                onDeleteCourse={handleDeleteCourse}
                swipedCourseId={swipedCourseId}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            />

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
                onAddCourse={handleAddCourse}
                newCourseName={newCourseName}
                setNewCourseName={setNewCourseName}
                newCourseTournamentName={newCourseTournamentName}
                setNewCourseTournamentName={setNewCourseTournamentName}
            />
        </div>
    );
}