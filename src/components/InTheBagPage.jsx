// src/components/InTheBagPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from "../firebase";
import DiscFormModal from '../components/AddDiscModal'; // Renamed conceptually to DiscFormModal
import {
    addDiscToBag,
    subscribeToUserDiscs,
    subscribeToArchivedUserDiscs,
    updateDiscInBag,
    deleteDiscFromBag
} from '../services/firestoreService';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Archive, FolderOpen, ChevronDown, ChevronUp, Pencil, MoreVertical } from 'lucide-react'; // Added MoreVertical icon

// Reusable Accordion Component
const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md mx-auto mb-6">
            <button
                className="w-full flex justify-between items-center p-6 text-xl font-semibold text-gray-800 dark:text-white focus:outline-none !bg-white dark:!bg-gray-800 rounded-lg"
                onClick={toggleAccordion}
                aria-expanded={isOpen}
            >
                {title}
                {isOpen ? <ChevronUp size={24} className="text-gray-800 dark:text-white" /> : <ChevronDown size={24} className="text-gray-800 dark:text-white" />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {children}
                </div>
            )}
        </div>
    );
};

export default function InTheBagPage() {
    const { user: currentUser } = useFirebase();
    const [activeDiscs, setActiveDiscs] = useState([]);
    const [archivedDiscs, setArchivedDiscs] = useState([]);
    const [isAddDiscModalOpen, setIsAddDiscModalOpen] = useState(false);

    // State for editing discs
    const [isEditDiscModalOpen, setIsEditDiscModalOpen] = useState(false);
    const [currentDiscToEdit, setCurrentDiscToEdit] = useState(null);

    // State for new disc input fields (will be used by the modal for both add and edit)
    const [newDiscName, setNewDiscName] = useState('');
    const [newDiscManufacturer, setNewDiscManufacturer] = useState('');
    const [newDiscType, setNewDiscType] = useState('');
    const [newDiscPlastic, setNewDiscPlastic] = useState('');

    // State to track which disc's action menu is open
    const [openDiscActionsId, setOpenDiscActionsId] = useState(null);
    // Ref for detecting clicks outside the dropdown
    const dropdownRef = useRef(null);

    // FAB state and refs
    const [showFab, setShowFab] = useState(true);
    const lastScrollY = useRef(0);
    const scrollContainerRef = useRef(null);

    // Refs for native drag and drop
    const draggedItem = useRef(null); // Stores the disc being dragged { id, type }
    const dragOverTarget = useRef(null); // Stores the disc ID being dragged over

    // --- Real-time Subscription for Discs ---
    useEffect(() => {
        let unsubscribeActive;
        let unsubscribeArchived;

        if (currentUser && currentUser.uid) {
            console.log("Subscribing to active discs for user:", currentUser.uid);
            unsubscribeActive = subscribeToUserDiscs(currentUser.uid, (fetchedDiscs) => {
                // Ensure discs have a displayOrder for sorting, assign 0 if missing
                // Firestore query now handles ordering, so local sort is primarily for initial state consistency
                const discsWithOrder = fetchedDiscs.map(disc => ({
                    ...disc,
                    displayOrder: disc.displayOrder !== undefined ? disc.displayOrder : 0
                }));
                setActiveDiscs(discsWithOrder); // No need to sort here if Firestore query is ordered
            });

            console.log("Subscribing to archived discs for user:", currentUser.uid);
            unsubscribeArchived = subscribeToArchivedUserDiscs(currentUser.uid, (fetchedDiscs) => {
                const discsWithOrder = fetchedDiscs.map(disc => ({
                    ...disc,
                    displayOrder: disc.displayOrder !== undefined ? disc.displayOrder : 0
                }));
                setArchivedDiscs(discsWithOrder); // No need to sort here if Firestore query is ordered
            });
        } else {
            setActiveDiscs([]);
            setArchivedDiscs([]);
            console.log("No current user found, not subscribing to discs.");
        }

        return () => {
            if (unsubscribeActive) {
                console.log("Unsubscribing from active discs.");
                unsubscribeActive();
            }
            if (unsubscribeArchived) {
                console.log("Unsubscribing from archived discs.");
                unsubscribeArchived();
            }
        };
    }, [currentUser]);

    // --- FAB Scroll Logic ---
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
                if (currentScrollY > lastScrollY.current) {
                    setShowFab(false);
                } else {
                    setShowFab(true);
                }
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Click outside to close disc actions dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDiscActionsId && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDiscActionsId(null);
            }
        };

        if (openDiscActionsId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDiscActionsId]);

    // --- Modal Handlers ---
    const openAddDiscModal = () => {
        setCurrentDiscToEdit(null);
        setNewDiscName('');
        setNewDiscManufacturer('');
        setNewDiscType('');
        setNewDiscPlastic('');
        setIsAddDiscModalOpen(true);
        setOpenDiscActionsId(null);
    };

    const closeAddDiscModal = () => {
        setIsAddDiscModalOpen(false);
        setNewDiscName('');
        setNewDiscManufacturer('');
        setNewDiscType('');
        setNewDiscPlastic('');
    };

    // Open Edit Disc Modal
    const openEditDiscModal = (disc) => {
        setCurrentDiscToEdit(disc);
        setNewDiscName(disc.name);
        setNewDiscManufacturer(disc.manufacturer);
        setNewDiscType(disc.type);
        setNewDiscPlastic(disc.plastic);
        setIsEditDiscModalOpen(true);
        setOpenDiscActionsId(null);
    };

    // Close Edit Disc Modal
    const closeEditDiscModal = () => {
        setIsEditDiscModalOpen(false);
        setCurrentDiscToEdit(null);
        setNewDiscName('');
        setNewDiscManufacturer('');
        setNewDiscType('');
        setNewDiscPlastic('');
    };

    // Toggle disc actions dropdown visibility
    const handleToggleDiscActions = (discId) => {
        setOpenDiscActionsId(prevId => (prevId === discId ? null : discId));
    };

    // --- Add/Edit Disc Submission Handler (unified) ---
    const handleSubmitDisc = async (name, manufacturer, type, plastic) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to manage discs.");
            return;
        }

        try {
            const discData = {
                name: name.trim(),
                manufacturer: manufacturer.trim(),
                type: type.trim(),
                plastic: plastic.trim(),
            };

            if (currentDiscToEdit) {
                await updateDiscInBag(currentUser.uid, currentDiscToEdit.id, discData);
                toast.success(`${name} updated successfully!`);
                closeEditDiscModal();
            } else {
                // When adding a new disc, assign it a displayOrder.
                // Find the maximum current order across both active and archived lists
                const allDiscs = [...activeDiscs, ...archivedDiscs];
                const maxOrder = allDiscs.length > 0 ? Math.max(...allDiscs.map(d => d.displayOrder || 0)) : -1;
                await addDiscToBag(currentUser.uid, { ...discData, isArchived: false, displayOrder: maxOrder + 1 });
                toast.success(`${name} added to your bag!`);
                closeAddDiscModal();
            }
        } catch (error) {
            console.error("Failed to save disc:", error);
            toast.error("Failed to save disc. Please try again.");
        }
    };

    // --- Native Drag and Drop Handlers ---

    /**
     * Helper function to reorder an array.
     * @param {Array} list - The array to reorder.
     * @param {number} startIndex - The starting index of the dragged item.
     * @param {number} endIndex - The target index for the dragged item.
     * @returns {Array} The reordered array.
     */
    const reorderArray = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    /**
     * Updates the displayOrder of discs in Firestore for a given list.
     * @param {Array} discsToUpdate - The array of discs with their new desired order.
     * @param {string} listType - 'active' or 'archived' for logging purposes.
     */
    const updateDiscOrdersInFirestore = async (discsToUpdate, listType) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to reorder discs.");
            return;
        }

        try {
            // Use Promise.all to send updates concurrently for better performance
            const updates = discsToUpdate.map((disc, index) => {
                if (disc.displayOrder !== index) { // Only update if order has changed
                    return updateDiscInBag(currentUser.uid, disc.id, { displayOrder: index });
                }
                return Promise.resolve(); // No update needed for this disc
            });
            await Promise.all(updates);
            toast.success(`Discs in '${listType}' reordered successfully!`);
        } catch (error) {
            console.error(`Failed to update disc order in Firestore for ${listType}:`, error);
            toast.error("Failed to save new disc order. Please try again.");
        }
    };

    const handleDragStart = (e, discId, discType) => {
        console.log(`DEBUG: Drag started for disc: ${discId}, type: ${discType}`); // Added debug log
        draggedItem.current = { id: discId, type: discType };
        e.dataTransfer.setData("text/plain", discId); // Set data for the drag operation
        e.dataTransfer.effectAllowed = "move"; // Visual cue for drag operation

        // Set a custom drag image to ensure the drag starts visually
        // Use the element itself as the drag image, with a slight offset
        e.dataTransfer.setDragImage(e.currentTarget, e.nativeEvent.offsetX, e.nativeEvent.offsetY);

        e.currentTarget.classList.add('opacity-50', 'border-blue-500', 'border-2'); // Visual feedback
    };

    const handleDragEnter = (e, discId) => {
        e.preventDefault(); // Allow drop
        console.log(`DEBUG: Drag entered target: ${discId}`); // Added debug log
        // Add a class to the item being dragged over for visual feedback
        if (e.currentTarget.id !== `disc-${draggedItem.current?.id}`) {
            e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900', 'scale-105', 'border-dashed', 'border-blue-500'); // Added border-dashed
            dragOverTarget.current = discId; // Store the ID of the element being dragged over
        }
    };

    const handleDragLeave = (e) => {
        console.log(`DEBUG: Drag left target: ${e.currentTarget.id}`); // Added debug log
        // Remove the class when dragging leaves an item
        e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'scale-105', 'border-dashed', 'border-blue-500'); // Removed border-dashed
        dragOverTarget.current = null; // Clear the drag over target
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = "move"; // Visual cue for drop
        // console.log("DEBUG: Dragging over..."); // Can be very noisy, uncomment if needed
    };

    const handleDragEnd = (e) => {
        console.log("DEBUG: Drag ended."); // Added debug log
        // Clean up visual feedback after drag ends
        e.currentTarget.classList.remove('opacity-50', 'border-blue-500', 'border-2');
        // Remove any lingering drag-over styles from all items
        document.querySelectorAll('.disc-item').forEach(item => {
            item.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'scale-105', 'border-dashed', 'border-blue-500'); // Removed border-dashed
        });
        draggedItem.current = null;
        dragOverTarget.current = null;
    };

    const handleDrop = async (e, targetDiscId, targetListType) => {
        e.preventDefault();
        console.log(`DEBUG: Drop occurred on target: ${targetDiscId}, listType: ${targetListType}`); // Added debug log
        e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'scale-105', 'border-dashed', 'border-blue-500'); // Clean up drag-over style

        // Retrieve the dragged disc ID from dataTransfer, which is the standard way
        const sourceDiscId = e.dataTransfer.getData("text/plain");
        const sourceListType = draggedItem.current?.type; // Use optional chaining in case draggedItem.current is null

        if (!sourceDiscId || !sourceListType) { // Check both for validity
            console.warn("Drag operation incomplete: sourceDiscId or sourceListType missing.");
            toast.error("Drag operation failed. Please try again."); // More user-friendly error
            return;
        }

        // If dropping on itself, or no actual movement, or trying to drop into an invalid area
        if (sourceDiscId === targetDiscId && sourceListType === targetListType) {
            console.log("DEBUG: Dropped on self or no effective movement.");
            return;
        }

        let currentSourceList = sourceListType === 'active' ? [...activeDiscs] : [...archivedDiscs];
        let currentTargetList = targetListType === 'active' ? [...activeDiscs] : [...archivedDiscs];

        const draggedDiscIndex = currentSourceList.findIndex(d => d.id === sourceDiscId);
        // If targetDiscId is null, it means we are dropping on the list background, so place at the end
        const targetIndex = targetDiscId ? currentTargetList.findIndex(d => d.id === targetDiscId) : currentTargetList.length;

        if (draggedDiscIndex === -1) {
            console.error("Dragged disc not found in source list.");
            toast.error("Error: Dragged disc not found.");
            return;
        }

        const movedDisc = { ...currentSourceList[draggedDiscIndex] };

        // Scenario 1: Reordering within the same list
        if (sourceListType === targetListType) {
            console.log("DEBUG: Reordering within the same list.");
            // Ensure targetIndex is valid for reordering
            const finalTargetIndex = targetIndex === -1 ? currentSourceList.length - 1 : targetIndex;
            const reorderedList = reorderArray(currentSourceList, draggedDiscIndex, finalTargetIndex);

            // Update local state immediately for responsiveness
            if (sourceListType === 'active') {
                setActiveDiscs(reorderedList);
            } else {
                setArchivedDiscs(reorderedList);
            }

            // Persist the new order to Firestore
            await updateDiscOrdersInFirestore(reorderedList, sourceListType);

        }
        // Scenario 2: Moving between active and archived lists
        else {
            console.log("DEBUG: Moving between lists.");
            // Remove from source list
            currentSourceList.splice(draggedDiscIndex, 1);

            // Update the 'isArchived' status of the moved disc
            movedDisc.isArchived = (targetListType === 'archived');

            // Add to target list at the correct position
            // If targetIndex is -1 (e.g., dropping into an empty list), append it.
            if (targetIndex === -1) {
                currentTargetList.push(movedDisc);
            } else {
                currentTargetList.splice(targetIndex, 0, movedDisc);
            }

            // Update local states immediately
            if (sourceListType === 'active') {
                setActiveDiscs(currentSourceList);
                setArchivedDiscs(currentTargetList);
            } else {
                setArchivedDiscs(currentSourceList);
                setActiveDiscs(currentTargetList);
            }

            // Update Firestore for the moved disc's archived status
            // This also triggers the onSnapshot listeners, which will then re-sort and update displayOrder
            try {
                await updateDiscInBag(currentUser.uid, movedDisc.id, { isArchived: movedDisc.isArchived });
                toast.success(`${movedDisc.name} ${movedDisc.isArchived ? 'moved to Shelf' : 'restored to Bag'}!`);

                // Re-index both lists in Firestore after a cross-list move
                // This is crucial to maintain contiguous displayOrder values in both lists.
                await updateDiscOrdersInFirestore(currentSourceList, sourceListType);
                await updateDiscOrdersInFirestore(currentTargetList, targetListType);

            } catch (error) {
                console.error("Failed to move disc between lists:", error);
                toast.error("Failed to move disc. Please try again.");
            }
        }
    };


    // --- Archive Disc Handler (kept for dropdown menu) ---
    const handleArchiveDisc = async (discId, discName) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to archive a disc.");
            return;
        }
        // Using a custom modal instead of window.confirm
        // For this example, I'm keeping window.confirm for brevity, but in a real app, replace it.
        if (window.confirm(`Are you sure you want to put ${discName} on the shelf?`)) {
            try {
                await updateDiscInBag(currentUser.uid, discId, { isArchived: true });
                toast.success(`${discName} moved to 'On the Shelf'!`);
                setOpenDiscActionsId(null); // Close dropdown after action
            } catch (error) {
                console.error("Failed to archive disc:", error);
                toast.error("Failed to archive disc. Please try again.");
            }
        }
    };

    // --- Restore Disc Handler (kept for dropdown menu) ---
    const handleRestoreDisc = async (discId, discName) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to restore a disc.");
            return;
        }
        try {
            await updateDiscInBag(currentUser.uid, discId, { isArchived: false });
            toast.success(`${discName} restored to your bag!`);
            setOpenDiscActionsId(null); // Close dropdown after action
        } catch (error) {
            console.error("Failed to restore disc:", error);
            toast.error("Failed to restore disc. Please try again.");
        }
    };

    // --- Delete Disc Handler ---
    const handleDeleteDisc = async (discId, discName) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to delete a disc.");
            return;
        }

        // Using a custom modal instead of window.confirm
        // For this example, I'm keeping window.confirm for brevity, but in a real app, replace it.
        if (window.confirm(`Are you sure you want to permanently delete ${discName}? This cannot be undone.`)) {
            try {
                await deleteDiscFromBag(currentUser.uid, discId);
                toast.success(`${discName} permanently deleted.`);
                setOpenDiscActionsId(null); // Close dropdown after action
            } catch (error) {
                console.error("Failed to delete disc:", error);
                toast.error("Failed to delete disc. Please try again.");
            }
        }
    };

    // --- Group active discs by type ---
    const groupedActiveDiscs = activeDiscs.reduce((acc, disc) => {
        const type = (disc.type && disc.type.trim() !== '') ? disc.type : 'Other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(disc);
        return acc;
    }, {});

    // --- Group archived discs by type ---
    const groupedArchivedDiscs = archivedDiscs.reduce((acc, disc) => {
        const type = (disc.type && disc.type.trim() !== '') ? disc.type : 'Other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(disc);
        return acc;
    }, {});

    // Define the desired order of disc types for display
    const discTypeOrder = [
        'Distance Driver',
        'Fairway Driver',
        'Mid-range',
        'Putter',
        'Hybrid',
        'Other'
    ];

    // Create a sorted list of types that actually exist in the grouped active discs
    const sortedActiveDiscTypes = discTypeOrder.filter(type => groupedActiveDiscs[type]);
    Object.keys(groupedActiveDiscs).forEach(type => {
        if (!sortedActiveDiscTypes.includes(type)) {
            sortedActiveDiscTypes.push(type);
        }
    });

    // Create a sorted list of types that actually exist in the grouped archived discs
    const sortedArchivedDiscTypes = discTypeOrder.filter(type => groupedArchivedDiscs[type]);
    Object.keys(groupedArchivedDiscs).forEach(type => {
        if (!sortedArchivedDiscTypes.includes(type)) {
            sortedArchivedDiscTypes.push(type);
        }
    });

    if (!currentUser) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-black">
                <p className="text-lg text-gray-700 dark:text-gray-300">Please log in to view and manage your disc bag.</p>
            </div>
        );
    }

    return (
        <div ref={scrollContainerRef} className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">

            <h2 className="text-2xl font-bold text-center pt-5">In Your Bag</h2>
            {/* Display active disc count */}
            {activeDiscs.length > 0 && (
                <p className="text-md text-gray-600 dark:text-gray-400 text-center mb-6">{activeDiscs.length} active discs</p>
            )}


            {activeDiscs.length === 0 && archivedDiscs.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-300 text-lg">
                    You haven't added any discs to your bag yet! Click the '+' button to get started.
                </p>
            ) : (
                <div className="space-y-8">
                    {sortedActiveDiscTypes.map(type => (
                        <div key={type}>
                            <h3 className="text-xl font-normal mb-4 text-blue-700 dark:text-blue-400 border-b-2 border-blue-200 dark:border-blue-700 pb-2">
                                {type}
                            </h3>
                            <ul
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                onDragOver={handleDragOver}
                                // onDrop here handles dropping into an empty category or on the list background
                                onDrop={(e) => handleDrop(e, null, 'active')}
                            >
                                {groupedActiveDiscs[type].map((disc) => (
                                    <li
                                        key={disc.id}
                                        id={`disc-${disc.id}`} // Add ID for easy targeting
                                        draggable="true" // Make it draggable
                                        onDragStart={(e) => handleDragStart(e, disc.id, 'active')}
                                        onDragEnter={(e) => handleDragEnter(e, disc.id)}
                                        onDragLeave={handleDragLeave}
                                        onDragEnd={handleDragEnd}
                                        onDrop={(e) => handleDrop(e, disc.id, 'active')} // Drop on another item
                                        className="disc-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200 ease-in-out relative cursor-grab" // Added cursor-grab
                                        style={{ userSelect: 'none' }} // Added user-select: none
                                        onMouseDown={() => console.log(`DEBUG: Mouse down on disc: ${disc.id}`)} // Added mousedown log
                                    >
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                                                {disc.manufacturer} {disc.plastic ? `${disc.plastic} ` : ''}{disc.name}
                                            </h4>
                                        </div>
                                        <div className="relative"> {/* Container for the gear icon and dropdown */}
                                            <button
                                                onClick={() => {
                                                    console.log(`DEBUG: MoreVertical button clicked for disc: ${disc.id}`); // Added log
                                                    handleToggleDiscActions(disc.id);
                                                }}
                                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                title="Disc Options"
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {openDiscActionsId === disc.id && (
                                                <div
                                                    ref={dropdownRef} // Attach ref to the currently open dropdown
                                                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600"
                                                >
                                                    <button
                                                        onClick={() => openEditDiscModal(disc)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md"
                                                    >
                                                        <Pencil size={16} className="mr-2" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleArchiveDisc(disc.id, disc.name)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                    >
                                                        <Archive size={16} className="mr-2" /> Move to Shelf
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDisc(disc.id, disc.name)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-b-md"
                                                    >
                                                        <FaTrash size={16} className="mr-2" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* On the Shelf (Archived Discs) Accordion */}
            {archivedDiscs.length > 0 && (
                <div className="mt-8">
                    <Accordion title={`On the Shelf (${archivedDiscs.length} discs)`} defaultOpen={false}>
                        <div className="space-y-8">
                            {sortedArchivedDiscTypes.map(type => (
                                <div key={`archived-${type}`}>
                                    <h3 className="text-xl font-normal mb-4 text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600 pb-2">
                                        {type} (Archived)
                                    </h3>
                                    <ul
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                        onDragOver={handleDragOver}
                                        // onDrop here handles dropping into an empty category or on the list background
                                        onDrop={(e) => handleDrop(e, null, 'archived')}
                                    >
                                        {groupedArchivedDiscs[type].map((disc) => (
                                            <li
                                                key={disc.id}
                                                id={`disc-${disc.id}`} // Add ID for easy targeting
                                                draggable="true" // Make it draggable
                                                onDragStart={(e) => handleDragStart(e, disc.id, 'archived')}
                                                onDragEnter={(e) => handleDragEnter(e, disc.id)}
                                                onDragLeave={handleDragLeave}
                                                onDragEnd={handleDragEnd}
                                                onDrop={(e) => handleDrop(e, disc.id, 'archived')} // Drop on another item
                                                className="disc-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200 ease-in-out relative cursor-grab" // Added cursor-grab
                                                style={{ userSelect: 'none' }} // Added user-select: none
                                                onMouseDown={() => console.log(`DEBUG: Mouse down on disc: ${disc.id}`)} // Added mousedown log
                                            >
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                                                        {disc.manufacturer} {disc.plastic ? `${disc.plastic} ` : ''}{disc.name}
                                                    </h4>
                                                </div>
                                                <div className="relative"> {/* Container for the gear icon and dropdown */}
                                                    <button
                                                        onClick={() => {
                                                            console.log(`DEBUG: MoreVertical button clicked for disc: ${disc.id}`); // Added log
                                                            handleToggleDiscActions(disc.id);
                                                        }}
                                                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        title="Disc Options"
                                                    >
                                                        <MoreVertical size={20} />
                                                    </button>

                                                    {openDiscActionsId === disc.id && (
                                                        <div
                                                            ref={dropdownRef} // Attach ref to the currently open dropdown
                                                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600"
                                                        >
                                                            <button
                                                                onClick={() => openEditDiscModal(disc)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md"
                                                            >
                                                                <Pencil size={16} className="mr-2" /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleRestoreDisc(disc.id, disc.name)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900"
                                                            >
                                                                <FolderOpen size={16} className="mr-2" /> Add to Bag
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDisc(disc.id, disc.name)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-b-md"
                                                            >
                                                                <FaTrash size={16} className="mr-2" /> Delete Permanently
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </Accordion>
                </div>
            )}


            {/* FAB for Add Disc */}
            <button
                onClick={openAddDiscModal}
                className={`fixed bottom-6 right-6 !bg-blue-600 hover:bg-blue-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50
                    transition-transform duration-300 ease-in-out
                    ${showFab ? 'translate-y-0' : 'translate-y-24'}`}
                aria-label="Add New Disc"
            >
                <span className="text-2xl">＋</span>
            </button>

            {/* Add Disc Modal (for adding new discs) */}
            <DiscFormModal
                isOpen={isAddDiscModalOpen}
                onClose={closeAddDiscModal}
                onSubmit={handleSubmitDisc}
                newDiscName={newDiscName}
                setNewDiscName={setNewDiscName}
                newDiscManufacturer={newDiscManufacturer}
                setNewDiscManufacturer={setNewDiscManufacturer}
                newDiscType={newDiscType}
                setNewDiscType={setNewDiscType}
                newDiscPlastic={newDiscPlastic}
                setNewDiscPlastic={setNewDiscPlastic}
                isEditing={false}
            />

            {/* Edit Disc Modal (for editing existing discs) */}
            <DiscFormModal
                isOpen={isEditDiscModalOpen}
                onClose={closeEditDiscModal}
                onSubmit={handleSubmitDisc}
                initialDiscData={currentDiscToEdit}
                newDiscName={newDiscName}
                setNewDiscName={setNewDiscName}
                newDiscManufacturer={newDiscManufacturer}
                setNewDiscManufacturer={setNewDiscManufacturer}
                newDiscType={newDiscType}
                setNewDiscType={setNewDiscType}
                newDiscPlastic={newDiscPlastic}
                setNewDiscPlastic={setNewDiscPlastic}
                isEditing={true}
            />
        </div>
    );
}
