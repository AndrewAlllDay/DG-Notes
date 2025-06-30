// src/components/InTheBagPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from "../firebase";
import AddDiscModal from '../components/AddDiscModal';
import {
    addDiscToBag,
    subscribeToUserDiscs,
    deleteDiscFromBag
} from '../services/firestoreService';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function InTheBagPage() {
    const { user: currentUser } = useFirebase();
    const [discs, setDiscs] = useState([]);
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
        let unsubscribe;
        if (currentUser && currentUser.uid) {
            console.log("Subscribing to discs for user:", currentUser.uid);
            unsubscribe = subscribeToUserDiscs(currentUser.uid, (fetchedDiscs) => {
                setDiscs(fetchedDiscs);
            });
        } else {
            setDiscs([]);
            console.log("No current user found, not subscribing to discs.");
        }

        return () => {
            if (unsubscribe) {
                console.log("Unsubscribing from discs.");
                unsubscribe();
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
        setNewDiscPlastic(''); // Reset new plastic type
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
                plastic: plastic.trim()
            };
            await addDiscToBag(currentUser.uid, discData);
            toast.success(`${name} added to your bag!`);
            closeAddDiscModal();
        } catch (error) {
            console.error("Failed to add disc:", error);
            toast.error("Failed to add disc. Please try again.");
        }
    };

    // --- Delete Disc Handler ---
    const handleDeleteDisc = async (discId, discName) => {
        if (!currentUser || !currentUser.uid) {
            toast.error("You must be logged in to delete a disc.");
            return;
        }

        if (window.confirm(`Are you sure you want to remove ${discName} from your bag?`)) {
            try {
                await deleteDiscFromBag(currentUser.uid, discId);
                toast.success(`${discName} removed from your bag!`);
            } catch (error) {
                console.error("Failed to delete disc:", error);
                toast.error("Failed to remove disc. Please try again.");
            }
        }
    };

    // --- Group discs by type ---
    const groupedDiscs = discs.reduce((acc, disc) => {
        // Use 'Other' if type is empty or null/undefined
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
        'Hybrid', // Assuming 'Hybrid' is a type that can be selected
        'Other' // For discs with no specified type
    ];

    // Create a sorted list of types that actually exist in the grouped discs
    const sortedDiscTypes = discTypeOrder.filter(type => groupedDiscs[type]);

    // Add any types that exist in groupedDiscs but were not in discTypeOrder (e.g., custom types)
    Object.keys(groupedDiscs).forEach(type => {
        if (!sortedDiscTypes.includes(type)) {
            sortedDiscTypes.push(type);
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
        <div ref={scrollContainerRef} className="min-h-screen bg-gray-100 text-gray-900 p-4 sm:p-6 lg:p-8">

            <h2 className="text-2xl font-bold text-center pt-5">In Your Bag</h2>
            {/* Added the disc count here */}
            {discs.length > 0 && (
                <p className="text-md text-gray-600 text-center mb-6">{discs.length} total discs</p>
            )}


            {discs.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">
                    You haven't added any discs to your bag yet! Click the '+' button to get started.
                </p>
            ) : (
                <div className="space-y-8"> {/* Adds vertical spacing between different type sections */}
                    {sortedDiscTypes.map(type => (
                        <div key={type}>
                            <h3 className="text-xl font-normal mb-4 text-blue-700 border-b-2 border-blue-200 pb-2">
                                {type}
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupedDiscs[type].map((disc) => (
                                    <li
                                        key={disc.id}
                                        className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200 ease-in-out"
                                    >
                                        <div>
                                            {/* Display Manufacturer, Plastic, and Name together */}
                                            <h4 className="text-lg font-semibold text-gray-800">
                                                {disc.manufacturer} {disc.plastic ? `${disc.plastic} ` : ''}{disc.name}
                                            </h4>
                                            {/* Removed redundant plastic and type lines here, as type is the section header */}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteDisc(disc.id, disc.name)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 transition-colors"
                                            title={`Remove ${disc.name}`}
                                        >
                                            <FaTrash size={20} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
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