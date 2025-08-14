import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CourseList from '../components/CourseList';
import HoleList from '../components/HoleList';
import AddCourseModal from '../components/AddCourseModal';
import AddHoleModal from '../components/AddHoleModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

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

import { getCache, setCache } from '../utilities/cache.js';

// Debounce utility
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export default function Courses({ user }) {
    const { uid: userId } = user;

    // Consolidated State
    const [courses, setCourses] = useState([]);
    const [discs, setDiscs] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [editingHoleData, setEditingHoleData] = useState({});

    // UI State - consolidated where possible
    const [modals, setModals] = useState({
        addCourse: false,
        addHole: false,
        deleteConfirmation: false
    });

    const [courseForm, setCourseForm] = useState({
        name: '',
        tournamentName: '',
        classification: ''
    });

    const [uiState, setUiState] = useState({
        swipedCourseId: null,
        holeToDeleteId: null,
        appMessage: { type: '', text: '' }
    });

    // Refs
    const scrollContainerRef = useRef(null);
    const swipeRefs = useRef({});
    const holeListRef = useRef(null);
    const messageTimeoutRef = useRef(null);

    // Memoized computations
    const sortedCourses = useMemo(() =>
        [...courses].sort((a, b) => a.name.localeCompare(b.name)),
        [courses]
    );

    const selectedCourseHoles = useMemo(() =>
        selectedCourse?.holes || [],
        [selectedCourse?.holes]
    );

    // Debounced message clear
    const debouncedClearMessage = useMemo(
        () => debounce(() => {
            setUiState(prev => ({ ...prev, appMessage: { type: '', text: '' } }));
        }, 5000),
        []
    );

    // Optimized message handler
    const showAppMessage = useCallback((type, text) => {
        setUiState(prev => ({ ...prev, appMessage: { type, text } }));
        debouncedClearMessage();
    }, [debouncedClearMessage]);

    // Memoized modal handlers
    const toggleModal = useCallback((modalName, isOpen) => {
        setModals(prev => ({ ...prev, [modalName]: isOpen }));
    }, []);

    const updateCourseForm = useCallback((field, value) => {
        setCourseForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const resetCourseForm = useCallback(() => {
        setCourseForm({ name: '', tournamentName: '', classification: '' });
    }, []);

    // Optimized editing handler
    const handleToggleEditingHole = useCallback((holeId, currentHoleData) => {
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
    }, []);

    // Close all hole edits - memoized
    const closeAllHoleEdits = useCallback(() => {
        if (!selectedCourse) return;
        setSelectedCourse(prev => {
            if (!prev) return null;
            return {
                ...prev,
                holes: prev.holes.map(hole => ({ ...hole, editing: false }))
            };
        });
        setEditingHoleData({});
    }, [selectedCourse]);

    // Data fetching effect - optimized
    useEffect(() => {
        if (!userId) {
            setCourses([]);
            setDiscs([]);
            return;
        }

        // Courses subscription
        const cachedCourses = getCache(`userCourses-${userId}`);
        if (cachedCourses) {
            setCourses(cachedCourses);
        }

        const unsubscribeCourses = subscribeToCourses(userId, (fetchedCourses) => {
            setCourses(prevCourses => {
                // Only update if courses actually changed
                const coursesEqual = JSON.stringify(prevCourses) === JSON.stringify(fetchedCourses);
                if (coursesEqual) return prevCourses;

                setCache(`userCourses-${userId}`, fetchedCourses);
                return fetchedCourses;
            });
        });

        // Discs subscription
        const cachedDiscs = getCache(`userDiscs-${userId}`);
        if (cachedDiscs) {
            setDiscs(cachedDiscs);
        }

        const unsubscribeDiscs = subscribeToUserDiscs(userId, (fetchedDiscs) => {
            setDiscs(prevDiscs => {
                // Only update if discs actually changed
                const discsEqual = JSON.stringify(prevDiscs) === JSON.stringify(fetchedDiscs);
                if (discsEqual) return prevDiscs;

                setCache(`userDiscs-${userId}`, fetchedDiscs);
                return fetchedDiscs;
            });
        });

        return () => {
            unsubscribeCourses();
            unsubscribeDiscs();
        };
    }, [userId]);

    // Selected course update effect - optimized
    useEffect(() => {
        if (!selectedCourse) return;

        const updatedSelectedCourse = courses.find(c => c.id === selectedCourse.id);

        if (updatedSelectedCourse) {
            setSelectedCourse(prevSelected => {
                if (!prevSelected?.holes) return updatedSelectedCourse;

                // Preserve editing state efficiently
                const mergedHoles = updatedSelectedCourse.holes.map(fetchedHole => {
                    const prevHole = prevSelected.holes.find(h => h.id === fetchedHole.id);
                    return prevHole?.editing ? { ...fetchedHole, editing: true } : fetchedHole;
                });

                return { ...updatedSelectedCourse, holes: mergedHoles };
            });
        } else {
            // Course was deleted
            setSelectedCourse(null);
        }
    }, [courses, selectedCourse?.id]);

    // Click outside handler - optimized
    useEffect(() => {
        if (!selectedCourse) return;

        const handleClickOutside = (event) => {
            if (!holeListRef.current?.contains(event.target)) {
                const isClickOnModal = event.target.closest('.modal-overlay, .modal-content');
                const isClickOnHoleItem = event.target.closest('.HoleItem, li.mb-4');
                if (!isClickOnModal && !isClickOnHoleItem) {
                    closeAllHoleEdits();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedCourse, closeAllHoleEdits]);

    // Optimized touch handlers
    const handleTouchStart = useCallback((e, id) => {
        swipeRefs.current[id] = { startX: e.touches[0].clientX, currentX: 0 };

        // Reset previously swiped course
        if (uiState.swipedCourseId && uiState.swipedCourseId !== id) {
            const prevEl = document.getElementById(`course-${uiState.swipedCourseId}`);
            if (prevEl) {
                prevEl.style.transition = 'transform 0.3s ease';
                prevEl.style.transform = 'translateX(0)';
            }
            setUiState(prev => ({ ...prev, swipedCourseId: null }));
        }

        const el = document.getElementById(`course-${id}`);
        if (el) el.style.transition = 'transform 0.0s ease';
    }, [uiState.swipedCourseId]);

    const handleTouchMove = useCallback((e, id) => {
        const swipeRef = swipeRefs.current[id];
        if (!swipeRef) return;

        const deltaX = e.touches[0].clientX - swipeRef.startX;
        const el = document.getElementById(`course-${id}`);
        if (!el) return;

        const transformX = Math.max(-80, Math.min(0, deltaX));
        el.style.transform = `translateX(${transformX}px)`;
        swipeRef.currentX = transformX;
    }, []);

    const handleTouchEnd = useCallback((id) => {
        const swipeRef = swipeRefs.current[id];
        if (!swipeRef) return;

        const el = document.getElementById(`course-${id}`);
        if (el) el.style.transition = 'transform 0.3s ease';

        if (swipeRef.currentX <= -40) {
            if (el) el.style.transform = 'translateX(-80px)';
            setUiState(prev => ({ ...prev, swipedCourseId: id }));
        } else {
            if (el) el.style.transform = 'translateX(0)';
            setUiState(prev => ({ ...prev, swipedCourseId: null }));
        }

        swipeRefs.current[id] = null;
    }, []);

    // Course operations - memoized
    const handleAddCourse = useCallback(async (courseName, tournamentName, classification) => {
        if (!userId) {
            showAppMessage('error', "User not authenticated.");
            return;
        }

        try {
            await addCourse(courseName, tournamentName, classification, userId);
            toggleModal('addCourse', false);
            resetCourseForm();
            showAppMessage('success', `Course "${courseName}" added successfully!`);
        } catch (error) {
            console.error("Failed to add course:", error);
            showAppMessage('error', `Failed to add course: ${error.message}`);
        }
    }, [userId, showAppMessage, toggleModal, resetCourseForm]);

    const handleDeleteCourse = useCallback(async (id) => {
        if (!userId) {
            showAppMessage('error', "User not authenticated.");
            return;
        }

        try {
            const courseName = courses.find(c => c.id === id)?.name || 'selected course';
            await deleteCourse(id, userId);

            if (uiState.swipedCourseId === id) {
                setUiState(prev => ({ ...prev, swipedCourseId: null }));
            }
            if (selectedCourse?.id === id) {
                setSelectedCourse(null);
            }

            showAppMessage('success', `Course "${courseName}" deleted successfully!`);
        } catch (error) {
            console.error("Failed to delete course:", error);
            showAppMessage('error', `Failed to delete course: ${error.message}`);
        }
    }, [userId, courses, uiState.swipedCourseId, selectedCourse?.id, showAppMessage]);

    // Hole operations - memoized
    const handleDeleteHoleClick = useCallback((holeId) => {
        setUiState(prev => ({ ...prev, holeToDeleteId: holeId }));
        toggleModal('deleteConfirmation', true);
    }, [toggleModal]);

    const handleConfirmDeleteHole = useCallback(async () => {
        const { holeToDeleteId } = uiState;
        if (!selectedCourse || !userId || !holeToDeleteId) {
            showAppMessage('error', "User not authenticated or course not selected.");
            return;
        }

        try {
            const holeNumber = selectedCourse.holes.find(h => h.id === holeToDeleteId)?.number || '';
            await deleteHoleFromCourse(selectedCourse.id, holeToDeleteId, userId);

            toggleModal('deleteConfirmation', false);
            setUiState(prev => ({ ...prev, holeToDeleteId: null }));
            closeAllHoleEdits();
            showAppMessage('success', `Hole ${holeNumber} deleted successfully!`);
        } catch (error) {
            console.error("Failed to delete hole:", error);
            showAppMessage('error', `Failed to delete hole: ${error.message}`);
        }
    }, [selectedCourse, userId, uiState.holeToDeleteId, showAppMessage, toggleModal, closeAllHoleEdits]);

    const handleCancelDeleteHole = useCallback(() => {
        toggleModal('deleteConfirmation', false);
        setUiState(prev => ({ ...prev, holeToDeleteId: null }));
    }, [toggleModal]);

    const handleAddHole = useCallback(async (holeNumber, holePar, holeDistance, holeNote, discId = null) => {
        const newHole = {
            id: `${selectedCourse.id}-${Date.now()}`,
            number: holeNumber,
            par: parseInt(holePar, 10) || 0,
            distance: parseFloat(holeDistance) || null,
            note: holeNote || '',
            discId: discId,
        };

        try {
            await addHoleToCourse(selectedCourse.id, newHole, userId);
            toggleModal('addHole', false);
            showAppMessage('success', `Hole ${newHole.number} added successfully!`);
        } catch (error) {
            console.error("Failed to add hole:", error);
            showAppMessage('error', `Failed to add hole: ${error.message}`);
        }
    }, [selectedCourse, userId, toggleModal, showAppMessage]);

    const handleSaveHoleChanges = useCallback(async (holeId) => {
        const updatedHole = {
            id: holeId,
            number: editingHoleData.number,
            par: parseInt(editingHoleData.par, 10) || 0,
            distance: parseFloat(editingHoleData.distance) || null,
            note: editingHoleData.note || '',
            discId: editingHoleData.discId || null,
        };

        try {
            await updateHoleInCourse(selectedCourse.id, holeId, updatedHole, userId);
            setEditingHoleData({});
            closeAllHoleEdits();
            showAppMessage('success', `Hole ${updatedHole.number} changes saved!`);
        } catch (error) {
            console.error("Failed to save hole changes:", error);
            showAppMessage('error', `Failed to save hole changes: ${error.message}`);
        }
    }, [editingHoleData, selectedCourse, userId, closeAllHoleEdits, showAppMessage]);

    const backToList = useCallback(() => {
        closeAllHoleEdits();
        setSelectedCourse(null);
    }, [closeAllHoleEdits]);

    const onDragEnd = useCallback(async (result) => {
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
    }, [selectedCourse, userId, showAppMessage]);

    // Memoized props objects to prevent unnecessary re-renders
    const holeListProps = useMemo(() => ({
        holes: selectedCourseHoles,
        editingHoleData,
        setEditingHoleData,
        toggleEditing: handleToggleEditingHole,
        saveHoleChanges: handleSaveHoleChanges,
        deleteHole: handleDeleteHoleClick,
        onDragEnd,
        discs,
        backToList
    }), [
        selectedCourseHoles,
        editingHoleData,
        handleToggleEditingHole,
        handleSaveHoleChanges,
        handleDeleteHoleClick,
        onDragEnd,
        discs,
        backToList
    ]);

    const courseListProps = useMemo(() => ({
        courses: sortedCourses,
        onSelectCourse: setSelectedCourse,
        onDeleteCourse: handleDeleteCourse,
        swipedCourseId: uiState.swipedCourseId,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd
    }), [
        sortedCourses,
        handleDeleteCourse,
        uiState.swipedCourseId,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    ]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (messageTimeoutRef.current) {
                clearTimeout(messageTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div ref={scrollContainerRef} className="max-h-screen bg-gray-100 dark:bg-gray-900 p-4 overflow-y-auto pb-48">
            {uiState.appMessage.text && (
                <div className={`px-4 py-3 rounded relative mb-4
                    ${uiState.appMessage.type === 'success'
                        ? 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300'
                        : 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300'}`}
                    role="alert">
                    <span className="block sm:inline">{uiState.appMessage.text}</span>
                </div>
            )}

            {selectedCourse ? (
                <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900 p-4 pt-5">
                    <div className="text-center mb-6 pt-5">
                        <h2 className="text-2xl font-bold mb-3 dark:text-white">
                            {selectedCourse.name}
                        </h2>
                        {selectedCourse.tournamentName && (
                            <p className="text-lg text-gray-600 dark:text-gray-400">{selectedCourse.tournamentName}</p>
                        )}
                        {selectedCourse.classification && (
                            <p className="text-md text-gray-500 dark:text-gray-500 italic">
                                Style: {selectedCourse.classification.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </p>
                        )}
                    </div>

                    <div ref={holeListRef}>
                        <HoleList {...holeListProps} />
                    </div>

                    <button
                        onClick={() => toggleModal('addHole', true)}
                        className="fixed bottom-24 right-4 !bg-blue-600 hover:bg-blue-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-40"
                        aria-label="Add Hole">
                        <span className="text-2xl">＋</span>
                    </button>

                    <AddHoleModal
                        isOpen={modals.addHole}
                        onClose={() => toggleModal('addHole', false)}
                        onAddHole={handleAddHole}
                        discs={discs}
                    />

                    <DeleteConfirmationModal
                        isOpen={modals.deleteConfirmation}
                        onClose={handleCancelDeleteHole}
                        onConfirm={handleConfirmDeleteHole}
                        message={`Are you sure you want to delete Hole ${selectedCourse.holes.find(h => h.id === uiState.holeToDeleteId)?.number || ''}? This cannot be undone.`}
                    />
                </div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold mb-3 text-center pt-5 dark:text-white">Your Courses</h2>
                    <p className='text-center text-gray-600 dark:text-gray-400'>Beyond the scorecard, this is your tactical journal. </p>
                    <p className='text-center text-gray-600 dark:text-gray-400 mb-6'>Break down every hole and craft the strategy to shave strokes off your game.</p>

                    <button
                        onClick={() => toggleModal('addCourse', true)}
                        className="fixed bottom-24 right-4 !bg-blue-600 hover:bg-blue-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-40"
                        aria-label="Add Course">
                        <span className="text-2xl">＋</span>
                    </button>

                    <AddCourseModal
                        isOpen={modals.addCourse}
                        onClose={() => toggleModal('addCourse', false)}
                        onSubmit={handleAddCourse}
                        newCourseName={courseForm.name}
                        setNewCourseName={(value) => updateCourseForm('name', value)}
                        newCourseTournamentName={courseForm.tournamentName}
                        setNewCourseTournamentName={(value) => updateCourseForm('tournamentName', value)}
                        newCourseClassification={courseForm.classification}
                        setNewCourseClassification={(value) => updateCourseForm('classification', value)}
                    />

                    <CourseList {...courseListProps} />
                </>
            )}
        </div>
    );
}