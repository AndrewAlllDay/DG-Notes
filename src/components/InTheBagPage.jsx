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
import { FaTrash } from 'react-icons/fa';
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
            unsubscribeActive = subscribeToUserDiscs(currentUser.uid, (fetchedDiscs) => {
                const discsWithOrder = fetchedDiscs.map(disc => ({ ...disc, displayOrder: disc.displayOrder !== undefined ? disc.displayOrder : 0 }));
                setActiveDiscs(discsWithOrder);
            });
            unsubscribeArchived = subscribeToArchivedUserDiscs(currentUser.uid, (fetchedDiscs) => {
                const discsWithOrder = fetchedDiscs.map(disc => ({ ...disc, displayOrder: disc.displayOrder !== undefined ? disc.displayOrder : 0 }));
                setArchivedDiscs(discsWithOrder);
            });
        } else {
            setActiveDiscs([]);
            setArchivedDiscs([]);
        }
        return () => {
            if (unsubscribeActive) unsubscribeActive();
            if (unsubscribeArchived) unsubscribeArchived();
        };
    }, [currentUser]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDiscActionsId && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDiscActionsId(null);
            }
        };
        if (openDiscActionsId) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
    };

    const closeDiscFormModal = () => {
        setIsDiscFormModalOpen(false);
        setCurrentDiscToEdit(null);
    };

    const handleToggleDiscActions = (discId) => {
        setOpenDiscActionsId(prevId => (prevId === discId ? null : discId));
    };

    const handleSubmitDisc = async (name, manufacturer, type, plastic, color, stability) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to manage discs.");
            return;
        }
        try {
            const parsedStability = stability === '' ? null : parseFloat(stability);
            if (stability !== '' && isNaN(parsedStability)) {
                toast.error("Stability must be a valid number.");
                return;
            }
            const discData = { name: name.trim(), manufacturer: manufacturer.trim(), type: type.trim(), plastic: plastic.trim(), color: color.trim(), stability: parsedStability };
            if (currentDiscToEdit) {
                await updateDiscInBag(currentUser.uid, currentDiscToEdit.id, discData);
                toast.success(`${name} updated successfully!`);
            } else {
                const allDiscs = [...activeDiscs, ...archivedDiscs];
                const maxOrder = allDiscs.length > 0 ? Math.max(...allDiscs.map(d => d.displayOrder || 0)) : -1;
                await addDiscToBag(currentUser.uid, { ...discData, isArchived: false, displayOrder: maxOrder + 1 });
                toast.success(`${name} added to your bag!`);
            }
            closeDiscFormModal();
        } catch (error) {
            toast.error("Failed to save disc. Please try again.");
        }
    };

    const reorderArray = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const updateDiscOrdersInFirestore = async (discsToUpdate, listType) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to reorder discs.");
            return;
        }
        try {
            const updates = discsToUpdate.map((disc, index) => {
                if (disc.displayOrder !== index) {
                    return updateDiscInBag(currentUser.uid, disc.id, { displayOrder: index });
                }
                return Promise.resolve();
            });
            await Promise.all(updates);
            toast.success(`Discs in '${listType}' reordered successfully!`);
        } catch (error) {
            toast.error("Failed to save new disc order. Please try again.");
        }
    };

    const handleDragStart = (e, discId, discType) => {
        draggedItem.current = { id: discId, type: discType };
        e.dataTransfer.setData("text/plain", discId);
        e.dataTransfer.effectAllowed = "move";
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnter = (e, discId) => {
        e.preventDefault();
        if (e.currentTarget.id !== `disc-${draggedItem.current?.id}`) {
            e.currentTarget.classList.add('bg-blue-100', 'dark:bg-blue-900');
            dragOverTarget.current = discId;
        }
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900');
        dragOverTarget.current = null;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('opacity-50');
        document.querySelectorAll('.disc-item').forEach(item => {
            item.classList.remove('bg-blue-100', 'dark:bg-blue-900');
        });
        draggedItem.current = null;
        dragOverTarget.current = null;
    };

    const handleDrop = async (e, targetDiscId, targetListType) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-100', 'dark:bg-blue-900');
        const sourceDiscId = e.dataTransfer.getData("text/plain");
        const sourceListType = draggedItem.current?.type;
        if (!sourceDiscId || !sourceListType) return;
        if (sourceDiscId === targetDiscId && sourceListType === targetListType) return;

        let currentSourceList = sourceListType === 'active' ? [...activeDiscs] : [...archivedDiscs];
        let currentTargetList = targetListType === 'active' ? [...activeDiscs] : [...archivedDiscs];
        const draggedDiscIndex = currentSourceList.findIndex(d => d.id === sourceDiscId);
        const targetIndex = targetDiscId ? currentTargetList.findIndex(d => d.id === targetDiscId) : currentTargetList.length;
        if (draggedDiscIndex === -1) return;

        const movedDisc = { ...currentSourceList[draggedDiscIndex] };

        if (sourceListType === targetListType) {
            const reorderedList = reorderArray(currentSourceList, draggedDiscIndex, targetIndex === -1 ? currentSourceList.length - 1 : targetIndex);
            if (sourceListType === 'active') setActiveDiscs(reorderedList);
            else setArchivedDiscs(reorderedList);
            await updateDiscOrdersInFirestore(reorderedList, sourceListType);
        } else {
            currentSourceList.splice(draggedDiscIndex, 1);
            movedDisc.isArchived = (targetListType === 'archived');
            if (targetIndex === -1) currentTargetList.push(movedDisc);
            else currentTargetList.splice(targetIndex, 0, movedDisc);

            if (sourceListType === 'active') {
                setActiveDiscs(currentSourceList);
                setArchivedDiscs(currentTargetList);
            } else {
                setArchivedDiscs(currentSourceList);
                setActiveDiscs(currentTargetList);
            }
            try {
                await updateDiscInBag(currentUser.uid, movedDisc.id, { isArchived: movedDisc.isArchived });
                toast.success(`${movedDisc.name} ${movedDisc.isArchived ? 'moved to Shelf' : 'restored to Bag'}!`);
                await updateDiscOrdersInFirestore(currentSourceList, sourceListType);
                await updateDiscOrdersInFirestore(currentTargetList, targetListType);
            } catch (error) {
                toast.error("Failed to move disc. Please try again.");
            }
        }
    };

    const handleArchiveDisc = async (discId, discName) => {
        if (!currentUser || !currentUser.uid) { toast.error("You must be logged in."); return; }
        try {
            await updateDiscInBag(currentUser.uid, discId, { isArchived: true });
            toast.success(`${discName} moved to 'On the Shelf'!`);
            setOpenDiscActionsId(null);
        } catch (error) {
            toast.error("Failed to archive disc.");
        }
    };

    const handleRestoreDisc = async (discId, discName) => {
        if (!currentUser || !currentUser.uid) { toast.error("You must be logged in."); return; }
        try {
            await updateDiscInBag(currentUser.uid, discId, { isArchived: false });
            toast.success(`${discName} restored to your bag!`);
            setOpenDiscActionsId(null);
        } catch (error) {
            toast.error("Failed to restore disc.");
        }
    };

    const handleDeleteDisc = async (discId, discName) => {
        if (!currentUser || !currentUser.uid) { toast.error("You must be logged in."); return; }
        if (window.confirm(`Are you sure you want to permanently delete ${discName}? This cannot be undone.`)) {
            try {
                await deleteDiscFromBag(currentUser.uid, discId);
                toast.success(`${discName} permanently deleted.`);
                setOpenDiscActionsId(null);
            } catch (error) {
                toast.error("Failed to delete disc.");
            }
        }
    };

    const groupedActiveDiscs = activeDiscs.reduce((acc, disc) => {
        const type = (disc.type && disc.type.trim() !== '') ? disc.type : 'Other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(disc);
        return acc;
    }, {});

    for (const type in groupedActiveDiscs) {
        groupedActiveDiscs[type].sort((a, b) => (a.stability ?? Infinity) - (b.stability ?? Infinity));
    }

    const discTypeOrder = ['Distance Driver', 'Fairway Driver', 'Midrange', 'Putt/Approach', 'Hybrid', 'Other'];
    const sortedActiveDiscTypes = discTypeOrder.filter(type => groupedActiveDiscs[type]);

    if (!currentUser) {
        return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-black"><p className="text-lg text-gray-700 dark:text-gray-300">Please log in to view and manage your disc bag.</p></div>;
    }

    const renderDiscItem = (disc, type) => (
        <li
            key={disc.id}
            id={`disc-${disc.id}`}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, disc.id, type)}
            onDragEnter={(e) => handleDragEnter(e, disc.id)}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, disc.id, type)}
            className={`disc-item border rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200 ease-in-out relative cursor-grab ${type === 'active' ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-75'}`}
            style={{ userSelect: 'none' }}
        >
            <div>
                <h4 className={`text-lg font-normal ${type === 'active' ? 'text-gray-800 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                    <span className='font-bold'>{disc.manufacturer}</span> {disc.plastic ? `${disc.plastic}` : ''} {disc.name}
                </h4>
                <p className={`text-sm ${type === 'active' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {disc.color || ''}
                    {(disc.stability !== undefined && disc.stability !== null) ? ` | Stability: ${disc.stability}` : ''}
                </p>
            </div>
            <div className="relative">
                <button onClick={() => handleToggleDiscActions(disc.id)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Disc Options">
                    <MoreVertical size={20} />
                </button>
                {openDiscActionsId === disc.id && (
                    <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                        {type === 'active' ? (
                            <>
                                <button onClick={() => openEditDiscModal(disc)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md">
                                    <Pencil size={16} className="mr-2" /> Edit
                                </button>
                                <button onClick={() => handleArchiveDisc(disc.id, disc.name)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <Archive size={16} className="mr-2" /> Move to Shelf
                                </button>
                                <button onClick={() => handleDeleteDisc(disc.id, disc.name)} className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-b-md">
                                    <FaTrash size={16} className="mr-2" /> Delete
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => handleRestoreDisc(disc.id, disc.name)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md">
                                    <FolderOpen size={16} className="mr-2" /> Restore to Bag
                                </button>
                                <button onClick={() => handleDeleteDisc(disc.id, disc.name)} className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-b-md">
                                    <FaTrash size={16} className="mr-2" /> Delete
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </li>
    );

    return (
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
                                <span className='text-blue-700 dark:text-blue-400 text-xl'>
                                    {type} <span className='text-black dark:text-white text-base'>({groupedActiveDiscs[type].length} discs)</span>
                                </span>
                            }
                            defaultOpen={false}
                        >
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, null, 'active')}>
                                {groupedActiveDiscs[type].map(disc => renderDiscItem(disc, 'active'))}
                            </ul>
                        </Accordion>
                    ))}
                </div>
            )}

            {/* === MODIFIED "ON THE SHELF" SECTION START === */}
            {archivedDiscs.length > 0 && (
                <>
                    <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
                    <Accordion
                        title={`On the Shelf (${archivedDiscs.length} discs)`}
                        defaultOpen={false}
                    >
                        <ul
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, null, 'archived')}
                        >
                            {archivedDiscs
                                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                .map(disc => renderDiscItem(disc, 'archived'))
                            }
                        </ul>
                    </Accordion>
                </>
            )}
            {/* === MODIFIED "ON THE SHELF" SECTION END === */}


            {showFab && (
                <button onClick={openAddDiscModal} className="fab-fix fixed bottom-20 right-6 !bg-blue-600 hover:!bg-blue-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50" title="Add New Disc">
                    <span className="text-2xl">＋</span>
                </button>
            )}

            <DiscFormModal
                isOpen={isDiscFormModalOpen}
                onClose={closeDiscFormModal}
                onSubmit={handleSubmitDisc}
                initialData={currentDiscToEdit}
                newDiscName={newDiscName} setPropNewDiscName={setNewDiscName}
                newDiscManufacturer={newDiscManufacturer} setPropNewDiscManufacturer={setNewDiscManufacturer}
                newDiscType={newDiscType} setPropNewDiscType={setNewDiscType}
                newDiscPlastic={newDiscPlastic} setPropNewDiscPlastic={setNewDiscPlastic}
                newDiscColor={newDiscColor} setPropNewDiscColor={setNewDiscColor}
                newDiscStability={newDiscStability} setPropNewDiscStability={setNewDiscStability}
            />
        </div>
    );
}