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

export default function Courses() { // No setIsEncouragementModalOpen prop here
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
    const [isDeleteConfirmationModalOpen, setIsDeleteConfirmationModalOpen] = useState(false);
    const [holeToDeleteId, setHoleToDeleteId] = useState(null);

    // New state for in-app messages
    const [appMessage, setAppMessage] = useState({ type: '', text: '' }); // type: 'success' or 'error'

    // Function to show a temporary in-app message
    const showAppMessage = (type, text) => {
        setAppMessage({ type, text });
        setTimeout(() => {
            setAppMessage({ type: '', text: '' }); // Clear message after 5 seconds
        }, 5000);
    };

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
            showAppMessage('error', "User not authenticated. Please wait for authentication to complete or refresh the page.");
            return;
        }
        try {
            await addCourse(courseName, tournamentName, userId);
            setIsAddCourseModalOpen(false);
            setNewCourseName('');
            setNewCourseTournamentName('');
            showAppMessage('success', `Course "${courseName}" added successfully!`);
            // No setShowActionFabs(false) here, as there's no action menu
        } catch (error) {
            console.error("Failed to add course:", error);
            showAppMessage('error', `Failed to add course: ${error.message}`);
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!userId) {
            showAppMessage('error', "User not authenticated. Please wait for authentication to complete or refresh the page.");
            return;
        }
        try {
            const courseName = courses.find(c => c.id === id)?.name || 'selected course';
            await deleteCourse(id, userId);
            if (swipedCourseId === id) setSwipedCourseId(null);
            if (selectedCourse?.id === id) setSelectedCourse(null); // Deselect if deleted
            showAppMessage('success', `Course "${courseName}" deleted successfully!`);
        } catch (error) {
            console.error("Failed to delete course:", error);
            showAppMessage('error', `Failed to delete course: ${error.message}`);
        }
    };

    // Function to delete a specific hole from the selected course
    const deleteHoleConfirmed = async (holeIdToDelete) => {
        if (!selectedCourse || !userId) {
            showAppMessage('error', "User not authenticated or course not selected.");
            return;
        }

        try {
            const holeNumber = selectedCourse.holes.find(h => h.id === holeIdToDelete)?.number || '';
            await deleteHoleFromCourse(selectedCourse.id, holeIdToDelete, userId);
            showAppMessage('success', `Hole ${holeNumber} deleted successfully!`);
        } catch (error) {
            console.error("Failed to delete hole:", error);
            showAppMessage('error', `Failed to delete hole: ${error.message}`);
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
            closeAllHoleEdits(); // Ensure edit mode is closed for the deleted hole
        }
    };

    const handleCancelDeleteHole = () => {
        setIsDeleteConfirmationModalOpen(false);
        setHoleToDeleteId(null);
    };


    const handleAddHole = async (holeNumber, holePar, holeNote) => {
        if (!holeNumber.trim() || !holePar.trim() || !selectedCourse || !userId) {
            showAppMessage('error', "Hole number and par are required, a course must be selected, and user must be authenticated.");
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
            await addHoleToCourse(selectedCourse.id, newHole, userId);
            setIsAddHoleModalOpen(false);
            showAppMessage('success', `Hole ${holeNumber} added successfully!`);
        } catch (error) {
            console.error("Failed to add hole:", error);
            showAppMessage('error', `Failed to add hole: ${error.message}`);
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
            showAppMessage('error', "User not authenticated or course not selected.");
            return;
        }

        const updatedHole = {
            id: holeId,
            number: editingHoleData.number,
            par: editingHoleData.par,
            note: editingHoleData.note,
        };

        try {
            await updateHoleInCourse(selectedCourse.id, holeId, updatedHole, userId);
            setEditingHoleData({});
            closeAllHoleEdits(); // Close edit mode for the saved hole
            showAppMessage('success', `Hole ${updatedHole.number} changes saved!`);
        }
        catch (error) {
            console.error("Failed to save hole changes:", error);
            showAppMessage('error', `Failed to save hole changes: ${error.message}`);
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
            await reorderHolesInCourse(selectedCourse.id, holesToSave, userId);
            showAppMessage('success', 'Holes reordered successfully!');
        } catch (error) {
            console.error("Failed to reorder holes:", error);
            showAppMessage('error', `Failed to reorder holes: ${error.message}`);
        }
    };

    // Show a loading/authentication message if auth is not ready
    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 text-xl text-gray-700">
                Loading authentication...
            </div>
        );
    }

    // No debug logs related to showActionFabs as it won't exist in this version
    console.log("DEBUG Courses.jsx Render: selectedCourse =", selectedCourse);


    return (
        <div className="min-h-screen bg-gray-100 p-4"> {/* Removed 'relative' here, as FABs are fixed position */}
            {/* New in-app message display at the top of the component */}
            {appMessage.text && (
                <div className={`px-4 py-3 rounded relative mb-4
                    ${appMessage.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}
                    role="alert">
                    <span className="block sm:inline">{appMessage.text}</span>
                </div>
            )}

            {/* --- Conditional Rendering for Course List vs. Hole List --- */}
            {selectedCourse ? (
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
            ) : (
                <> {/* Fragment for the course list view */}
                    <h2 className="text-2xl font-bold mb-4 text-center pt-5">DG Courses</h2>
                    <p className='text-center mb-6'>This is a list of courses that you've taken notes for.</p>

                    {/* Original Add Course FAB (single button) */}
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
                </>
            )}
        </div>
    );
}
