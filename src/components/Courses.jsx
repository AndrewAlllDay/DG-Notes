// src/components/Courses.jsx

import React, { useState, useEffect, useRef } from 'react';
import CourseList from './CourseList';
import HoleList from './HoleList';
import AddCourseModal from './AddCourseModal';
import AddHoleModal from './AddHoleModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

import {
    subscribeToCourses,
    addCourse,
    deleteCourse,
    addHoleToCourse,
    updateHoleInCourse,
    deleteHoleFromCourse,
    reorderHolesInCourse,
    subscribeToUserDiscs,
} from '../services/firestoreService.jsx';

import { useFirebase } from '../firebase.js';

export default function Courses() {
    const { userId, isAuthReady } = useFirebase();

    const [courses, setCourses] = useState([]);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseTournamentName, setNewCourseTournamentName] = useState('');
    // State for course classification, correctly added
    const [newCourseClassification, setNewCourseClassification] = useState('');

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editingHoleData, setEditingHoleData] = useState({});
    const [swipedCourseId, setSwipedCourseId] = useState(null);
    const [isAddHoleModalOpen, setIsAddHoleModalOpen] = useState(false);

    const [isDeleteConfirmationModalOpen, setIsDeleteConfirmationModalOpen] = useState(false);
    const [holeToDeleteId, setHoleToDeleteId] = useState(null);

    const [appMessage, setAppMessage] = useState({ type: '', text: '' });

    // FAB state - Initialized to true, and scroll logic removed.
    const [showFab, setShowFab] = useState(true);
    // lastScrollY and scrollContainerRef are no longer needed for FAB visibility, but kept if used elsewhere.
    const lastScrollY = useRef(0);
    const scrollContainerRef = useRef(null);

    const swipeRefs = useRef({});
    const holeListRef = useRef(null);

    const showAppMessage = (type, text) => {
        setAppMessage({ type, text });
        setTimeout(() => {
            setAppMessage({ type: '', text: '' });
        }, 5000);
    };

    const [discs, setDiscs] = useState([]);

    const handleToggleEditingHole = (holeId, currentHoleData) => {
        setSelectedCourse(prevCourse => {
            if (!prevCourse) return null;
            return {
                ...prevCourse,
                holes: prevCourse.holes.map(hole =>
                    hole.id === holeId ? { ...hole, editing: !hole.editing } : { ...hole, editing: false }
                )
            };
        });
        setEditingHoleData(currentHoleData);
    };

    useEffect(() => {
        if (!isAuthReady || !userId) {
            console.log("Auth not ready or userId not available, skipping data subscriptions.");
            setCourses([]);
            setDiscs([]);
            return;
        }

        console.log("Subscribing to courses for userId:", userId);
        const unsubscribeCourses = subscribeToCourses(userId, (fetchedCourses) => {
            console.log("Fetched courses in Courses.jsx:", fetchedCourses);
            setCourses(fetchedCourses);
            if (selectedCourse) {
                const updatedSelected = fetchedCourses.find(c => c.id === selectedCourse.id);
                if (updatedSelected) {
                    setSelectedCourse(prevSelected => {
                        if (!prevSelected || !prevSelected.holes || !updatedSelected.holes) {
                            return updatedSelected;
                        }
                        const mergedHoles = updatedSelected.holes.map(fetchedHole => {
                            const prevHole = prevSelected.holes.find(h => h.id === fetchedHole.id);
                            return { ...fetchedHole, editing: prevHole ? prevHole.editing : false };
                        });
                        return { ...updatedSelected, holes: mergedHoles };
                    });
                } else {
                    setSelectedCourse(null);
                }
            }
        });

        console.log("Subscribing to discs for userId:", userId);
        const unsubscribeDiscs = subscribeToUserDiscs(userId, (fetchedDiscs) => {
            console.log("Fetched discs in Courses.jsx:", fetchedDiscs);
            setDiscs(fetchedDiscs);
        });

        return () => {
            unsubscribeCourses();
            unsubscribeDiscs();
        };
    }, [isAuthReady, userId, selectedCourse]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (selectedCourse && holeListRef.current && !holeListRef.current.contains(event.target)) {
                const isClickOnModal = event.target.closest('.modal-overlay') || event.target.closest('.modal-content');
                const isClickOnHoleItem = event.target.closest('.HoleItem') || event.target.closest('li.mb-4');

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

    // --- REMOVED FAB SCROLL LOGIC ---
    // The useEffect hook for `handleScroll` has been removed to keep FABs always visible.
    // useEffect(() => {
    //     const handleScroll = () => {
    //         const currentScrollY = window.scrollY;

    //         if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
    //             if (currentScrollY > lastScrollY.current) {
    //                 setShowFab(false); // Scrolling down
    //             } else {
    //                 setShowFab(true); // Scrolling up
    //             }
    //         }
    //         lastScrollY.current = currentScrollY;
    //     };

    //     window.addEventListener('scroll', handleScroll);

    //     return () => {
    //         window.removeEventListener('scroll', handleScroll);
    //     };
    // }, []);
    // --- END REMOVED FAB SCROLL LOGIC ---

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

    // Modified handleAddCourse to accept classification
    const handleAddCourse = async (courseName, tournamentName, classification) => {
        if (!userId) {
            showAppMessage('error', "User not authenticated. Please wait for authentication to complete or refresh the page.");
            return;
        }
        try {
            // Pass the new classification to addCourse
            await addCourse(courseName, tournamentName, classification, userId);
            setIsAddCourseModalOpen(false);
            setNewCourseName('');
            setNewCourseTournamentName('');
            setNewCourseClassification(''); // Reset classification state after adding
            showAppMessage('success', `Course "${courseName}" added successfully!`);
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
            if (selectedCourse?.id === id) setSelectedCourse(null);
            showAppMessage('success', `Course "${courseName}" deleted successfully!`);
        } catch (error) {
            console.error("Failed to delete course:", error);
            showAppMessage('error', `Failed to delete course: ${error.message}`);
        }
    };

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
            closeAllHoleEdits();
        }
    };

    const handleCancelDeleteHole = () => {
        setIsDeleteConfirmationModalOpen(false);
        setHoleToDeleteId(null);
    };

    const handleAddHole = async (holeNumber, holePar, holeNote, discId = null) => {
        if (!holeNumber.trim() || !holePar.trim() || !selectedCourse || !userId) {
            showAppMessage('error', "Hole number and par are required, a course must be selected, and user must be authenticated.");
            return;
        }
        const newHole = {
            id: `${selectedCourse.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            number: holeNumber,
            par: holePar,
            note: holeNote || '',
            discId: discId, // Added discId to new hole object
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
            discId: editingHoleData.discId !== undefined ? editingHoleData.discId : null,
        };
        try {
            await updateHoleInCourse(selectedCourse.id, holeId, updatedHole, userId);
            setEditingHoleData({});
            closeAllHoleEdits();
            showAppMessage('success', `Hole ${updatedHole.number} changes saved!`);
        }
        catch (error) {
            console.error("Failed to save hole changes:", error);
            showAppMessage('error', `Failed to save hole changes: ${error.message}`);
        }
    };

    const backToList = () => {
        closeAllHoleEdits();
        setSelectedCourse(null);
    };

    const onDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index || !selectedCourse || !userId) {
            return;
        }
        const currentHoles = Array.from(selectedCourse.holes);
        const [reorderedHole] = currentHoles.splice(source.index, 1);
        currentHoles.splice(destination.index, 0, reorderedHole);
        const holesToSave = currentHoles.map(({ editing, ...rest }) => rest);
        try {
            await reorderHolesInCourse(selectedCourse.id, holesToSave, userId);
            showAppMessage('success', 'Holes reordered successfully!');
        } catch (error) {
            console.error("Failed to reorder holes:", error);
            showAppMessage('error', `Failed to reorder holes: ${error.message}`);
        }
    };

    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 text-xl text-gray-700">
                Loading authentication...
            </div>
        );
    }

    console.log("DEBUG Courses.jsx Render: selectedCourse =", selectedCourse);
    console.log("DEBUG Courses.jsx Render: discs =", discs);

    return (
        <div ref={scrollContainerRef} className="max-h-screen bg-gray-100 p-4 overflow-y-auto">
            {appMessage.text && (
                <div className={`px-4 py-3 rounded relative mb-4
                    ${appMessage.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}
                    role="alert">
                    <span className="block sm:inline">{appMessage.text}</span>
                </div>
            )}

            {selectedCourse ? (
                <div className="relative min-h-screen bg-gray-100 p-4 pt-5">
                    <div className="text-center mb-6 pt-5">
                        <h2 className="text-2xl font-bold mb-3">
                            {selectedCourse.name}
                        </h2>
                        {selectedCourse.tournamentName && (
                            <p className="text-lg text-gray-600">{selectedCourse.tournamentName}</p>
                        )}
                        {/* Display Course Classification if available */}
                        {selectedCourse.classification && (
                            <p className="text-md text-gray-500 italic">
                                Style: {selectedCourse.classification.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </p>
                        )}
                    </div>
                    <div ref={holeListRef}>
                        <HoleList
                            holes={selectedCourse.holes || []}
                            editingHoleData={editingHoleData}
                            setEditingHoleData={setEditingHoleData}
                            toggleEditing={(holeId, currentHoleData) => handleToggleEditingHole(holeId, currentHoleData)}
                            saveHoleChanges={handleSaveHoleChanges}
                            deleteHole={handleDeleteHoleClick}
                            onDragEnd={onDragEnd}
                            discs={discs}
                            backToList={backToList}
                        />
                    </div>

                    {/* FAB for Add Hole - Now always visible */}
                    <button
                        onClick={() => setIsAddHoleModalOpen(true)}
                        className={`fixed bottom-6 right-6 !bg-blue-600 hover:bg-blue-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50`}
                        aria-label="Add Hole"
                    >
                        <span className="text-2xl">＋</span>
                    </button>

                    <AddHoleModal
                        isOpen={isAddHoleModalOpen}
                        onClose={() => setIsAddHoleModalOpen(false)}
                        onAddHole={handleAddHole}
                        discs={discs}
                    />

                    <DeleteConfirmationModal
                        isOpen={isDeleteConfirmationModalOpen}
                        onClose={handleCancelDeleteHole}
                        onConfirm={handleConfirmDeleteHole}
                        message={`Are you sure you want to delete Hole ${selectedCourse.holes.find(h => h.id === holeToDeleteId)?.number || ''}? This action cannot be undone.`}
                    />
                </div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold mb-4 text-center pt-5">DG Courses</h2>
                    <p className='text-center mb-6'>This is a list of courses that you've taken notes for.</p>

                    {/* FAB for Add Course - Now always visible. Removed conditional `showFab` class. */}
                    <button
                        onClick={() => setIsAddCourseModalOpen(true)}
                        className={`fab-fix fixed bottom-6 right-6 !bg-blue-600 hover:bg-red-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50`}
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
                        // Correctly passing the classification state and its setter
                        newCourseClassification={newCourseClassification}
                        setNewCourseClassification={setNewCourseClassification}
                    />
                    <CourseList
                        courses={courses}
                        // Corrected prop name to match what CourseList expects for selection
                        onSelectCourse={setSelectedCourse}
                        onDeleteCourse={handleDeleteCourse}
                        swipedCourseId={swipedCourseId}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    />
                </>
            )}
        </div>
    );
}