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
    // Update handleAddDisc to accept plastic as a parameter
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
                plastic: plastic.trim() // Include plastic type
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

    if (!currentUser) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-lg text-gray-700">Please log in to view and manage your disc bag.</p>
            </div>
        );
    }

    return (
        <div ref={scrollContainerRef} className="max-h-screen bg-gray-100 text-gray-900 p-4 sm:p-6 lg:p-8">

            <h2 className="text-2xl font-bold mb-6 text-center pt-5">Settings</h2>

            {discs.length === 0 ? (
                <p className="text-center text-gray-600 text-lg">
                    You haven't added any discs to your bag yet! Click the '+' button to get started.
                </p>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discs.map((disc) => (
                        <li
                            key={disc.id}
                            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200 ease-in-out"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">{disc.manufacturer} {disc.plastic} {disc.name}</h3>
                                {/* Display plastic type */}

                                {disc.type && (
                                    <p className="text-sm text-gray-600">Type: {disc.type}</p>
                                )}
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
                // Pass newDiscPlastic and setNewDiscPlastic to the modal
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