// src/components/Courses.jsx

import React, { useState, useEffect, useRef } from 'react';
import CourseList from './CourseList';
import HoleList from './HoleList';
import AddCourseModal from './AddCourseModal';
import AddHoleModal from './AddHoleModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

// Import ChevronLeft icon
import { ChevronLeft } from 'lucide-react';

import {
    subscribeToCourses,
    addCourse,
    deleteCourse,
    addHoleToCourse,
    updateHoleInCourse,
    deleteHoleFromCourse,
    reorderHolesInCourse,
} from '../services/firestoreService.jsx'; // Ensure correct path and extension

// Import the useFirebase hook
import { useFirebase } from '../firebase.js'; // Ensure correct path and extension

export default function Courses() {
    // Destructure userId and isAuthReady from the useFirebase hook
    const { userId, isAuthReady } = useFirebase();

    const [courses, setCourses] = useState([]);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseTournamentName, setNewCourseTournamentName] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editingHoleData, setEditingHoleData] = useState({});
    const [swipedCourseId, setSwipedCourseId] = useState(null);
    const [isAddHoleModalOpen, setIsAddHoleModalOpen] = useState(false);

    // State for delete confirmation modal
    const [isDeleteConfirmationModalOpen, setIsDeleteConfirmationModal] = useState(false);
    const [holeToDeleteId, setHoleToDeleteId] = useState(null);

    const swipeRefs = useRef({});
    const holeListRef = useRef(null); // Ref for the HoleList container

    // --- Firestore Data Subscription ---
    useEffect(() => {
        // Only subscribe if authentication is ready and userId is available
        if (!isAuthReady || !userId) {
            console.log("Auth not ready or userId not available, skipping course subscription.");
            setCourses([]); // Clear courses if not authenticated or not ready
            return;
        }

        console.log("Service Worker: Subscribing to courses for userId:", userId);
        // Pass userId to the subscribeToCourses function
        const unsubscribe = subscribeToCourses(userId, (fetchedCourses) => {
            console.log("Fetched courses in Courses.jsx:", fetchedCourses);
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
                }
            }
        });

        // Cleanup the subscription when the component unmounts or userId changes
        return () => unsubscribe();
    }, [isAuthReady, userId, selectedCourse]); // Add isAuthReady and userId to dependencies

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

        // Add event listener only if a course is selected to avoid unnecessary checks
        if (selectedCourse) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedCourse]); // Depend on selectedCourse

    // Function to close all editing holes
    // This function is now mostly for external triggers (like clicking outside), not internal toggling.
    const closeAllHoleEdits = () => {
        if (!selectedCourse) return;

        setSelectedCourse(prev => {
            if (!prev) return null; // Defensive check
            return {
                ...prev,
                holes: prev.holes.map(hole => ({
                    ...hole,
                    editing: false // Set all holes to not editing in selectedCourse state
                }))
            };
        });
        setEditingHoleData({}); // Clear editing data
    };

    // --- REVISED SWIPE HANDLING FUNCTIONS ---
    // These functions manipulate the DOM directly for smooth swiping
    // and then update React state (swipedCourseId) for conditional rendering.
    const handleTouchStart = (e, id) => {
        swipeRefs.current[id] = { startX: e.touches[0].clientX, currentX: 0 };

        if (swipedCourseId && swipedCourseId !== id) {
            // If another item was swiped, reset its position visually
            const prevEl = document.getElementById(`course-${swipedCourseId}`);
            if (prevEl) {
                prevEl.style.transition = 'transform 0.3s ease';
                prevEl.style.transform = 'translateX(0)';
            }
            setSwipedCourseId(null);
        }

        const el = document.getElementById(`course-${id}`);
        if (el) {
            el.style.transition = 'transform 0.0s ease'; // Instant transition for start
        }
    };

    const handleTouchMove = (e, id) => {
        const swipeRef = swipeRefs.current[id];
        if (!swipeRef) return;

        const deltaX = e.touches[0].clientX - swipeRef.startX;
        const el = document.getElementById(`course-${id}`);
        if (!el) return;

        const transformX = Math.max(-80, Math.min(0, deltaX)); // Limit swipe to -80px
        el.style.transform = `translateX(${transformX}px)`;

        swipeRef.currentX = transformX;
    };

    const handleTouchEnd = (id) => {
        const swipeRef = swipeRefs.current[id];
        if (!swipeRef) return;

        const el = document.getElementById(`course-${id}`);
        if (el) {
            el.style.transition = 'transform 0.3s ease'; // Re-enable transition for snap-back
        }

        if (swipeRef.currentX <= -40) { // If swiped more than 40px left
            if (el) el.style.transform = `translateX(-80px)`;
            setSwipedCourseId(id); // Set the ID of the swiped course
        } else {
            if (el) el.style.transform = `translateX(0)`;
            setSwipedCourseId(null); // Clear swiped state
        }
        swipeRefs.current[id] = null; // Clear ref for this swipe
    };

    // --- Course Management Functions (using Firestore service) ---

    const handleAddCourse = async (courseName, tournamentName) => {
        if (!userId) {
            alert("User not authenticated. Please wait for authentication to complete or refresh the page.");
            return;
        }
        try {
            // Pass the userId to the Firestore service function
            await addCourse(courseName, tournamentName, userId);
            setIsAddCourseModalOpen(false);
            setNewCourseName('');
            setNewCourseTournamentName('');
            // The subscribeToCourses useEffect will automatically update 'courses' state
        } catch (error) {
            console.error("Failed to add course:", error);
            alert("Failed to add course. Please try again. Error: " + error.message);
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!userId) {
            alert("User not authenticated. Please wait for authentication to complete or refresh the page.");
            return;
        }
        try {
            // Pass the userId to the Firestore service function
            await deleteCourse(id, userId);
            if (swipedCourseId === id) setSwipedCourseId(null);
            if (selectedCourse?.id === id) setSelectedCourse(null); // Deselect if deleted
            // The subscribeToCourses useEffect will automatically update 'courses' state
        } catch (error) {
            console.error("Failed to delete course:", error);
            alert("Failed to delete course. Please try again. Error: " + error.message);
        }
    };

    // Function to delete a specific hole from the selected course
    const deleteHoleConfirmed = async (holeIdToDelete) => {
        if (!selectedCourse || !userId) {
            alert("User not authenticated or course not selected.");
            return;
        }

        try {
            // Pass the userId to the Firestore service function
            await deleteHoleFromCourse(selectedCourse.id, holeIdToDelete, userId);
            // The `subscribeToCourses` useEffect will update `selectedCourse` automatically
            // so no need for manual `setSelectedCourse` update here.
        } catch (error) {
            console.error("Failed to delete hole:", error);
            alert("Failed to delete hole. Please try again. Error: " + error.message);
        }
    };

    const handleDeleteHoleClick = (holeId) => {
        setHoleToDeleteId(holeId);
        setIsDeleteConfirmationModal(true);
    };

    const handleConfirmDeleteHole = () => {
        if (holeToDeleteId) {
            deleteHoleConfirmed(holeIdToDelete);
            setIsDeleteConfirmationModal(false);
            setHoleToDeleteId(null);
            closeAllHoleEdits(); // Ensure edit mode is closed for the deleted hole
        }
    };

    const handleCancelDeleteHole = () => {
        setIsDeleteConfirmationModal(false);
        setHoleToDeleteId(null);
    };


    const handleAddHole = async (holeNumber, holePar, holeNote) => {
        if (!holeNumber.trim() || !holePar.trim() || !selectedCourse || !userId) {
            alert("Hole number and par are required, a course must be selected, and user must be authenticated.");
            return;
        }

        // Use a more robust ID generation for holes to avoid potential conflicts
        const newHole = {
            id: `${selectedCourse.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique ID
            number: holeNumber,
            par: holePar,
            note: holeNote || '',
        };

        try {
            // Pass the userId to the Firestore service function
            await addHoleToCourse(selectedCourse.id, newHole, userId);
            setIsAddHoleModalOpen(false);
            // `subscribeToCourses` will handle updating the state automatically
        } catch (error) {
            console.error("Failed to add hole:", error);
            alert("Failed to add hole. Please try again. Error: " + error.message);
        }
    };

    const handleToggleEditingHole = (holeId) => {
        setSelectedCourse(prev => {
            if (!prev) return null; // Defensive check

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
            if (holeToEdit && holeToEdit.editing) {
                setEditingHoleData({
                    number: holeToEdit.number,
                    par: holeToEdit.par,
                    note: holeToEdit.note,
                });
            } else {
                // If toggling off or no hole is in edit mode, clear editing data
                setEditingHoleData({});
            }

            return { ...prev, holes: updatedHoles };
        });
    };


    const handleSaveHoleChanges = async (holeId) => {
        if (!selectedCourse || !userId) {
            alert("User not authenticated or course not selected.");
            return;
        }

        // The updatedHole object needs to contain the ID and all fields that might be updated
        const updatedHole = {
            id: holeId,
            number: editingHoleData.number,
            par: editingHoleData.par,
            note: editingHoleData.note,
        };

        try {
            // Pass the userId to the Firestore service function
            await updateHoleInCourse(selectedCourse.id, holeId, updatedHole, userId);
            setEditingHoleData({});
            closeAllHoleEdits(); // Close edit mode for the saved hole
        }
        catch (error) {
            console.error("Failed to save hole changes:", error);
            alert("Failed to save hole changes. Please try again. Error: " + error.message);
        }
    };

    const backToList = () => {
        closeAllHoleEdits(); // Close all edits when going back to courses
        setSelectedCourse(null);
    };

    const onDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index || !selectedCourse || !userId) {
            // No destination, no change, or no selected course/user authenticated
            return;
        }

        const currentHoles = Array.from(selectedCourse.holes);
        const [reorderedHole] = currentHoles.splice(source.index, 1);
        currentHoles.splice(destination.index, 0, reorderedHole);

        // Remove the transient 'editing' property before sending to Firestore
        const holesToSave = currentHoles.map(({ editing, ...rest }) => rest);

        try {
            // Pass the userId to the Firestore service function
            await reorderHolesInCourse(selectedCourse.id, holesToSave, userId);
            // `subscribeToCourses` will handle updating `selectedCourse`
        } catch (error) {
            console.error("Failed to reorder holes:", error);
            alert("Failed to reorder holes. Please try again. Error: " + error.message);
        }
    };

    // Show a loading/authentication message if auth is not ready
    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center min-h-screen text-xl text-gray-700">
                Loading authentication...
            </div>
        );
    }

    // --- Conditional Rendering for Course List vs. Hole List ---
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
                <div ref={holeListRef}> {/* Attach ref to the HoleList's container */}
                    <HoleList
                        // Ensure 'holes' array is always present for HoleList
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
                    isOpen={isDeleteConfirmationModal}
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
                courses={courses} // Pass the 'courses' state to CourseList
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
