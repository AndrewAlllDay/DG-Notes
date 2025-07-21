import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from "../firebase";
import DiscFormModal from '../components/AddDiscModal';
import {
    addDiscToBag,
    subscribeToUserDiscs,
    subscribeToArchivedUserDiscs,
    updateDiscInBag,
    deleteDiscFromBag
} from '../services/firestoreService';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Archive, FolderOpen, ChevronDown, ChevronUp, Pencil, MoreVertical } from 'lucide-react';

// Reusable Accordion Component
const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-full mx-auto mb-6">
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
    const [isDiscFormModalOpen, setIsDiscFormModalOpen] = useState(false);

    const [currentDiscToEdit, setCurrentDiscToEdit] = useState(null);

    const [newDiscName, setNewDiscName] = useState('');
    const [newDiscManufacturer, setNewDiscManufacturer] = useState('');
    const [newDiscType, setNewDiscType] = useState('');
    const [newDiscPlastic, setNewDiscPlastic] = useState('');
    const [newDiscColor, setNewDiscColor] = useState('');
    const [newDiscStability, setNewDiscStability] = useState('');

    const [openDiscActionsId, setOpenDiscActionsId] = useState(null);
    const dropdownRef = useRef(null);

    const [showFab, setShowFab] = useState(true);

    const draggedItem = useRef(null);
    const dragOverTarget = useRef(null);

    useEffect(() => {
        let unsubscribeActive;
        let unsubscribeArchived;

        if (currentUser && currentUser.uid) {
            console.log("Subscribing to active discs for user:", currentUser.uid);
            unsubscribeActive = subscribeToUserDiscs(currentUser.uid, (fetchedDiscs) => {
                const discsWithOrder = fetchedDiscs.map(disc => ({
                    ...disc,
                    displayOrder: disc.displayOrder !== undefined ? disc.displayOrder : 0
                }));
                setActiveDiscs(discsWithOrder);
                console.log("Active discs updated:", discsWithOrder);
            });

            console.log("Subscribing to archived discs for user:", currentUser.uid);
            unsubscribeArchived = subscribeToArchivedUserDiscs(currentUser.uid, (fetchedDiscs) => {
                const discsWithOrder = fetchedDiscs.map(disc => ({
                    ...disc,
                    displayOrder: disc.displayOrder !== undefined ? disc.displayOrder : 0
                }));
                setArchivedDiscs(discsWithOrder);
                console.log("Archived discs updated:", discsWithOrder);
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDiscActionsId && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDiscActionsId(null);
                console.log("Closing disc actions dropdown due to outside click.");
            }
        };

        if (openDiscActionsId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openDiscActionsId]);

    const openAddDiscModal = () => {
        setCurrentDiscToEdit(null);
        setNewDiscName('');
        setNewDiscManufacturer('');
        setNewDiscType('');
        setNewDiscPlastic('');
        setNewDiscColor('');
        setNewDiscStability('');
        setIsDiscFormModalOpen(true);
        setOpenDiscActionsId(null);
        console.log("Opening Add Disc Modal.");
    };

    const openEditDiscModal = (disc) => {
        setCurrentDiscToEdit(disc);
        setNewDiscName(disc.name);
        setNewDiscManufacturer(disc.manufacturer);
        setNewDiscType(disc.type);
        setNewDiscPlastic(disc.plastic);
        setNewDiscColor(disc.color || '');
        setNewDiscStability(disc.stability !== undefined && disc.stability !== null ? String(disc.stability) : '');
        setIsDiscFormModalOpen(true);
        setOpenDiscActionsId(null);
        console.log("Opening Edit Disc Modal for disc:", disc.id);
    };

    const closeDiscFormModal = () => {
        setIsDiscFormModalOpen(false);
        setCurrentDiscToEdit(null);
        setNewDiscName('');
        setNewDiscManufacturer('');
        setNewDiscType('');
        setNewDiscPlastic('');
        setNewDiscColor('');
        setNewDiscStability('');
        console.log("Closing Disc Form Modal.");
    };

    const handleToggleDiscActions = (discId) => {
        setOpenDiscActionsId(prevId => {
            const newState = (prevId === discId ? null : discId);
            console.log(`Toggling disc actions for ${discId}. New state: ${newState ? 'Open' : 'Closed'}`);
            return newState;
        });
    };

    const handleSubmitDisc = async (name, manufacturer, type, plastic, color, stability) => {
        console.log("Attempting to save disc:", { name, manufacturer, type, plastic, color, stability });
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to manage discs.");
            console.error("User not logged in, cannot save disc.");
            return;
        }

        try {
            const parsedStability = stability === '' ? null : parseFloat(stability);

            if (stability !== '' && isNaN(parsedStability)) {
                toast.error("Stability must be a valid number (e.g., -2, 0, 1.5).");
                console.error("Invalid stability value entered:", stability);
                return;
            }

            const discData = {
                name: name.trim(),
                manufacturer: manufacturer.trim(),
                type: type.trim(),
                plastic: plastic.trim(),
                color: color.trim(),
                stability: parsedStability,
            };

            if (currentDiscToEdit) {
                await updateDiscInBag(currentUser.uid, currentDiscToEdit.id, discData);
                toast.success(`${name} updated successfully!`);
                closeDiscFormModal();
                console.log("Disc updated successfully:", discData);
            } else {
                const allDiscs = [...activeDiscs, ...archivedDiscs];
                const maxOrder = allDiscs.length > 0 ? Math.max(...allDiscs.map(d => d.displayOrder || 0)) : -1;
                await addDiscToBag(currentUser.uid, { ...discData, isArchived: false, displayOrder: maxOrder + 1 });
                toast.success(`${name} added to your bag!`);
                closeDiscFormModal();
                console.log("Disc added successfully:", discData);
            }
        } catch (error) {
            console.error("Failed to save disc:", error);
            toast.error("Failed to save disc. Please try again.");
        }
    };

    const reorderArray = (list, startIndex, endIndex) => {
        console.log(`Reordering array: startIndex=${startIndex}, endIndex=${endIndex}`);
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const updateDiscOrdersInFirestore = async (discsToUpdate, listType) => {
        console.log(`Updating disc orders in Firestore for ${listType} list.`);
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to reorder discs.");
            console.error("User not logged in, cannot reorder discs.");
            return;
        }

        try {
            const updates = discsToUpdate.map((disc, index) => {
                if (disc.displayOrder !== index) {
                    console.log(`Updating disc ${disc.id} displayOrder from ${disc.displayOrder} to ${index}`);
                    return updateDiscInBag(currentUser.uid, disc.id, { displayOrder: index });
                }
                return Promise.resolve();
            });
            await Promise.all(updates);
            toast.success(`Discs in '${listType}' reordered successfully!`);
            console.log(`Disc orders in '${listType}' updated successfully in Firestore.`);
        } catch (error) {
            console.error(`Failed to update disc order in Firestore for ${listType}:`, error);
            toast.error("Failed to save new disc order. Please try again.");
        }
    };

    const handleDragStart = (e, discId, discType) => {
        console.log(`DEBUG: Drag started for disc: ${discId}, type: ${discType}`);
        draggedItem.current = { id: discId, type: discType };
        e.dataTransfer.setData("text/plain", discId);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setDragImage(e.currentTarget, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        e.currentTarget.classList.add('opacity-50', 'border-blue-500', 'border-2');
        console.log(`Drag image set for disc ${discId}.`);
    };

    const handleDragEnter = (e, discId) => {
        e.preventDefault();
        console.log(`DEBUG: Drag entered target: ${discId}`);
        if (e.currentTarget.id !== `disc-${draggedItem.current?.id}`) {
            e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900', 'scale-105', 'border-dashed', 'border-blue-500');
            dragOverTarget.current = discId;
            console.log(`Highlighting drag target: ${discId}`);
        }
    };

    const handleDragLeave = (e) => {
        console.log(`DEBUG: Drag left target: ${e.currentTarget.id}`);
        e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'scale-105', 'border-dashed', 'border-blue-500');
        dragOverTarget.current = null;
        console.log(`Removing highlight from drag target: ${e.currentTarget.id}`);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        console.log("DEBUG: Drag over.");
    };

    const handleDragEnd = (e) => {
        console.log("DEBUG: Drag ended.");
        e.currentTarget.classList.remove('opacity-50', 'border-blue-500', 'border-2');
        document.querySelectorAll('.disc-item').forEach(item => {
            item.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'scale-105', 'border-dashed', 'border-blue-500');
        });
        draggedItem.current = null;
        dragOverTarget.current = null;
        console.log("Resetting drag state and removing all drag highlights.");
    };

    const handleDrop = async (e, targetDiscId, targetListType) => {
        e.preventDefault();
        console.log(`DEBUG: Drop occurred on target: ${targetDiscId}, listType: ${targetListType}`);
        e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'scale-105', 'border-dashed', 'border-blue-500');

        const sourceDiscId = e.dataTransfer.getData("text/plain");
        const sourceListType = draggedItem.current?.type;

        console.log(`Source Disc ID: ${sourceDiscId}, Source List Type: ${sourceListType}`);

        if (!sourceDiscId || !sourceListType) {
            console.warn("Drag operation incomplete: sourceDiscId or sourceListType missing.");
            toast.error("Drag operation failed. Please try again.");
            return;
        }

        if (sourceDiscId === targetDiscId && sourceListType === targetListType) {
            console.log("DEBUG: Dropped on self or no effective movement.");
            return;
        }

        let currentSourceList = sourceListType === 'active' ? [...activeDiscs] : [...archivedDiscs];
        let currentTargetList = targetListType === 'active' ? [...activeDiscs] : [...archivedDiscs];

        const draggedDiscIndex = currentSourceList.findIndex(d => d.id === sourceDiscId);
        const targetIndex = targetDiscId ? currentTargetList.findIndex(d => d.id === targetDiscId) : currentTargetList.length;

        console.log(`Dragged disc index: ${draggedDiscIndex}, Target index: ${targetIndex}`);

        if (draggedDiscIndex === -1) {
            console.error("Dragged disc not found in source list.");
            toast.error("Error: Dragged disc not found.");
            return;
        }

        const movedDisc = { ...currentSourceList[draggedDiscIndex] };

        if (sourceListType === targetListType) {
            console.log("DEBUG: Reordering within the same list.");
            const finalTargetIndex = targetIndex === -1 ? currentSourceList.length - 1 : targetIndex;
            const reorderedList = reorderArray(currentSourceList, draggedDiscIndex, finalTargetIndex);

            if (sourceListType === 'active') {
                setActiveDiscs(reorderedList);
                console.log("Active discs reordered locally.");
            } else {
                setArchivedDiscs(reorderedList);
                console.log("Archived discs reordered locally.");
            }

            await updateDiscOrdersInFirestore(reorderedList, sourceListType);

        } else {
            console.log("DEBUG: Moving between lists.");
            currentSourceList.splice(draggedDiscIndex, 1);
            movedDisc.isArchived = (targetListType === 'archived');
            if (targetIndex === -1) {
                currentTargetList.push(movedDisc);
            } else {
                currentTargetList.splice(targetIndex, 0, movedDisc);
            }

            if (sourceListType === 'active') {
                setActiveDiscs(currentSourceList);
                setArchivedDiscs(currentTargetList);
                console.log("Disc moved from active to archived lists locally.");
            } else {
                setArchivedDiscs(currentSourceList);
                setActiveDiscs(currentTargetList);
                console.log("Disc moved from archived to active lists locally.");
            }

            try {
                await updateDiscInBag(currentUser.uid, movedDisc.id, { isArchived: movedDisc.isArchived });
                toast.success(`${movedDisc.name} ${movedDisc.isArchived ? 'moved to Shelf' : 'restored to Bag'}!`);
                console.log(`Firestore updated for disc ${movedDisc.id} isArchived status to ${movedDisc.isArchived}.`);
                await updateDiscOrdersInFirestore(currentSourceList, sourceListType);
                await updateDiscOrdersInFirestore(currentTargetList, targetListType);
            } catch (error) {
                console.error("Failed to move disc between lists:", error);
                toast.error("Failed to move disc. Please try again.");
            }
        }
    };

    const handleArchiveDisc = async (discId, discName) => {
        console.log(`Attempting to archive disc: ${discName} (${discId})`);
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to archive a disc.");
            console.error("User not logged in, cannot archive disc.");
            return;
        }
        try {
            await updateDiscInBag(currentUser.uid, discId, { isArchived: true });
            toast.success(`${discName} moved to 'On the Shelf'!`);
            setOpenDiscActionsId(null);
            console.log(`${discName} archived successfully.`);
        } catch (error) {
            console.error("Failed to archive disc:", error);
            toast.error("Failed to archive disc. Please try again.");
        }
    };

    const handleRestoreDisc = async (discId, discName) => {
        console.log(`Attempting to restore disc: ${discName} (${discId})`);
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to restore a disc.");
            console.error("User not logged in, cannot restore disc.");
            return;
        }
        try {
            await updateDiscInBag(currentUser.uid, discId, { isArchived: false });
            toast.success(`${discName} restored to your bag!`);
            setOpenDiscActionsId(null);
            console.log(`${discName} restored successfully.`);
        } catch (error) {
            console.error("Failed to restore disc:", error);
            toast.error("Failed to restore disc. Please try again.");
        }
    };

    const handleDeleteDisc = async (discId, discName) => {
        console.log(`Attempting to delete disc: ${discName} (${discId})`);
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to delete a disc.");
            console.error("User not logged in, cannot delete disc.");
            return;
        }

        if (window.confirm(`Are you sure you want to permanently delete ${discName}? This cannot be undone.`)) {
            try {
                await deleteDiscFromBag(currentUser.uid, discId);
                toast.success(`${discName} permanently deleted.`);
                setOpenDiscActionsId(null);
                console.log(`${discName} deleted permanently.`);
            } catch (error) {
                console.error("Failed to delete disc:", error);
                toast.error("Failed to delete disc. Please try again.");
            }
        }
    };

    const groupedActiveDiscs = activeDiscs.reduce((acc, disc) => {
        const type = (disc.type && disc.type.trim() !== '') ? disc.type : 'Other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(disc);
        return acc;
    }, {});

    for (const type in groupedActiveDiscs) {
        groupedActiveDiscs[type].sort((a, b) => {
            const stabilityA = a.stability !== undefined && a.stability !== null ? a.stability : Infinity;
            const stabilityB = b.stability !== undefined && b.stability !== null ? b.stability : Infinity;
            return stabilityA - stabilityB;
        });
    }

    const groupedArchivedDiscs = archivedDiscs.reduce((acc, disc) => {
        const type = (disc.type && disc.type.trim() !== '') ? disc.type : 'Other';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(disc);
        return acc;
    }, {});

    for (const type in groupedArchivedDiscs) {
        groupedArchivedDiscs[type].sort((a, b) => {
            const stabilityA = a.stability !== undefined && a.stability !== null ? a.stability : Infinity;
            const stabilityB = b.stability !== undefined && b.stability !== null ? b.stability : Infinity;
            return stabilityB - stabilityA;
        });
    }

    const discTypeOrder = [
        'Distance Driver',
        'Fairway Driver',
        'Midrange',
        'Putt/Approach',
        'Hybrid',
        'Other'
    ];

    const sortedActiveDiscTypes = discTypeOrder.filter(type => groupedActiveDiscs[type]);
    Object.keys(groupedActiveDiscs).forEach(type => {
        if (!sortedActiveDiscTypes.includes(type)) {
            sortedActiveDiscTypes.push(type);
        }
    });

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
        // --- UPDATED THIS LINE ---
        <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8 pb-28">

            <h2 className="text-2xl font-bold text-center pt-5 mb-2">In Your Bag</h2>
            {activeDiscs.length > 0 && (
                <p className="text-md text-gray-600 dark:text-gray-400 text-center mb-6">{activeDiscs.length} active discs</p>
            )}

            {activeDiscs.length === 0 && archivedDiscs.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-300 text-lg">
                    You haven't added any discs to your bag yet! Click the '+' button to get started.
                </p>
            ) : (
                <div className="space-y-4">
                    {sortedActiveDiscTypes.map(type => (
                        <Accordion
                            key={type}
                            title={
                                <span className='text-blue-700 dark:text-blue-400'>
                                    {type} <span className='text-black dark:text-white text-base'>({groupedActiveDiscs[type].length} discs)</span>
                                </span>
                            }
                            defaultOpen={false}
                        >
                            <ul
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, null, 'active')}
                            >
                                {groupedActiveDiscs[type].map((disc) => (
                                    <li
                                        key={disc.id}
                                        id={`disc-${disc.id}`}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, disc.id, 'active')}
                                        onDragEnter={(e) => handleDragEnter(e, disc.id)}
                                        onDragLeave={handleDragLeave}
                                        onDragEnd={handleDragEnd}
                                        onDrop={(e) => handleDrop(e, disc.id, 'active')}
                                        className="disc-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200 ease-in-out relative cursor-grab"
                                        style={{ userSelect: 'none' }}
                                        onMouseDown={() => console.log(`DEBUG: Mouse down on disc: ${disc.id}`)}
                                    >
                                        <div>
                                            <h4 className="text-lg font-normal text-gray-800 dark:text-white">
                                                <span className='font-bold'>{disc.manufacturer}</span> {disc.plastic ? `${disc.plastic}` : ''} {disc.name}
                                            </h4>
                                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                {disc.color ? `${disc.color}` : ''}
                                                {(disc.stability !== undefined && disc.stability !== null) ? ` | Stability: ${disc.stability}` : ''}
                                            </p>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    console.log(`DEBUG: MoreVertical button clicked for disc: ${disc.id}`);
                                                    handleToggleDiscActions(disc.id);
                                                }}
                                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                title="Disc Options"
                                            >
                                                <MoreVertical size={20} />
                                            </button>

                                            {openDiscActionsId === disc.id && (
                                                <div
                                                    ref={dropdownRef}
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
                        </Accordion>
                    ))}
                </div>
            )}

            {archivedDiscs.length > 0 && (
                <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
            )}

            {archivedDiscs.length > 0 && (
                <div className="mt-8">
                    <Accordion title={`On the Shelf (${archivedDiscs.length} discs)`} defaultOpen={false}>
                        <div className="space-y-4">
                            {sortedArchivedDiscTypes.map(type => (
                                <Accordion
                                    key={`archived-${type}`}
                                    title={
                                        <span className='text-gray-600 dark:text-gray-400'>
                                            {type} <span className='text-black dark:text-white text-base'>({groupedArchivedDiscs[type].length} discs)</span>
                                        </span>
                                    }
                                    defaultOpen={false}
                                >
                                    <ul
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, null, 'archived')}
                                    >
                                        {groupedArchivedDiscs[type].map((disc) => (
                                            <li
                                                key={disc.id}
                                                id={`disc-${disc.id}`}
                                                draggable="true"
                                                onDragStart={(e) => handleDragStart(e, disc.id, 'archived')}
                                                onDragEnter={(e) => handleDragEnter(e, disc.id)}
                                                onDragLeave={handleDragLeave}
                                                onDragEnd={handleDragEnd}
                                                onDrop={(e) => handleDrop(e, disc.id, 'archived')}
                                                className="disc-item bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200 ease-in-out relative cursor-grab opacity-75"
                                                style={{ userSelect: 'none' }}
                                                onMouseDown={() => console.log(`DEBUG: Mouse down on disc: ${disc.id}`)}
                                            >
                                                <div>
                                                    <h4 className="text-lg font-normal text-gray-700 dark:text-gray-200">
                                                        <span className='font-bold'>{disc.manufacturer}</span> {disc.plastic ? `${disc.plastic}` : ''} {disc.name}
                                                    </h4>
                                                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                                                        {disc.color ? `${disc.color}` : ''}
                                                        {(disc.stability !== undefined && disc.stability !== null) ? ` | Stability: ${disc.stability}` : ''}
                                                    </p>
                                                </div>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => handleToggleDiscActions(disc.id)}
                                                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                                        title="Disc Options"
                                                    >
                                                        <MoreVertical size={20} />
                                                    </button>
                                                    {openDiscActionsId === disc.id && (
                                                        <div
                                                            ref={dropdownRef}
                                                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600"
                                                        >
                                                            <button
                                                                onClick={() => handleRestoreDisc(disc.id, disc.name)}
                                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md"
                                                            >
                                                                <FolderOpen size={16} className="mr-2" /> Restore to Bag
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
                                </Accordion>
                            ))}
                        </div>
                    </Accordion>
                </div>
            )}

            {showFab && (
                <button
                    onClick={openAddDiscModal}
                    className={`fab-fix fixed bottom-20 right-6 !bg-blue-600 hover:bg-red-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50`}
                    title="Add New Disc"
                >
                    <span className="text-2xl">＋</span>
                </button>
            )}

            <DiscFormModal
                isOpen={isDiscFormModalOpen}
                onClose={closeDiscFormModal}
                onSubmit={handleSubmitDisc}
                initialData={currentDiscToEdit}
                newDiscName={newDiscName}
                setPropNewDiscName={setNewDiscName}
                newDiscManufacturer={newDiscManufacturer}
                setPropNewDiscManufacturer={setNewDiscManufacturer}
                newDiscType={newDiscType}
                setPropNewDiscType={setNewDiscType}
                newDiscPlastic={newDiscPlastic}
                setPropNewDiscPlastic={setNewDiscPlastic}
                newDiscColor={newDiscColor}
                setPropNewDiscColor={setNewDiscColor}
                newDiscStability={newDiscStability}
                setPropNewDiscStability={setNewDiscStability}
            />
        </div>
    );
}