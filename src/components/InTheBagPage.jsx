// src/components/InTheBagPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from "../firebase";
import AddDiscModal from '../components/AddDiscModal';
import {
    addDiscToBag,
    subscribeToUserDiscs, // Now subscribes to active discs
    subscribeToArchivedUserDiscs, // NEW: For archived discs
    updateDiscInBag, // NEW: For archiving/unarchiving
    deleteDiscFromBag
} from '../services/firestoreService';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash } from 'react-icons/fa'; // Keeping FaTrash for consistency with your existing code
import { Archive, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react'; // NEW: Icons for archive/restore and accordion

// Reusable Accordion Component (copied from SettingsPage for self-containment)
const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleAccordion = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="bg-white rounded-lg shadow-md max-w-md mx-auto mb-6">
            <button
                className="w-full flex justify-between items-center p-6 text-xl font-semibold text-gray-800 focus:outline-none !bg-white rounded-lg"
                onClick={toggleAccordion}
                aria-expanded={isOpen}
            >
                {title}
                {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                    {children}
                </div>
            )}
        </div>
    );
};

export default function InTheBagPage() {
    const { user: currentUser } = useFirebase();
    const [activeDiscs, setActiveDiscs] = useState([]); // Renamed from 'discs'
    const [archivedDiscs, setArchivedDiscs] = useState([]); // NEW: State for archived discs
    const [isAddDiscModalOpen, setIsAddDiscModalOpen] = useState(false);

    // State for new disc input fields
    const [newDiscName, setNewDiscName] = useState('');
    const [newDiscManufacturer, setNewDiscManufacturer] = useState('');
    const [newDiscType, setNewDiscType] = useState('');
    // New state for plastic type
    const [newDiscPlastic, setNewDiscPlastic] = useState('');

    // FAB state and refs
    const [showFab, setShowFab] = useState(true);
    const lastScrollY = useRef(0);
    const scrollContainerRef = useRef(null);

    // --- Real-time Subscription for Discs ---
    useEffect(() => {
        let unsubscribeActive;
        let unsubscribeArchived;

        if (currentUser && currentUser.uid) {
            console.log("Subscribing to active discs for user:", currentUser.uid);
            unsubscribeActive = subscribeToUserDiscs(currentUser.uid, (fetchedDiscs) => {
                setActiveDiscs(fetchedDiscs);
            });

            console.log("Subscribing to archived discs for user:", currentUser.uid);
            unsubscribeArchived = subscribeToArchivedUserDiscs(currentUser.uid, (fetchedDiscs) => {
                setArchivedDiscs(fetchedDiscs);
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


    // --- Modal Handlers ---
    const openAddDiscModal = () => setIsAddDiscModalOpen(true);
    const closeAddDiscModal = () => {
        setIsAddDiscModalOpen(false);
        // Reset form fields when closing the modal
        setNewDiscName('');
        setNewDiscManufacturer('');
        setNewDiscType('');
        setNewDiscPlastic('');
    };

    // --- Add Disc Submission Handler ---
    const handleAddDisc = async (name, manufacturer, type, plastic) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to add a disc.");
            return;
        }

        try {
            const discData = {
                name: name.trim(),
                manufacturer: manufacturer.trim(),
                type: type.trim(),
                plastic: plastic.trim(),
                isArchived: false // Explicitly set to false for new discs
            };
            await addDiscToBag(currentUser.uid, discData);
            toast.success(`${name} added to your bag!`);
            closeAddDiscModal();
        } catch (error) {
            console.error("Failed to add disc:", error);
            toast.error("Failed to add disc. Please try again.");
        }
    };

    // --- Archive Disc Handler ---
    const handleArchiveDisc = async (discId, discName) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to archive a disc.");
            return;
        }
        if (window.confirm(`Are you sure you want to put ${discName} on the shelf?`)) {
            try {
                await updateDiscInBag(currentUser.uid, discId, { isArchived: true });
                toast.success(`${discName} moved to 'On the Shelf'!`);
            } catch (error) {
                console.error("Failed to archive disc:", error);
                toast.error("Failed to archive disc. Please try again.");
            }
        }
    };

    // --- Restore Disc Handler ---
    const handleRestoreDisc = async (discId, discName) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to restore a disc.");
            return;
        }
        try {
            await updateDiscInBag(currentUser.uid, discId, { isArchived: false });
            toast.success(`${discName} restored to your bag!`);
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

        if (window.confirm(`Are you sure you want to permanently delete ${discName}? This cannot be undone.`)) {
            try {
                await deleteDiscFromBag(currentUser.uid, discId);
                toast.success(`${discName} permanently deleted.`);
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
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-lg text-gray-700">Please log in to view and manage your disc bag.</p>
            </div>
        );
    }

    return (
        <div ref={scrollContainerRef} className="max-h-screen bg-gray-100 text-gray-900 p-4 sm:p-6 lg:p-8">

            <h2 className="text-2xl font-bold text-center pt-5">In Your Bag</h2>
            {/* Display active disc count */}
            {activeDiscs.length > 0 && (
                <p className="text-md text-gray-600 text-center mb-6">{activeDiscs.length} active discs</p>
            )}


            {activeDiscs.length === 0 && archivedDiscs.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">
                    You haven't added any discs to your bag yet! Click the '+' button to get started.
                </p>
            ) : (
                <div className="space-y-8">
                    {sortedActiveDiscTypes.map(type => (
                        <div key={type}>
                            <h3 className="text-xl font-normal mb-4 text-blue-700 border-b-2 border-blue-200 pb-2">
                                {type}
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupedActiveDiscs[type].map((disc) => (
                                    <li
                                        key={disc.id}
                                        className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200 ease-in-out"
                                    >
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800">
                                                {disc.manufacturer} {disc.plastic ? `${disc.plastic} ` : ''}{disc.name}
                                            </h4>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleArchiveDisc(disc.id, disc.name)}
                                                className="text-gray-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-100 transition-colors"
                                                title={`Archive ${disc.name} (On the Shelf)`}
                                            >
                                                <Archive size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDisc(disc.id, disc.name)}
                                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors"
                                                title={`Delete ${disc.name} permanently`}
                                            >
                                                <FaTrash size={20} />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* NEW: On the Shelf (Archived Discs) Accordion */}
            {archivedDiscs.length > 0 && (
                <div className="mt-8">
                    <Accordion title={`On the Shelf (${archivedDiscs.length} discs)`} defaultOpen={false}>
                        <div className="space-y-8">
                            {sortedArchivedDiscTypes.map(type => (
                                <div key={`archived-${type}`}>
                                    <h3 className="text-xl font-normal mb-4 text-gray-700 border-b-2 border-gray-300 pb-2">
                                        {type} (Archived)
                                    </h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {groupedArchivedDiscs[type].map((disc) => (
                                            <li
                                                key={disc.id}
                                                className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200 ease-in-out"
                                            >
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-800">
                                                        {disc.manufacturer} {disc.plastic ? `${disc.plastic} ` : ''}{disc.name}
                                                    </h4>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleRestoreDisc(disc.id, disc.name)}
                                                        className="text-green-500 hover:text-green-700 p-2 rounded-full hover:bg-green-100 transition-colors"
                                                        title={`Restore ${disc.name} to bag`}
                                                    >
                                                        <FolderOpen size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDisc(disc.id, disc.name)}
                                                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors"
                                                        title={`Delete ${disc.name} permanently`}
                                                    >
                                                        <FaTrash size={20} />
                                                    </button>
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

            {/* Add Disc Modal */}
            <AddDiscModal
                isOpen={isAddDiscModalOpen}
                onClose={closeAddDiscModal}
                onSubmit={handleAddDisc}
                newDiscName={newDiscName}
                setNewDiscName={setNewDiscName}
                newDiscManufacturer={newDiscManufacturer}
                setNewDiscManufacturer={setNewDiscManufacturer}
                newDiscType={newDiscType}
                setNewDiscType={setNewDiscType}
                newDiscPlastic={newDiscPlastic}
                setNewDiscPlastic={setNewDiscPlastic}
            />
        </div>
    );
}
