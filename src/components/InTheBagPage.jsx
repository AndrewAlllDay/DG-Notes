import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// Animation library imports
import { motion, AnimatePresence, useMotionValue, useMotionValueEvent } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

// Component & Service Imports
import DiscFormModal from '../components/AddDiscModal';
import AddDiscFromAPImodal from '../components/AddDiscFromAPImodal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { addDiscToBag, subscribeToUserDiscs, subscribeToArchivedUserDiscs, updateDiscInBag, deleteDiscFromBag } from '../services/firestoreService';
import { getCache, setCache, getTtlCache, setTtlCache } from '../utilities/cache.js';
import { toast } from 'react-toastify';
import { FaTrash, FaTimes } from 'react-icons/fa';
import { Archive, FolderOpen, ChevronDown, Pencil } from 'lucide-react';

// --- Animated Sub-components ---

const FlightPath = React.memo(({ speed, glide, turn, fade, isExpanded }) => {
    const pathRef = useRef(null);
    const progress = useMotionValue(0);
    const [tracerPos, setTracerPos] = useState({ x: 50, y: 110 });

    const pathData = useMemo(() => {
        if ([speed, glide, turn, fade].some(n => typeof n !== 'number')) return null;
        const startX = 50, startY = 110, endX = 50, endY = 10;
        const control1X = startX + (turn * 15);
        const control2X = endX + (fade * 9);
        const control1Y = startY * 0.7 - (glide * 2);
        const control2Y = endY * 1.5 + (glide * 2);
        return `M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`;
    }, [speed, glide, turn, fade]);

    useMotionValueEvent(progress, "change", (latest) => {
        if (pathRef.current && latest > 0) {
            const pathLength = pathRef.current.getTotalLength();
            const point = pathRef.current.getPointAtLength(latest * pathLength);
            setTracerPos({ x: point.x, y: point.y });
        }
    });

    if (!pathData) return <div className="w-20 h-24 flex items-center justify-center text-xs text-gray-400">No flight data</div>;

    return (
        <div className="w-20 h-24" title={`Flight: ${speed} | ${glide} | ${turn} | ${fade}`}>
            <svg viewBox="0 0 100 120" className="w-full h-full">
                <line x1="50" y1="10" x2="50" y2="110" strokeDasharray="3,3" className="text-gray-300 dark:text-gray-600" strokeWidth="1" />
                <motion.path
                    ref={pathRef}
                    d={pathData}
                    className="text-blue-500"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ pathLength: progress }}
                />
                <motion.circle
                    cx={tracerPos.x}
                    cy={tracerPos.y}
                    r="4"
                    fill="currentColor"
                    className="text-sky-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.1, delay: isExpanded ? 0.1 : 0 }}
                />
            </svg>
        </div>
    );
});

const Accordion = React.memo(({ title, children, isOpen, onToggle }) => {
    // State to track if the opening animation is done
    const [isAnimationComplete, setIsAnimationComplete] = useState(false);

    // When the accordion is told to close, reset the animation state
    useEffect(() => {
        if (!isOpen) {
            setIsAnimationComplete(false);
        }
    }, [isOpen]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-full mx-auto mb-6">
            <button className="w-full flex justify-between items-center p-6 text-xl font-semibold text-gray-800 dark:text-white focus:outline-none !bg-white dark:!bg-gray-800 rounded-lg" onClick={onToggle} aria-expanded={isOpen}>
                {title}
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <ChevronDown size={24} className="text-gray-800 dark:text-white" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: "auto" },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        // Conditionally apply `overflow-hidden`. Once open, overflow becomes visible.
                        className={isAnimationComplete ? "" : "overflow-hidden"}
                        // Set state to true when the opening animation finishes
                        onAnimationComplete={() => setIsAnimationComplete(true)}
                    >
                        <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

// ✨ REFACTORED: DiscItem is now just a clickable card
const DiscItem = React.memo(({ disc, type, onOpenDetails }) => {
    return (
        <div className="relative h-full">
            <div className={`w-full h-full flex flex-col border rounded-lg shadow-sm overflow-hidden text-left transition-shadow hover:shadow-md ${type === 'active' ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
                <div className="h-3 flex-shrink-0" style={{ backgroundColor: disc.color || 'transparent' }} />
                <button onClick={() => onOpenDetails(disc)} className="flex-grow w-full flex text-left p-4">
                    <div className="flex-1 min-w-0">
                        <h4 className={`text-lg font-normal ${type === 'active' ? 'text-gray-800 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}><span className='font-bold'>{disc.manufacturer}</span> {disc.name}</h4>
                        <div className="mt-1">
                            <p className={`text-sm ${type === 'active' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{disc.notes || <span className="italic text-gray-400 dark:text-gray-500">No notes.</span>}</p>
                            {disc.weight && <p className={`text-xs mt-1 ${type === 'active' ? 'text-gray-500 dark:text-gray-500' : 'text-gray-500 dark:text-gray-500'}`}>Weight: {disc.weight}g</p>}
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
});


// ✨ NEW: DiscDetailModal component
const DiscDetailModal = React.memo(({ disc, isOpen, onClose, onEdit, onArchive, onRestore, onDelete }) => {
    if (!isOpen || !disc) return null;

    const modalRef = useRef(null);

    // ✨ CORRECTED: Separate, dedicated handlers for each button
    const handleArchive = useCallback(() => { onArchive(disc); onClose(); }, [disc, onArchive, onClose]);
    const handleRestore = useCallback(() => { onRestore(disc); onClose(); }, [disc, onRestore, onClose]);
    const handleEdit = useCallback(() => { onEdit(disc); onClose(); }, [onEdit, disc, onClose]);
    const handleDelete = useCallback(() => { onDelete(disc); onClose(); }, [onDelete, disc, onClose]);

    const handleCloseModal = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleCloseModal}
                    className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex justify-center items-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        ref={modalRef}
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative"
                    >
                        <button onClick={handleCloseModal} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 !bg-transparent p-1 rounded-full">
                            <FaTimes size={18} />
                        </button>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{disc.manufacturer} {disc.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{disc.notes || "No notes."}</p>

                        <div className="flex justify-center mb-6">
                            <FlightPath isExpanded={true} speed={disc.speed} glide={disc.glide} turn={disc.turn} fade={disc.fade} />
                        </div>
                        <p className="text-center text-lg font-semibold text-gray-600 dark:text-gray-400 mb-6">
                            Flight Numbers: {`${disc.speed ?? 'N/A'} | ${disc.glide ?? 'N/A'} | ${disc.turn ?? 'N/A'} | ${disc.fade ?? 'N/A'}`}
                        </p>

                        <div className="flex justify-between gap-2 mt-4">
                            <button onClick={handleEdit} className="flex-1 flex items-center justify-center gap-2 !bg-blue-600 hover:!bg-blue-700 text-white rounded-md p-2">
                                <Pencil size={16} /> Edit
                            </button>
                            {disc.archived ? (
                                <button onClick={handleRestore} className="flex-1 flex items-center justify-center gap-2 !bg-green-600 hover:!bg-green-700 text-white rounded-md p-2">
                                    <FolderOpen size={16} /> Restore
                                </button>
                            ) : (
                                <button onClick={handleArchive} className="flex-1 flex items-center justify-center gap-2 !bg-gray-500 hover:!bg-gray-600 text-white rounded-md p-2">
                                    <Archive size={16} /> Archive
                                </button>
                            )}
                            <button onClick={handleDelete} className="flex-1 flex items-center justify-center gap-2 !bg-red-600 hover:!bg-red-700 text-white rounded-md p-2">
                                <FaTrash size={16} /> Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});


const DISC_TYPE_CONFIG = {
    'Distance Driver': { label: 'Distance Drivers', color: 'bg-red-100 text-red-800' },
    'Hybrid Driver': { label: 'Hybrid Drivers', color: 'bg-orange-100 text-orange-800' },
    'Control Driver': { label: 'Control Drivers', color: 'bg-yellow-100 text-yellow-800' },
    'Midrange': { label: 'Midranges', color: 'bg-green-100 text-green-800' },
    'Putter': { label: 'Putters', color: 'bg-blue-100 text-blue-800' },
    'Approach Discs': { label: 'Approach Discs', color: 'bg-purple-100 text-purple-800' },
    'Other': { label: 'Other', color: 'bg-gray-100 text-gray-800' },
};
const ALL_DISC_TYPES = Object.keys(DISC_TYPE_CONFIG);

const FilterControls = React.memo(({ activeFilter, onFilterChange }) => {
    // Tailwind classes for the pill styles
    const activePillClasses = 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    const inactivePillClasses = 'border-transparent text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600';

    return (
        <div className="flex justify-center items-center gap-2 mb-6 max-w-2xl mx-auto min-h-[34px] flex-wrap">
            <button
                onClick={() => onFilterChange('all')}
                className={`
                    inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium
                    border-2 transition-all duration-200
                    ${activeFilter === 'all'
                        ? activePillClasses
                        : inactivePillClasses
                    }
                `}
                aria-label="Show all discs"
            >
                All Discs
            </button>
            {ALL_DISC_TYPES.map(filterKey => {
                const config = DISC_TYPE_CONFIG[filterKey];
                const isActive = activeFilter === filterKey;

                return (
                    <button
                        key={filterKey}
                        onClick={() => onFilterChange(filterKey)}
                        className={`
                            inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium
                            border-2 transition-all duration-200
                            ${isActive
                                ? activePillClasses
                                : inactivePillClasses
                            }
                        `}
                        aria-label={`Filter by ${config.label}`}
                    >
                        {config.label}
                    </button>
                );
            })}
        </div>
    );
});


// --- Main Page Component ---

export default function InTheBagPage({ user: currentUser }) {
    const [activeDiscs, setActiveDiscs] = useState([]);
    const [archivedDiscs, setArchivedDiscs] = useState([]);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const [currentDiscToEdit, setCurrentDiscToEdit] = useState(null);
    const [apiDiscs, setApiDiscs] = useState([]);
    const [isApiLoading, setIsApiLoading] = useState(true);
    const [apiFetchError, setApiFetchError] = useState(null);
    const [pendingApiDisc, setPendingApiDisc] = useState(null);
    const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, disc: null });
    // ✨ REFACTORED: We no longer need expandedDiscId state.
    // We will use a single state to hold the selected disc for our new modal.
    const [selectedDiscForModal, setSelectedDiscForModal] = useState(null);
    const [isArchivedAccordionOpen, setIsArchivedAccordionOpen] = useState(false);

    // ✨ NEW: State for disc type filtering
    const [activeFilter, setActiveFilter] = useState('all');


    useEffect(() => {
        const fetchDiscsFromApi = async () => {
            const cacheKey = 'apiDiscs';
            const cachedData = getTtlCache(cacheKey, 1440);
            if (cachedData) {
                setApiDiscs(cachedData); setIsApiLoading(false); return;
            }
            try {
                const response = await fetch('https://discit-api.fly.dev/disc');
                if (!response.ok) throw new Error(`API error! Status: ${response.status}`);
                const data = await response.json();
                setTtlCache(cacheKey, data); setApiDiscs(data);
            } catch (error) {
                console.error("Failed to fetch discs from API:", error);
                setApiFetchError("Could not load disc database.");
            } finally { setIsApiLoading(false); }
        };
        fetchDiscsFromApi();
    }, []);

    useEffect(() => {
        if (!currentUser?.uid) { setActiveDiscs([]); setArchivedDiscs([]); return; }
        const activeCacheKey = `userDiscs-active-${currentUser.uid}`;
        const archivedCacheKey = `userDiscs-archived-${currentUser.uid}`;
        const cachedActive = getCache(activeCacheKey);
        if (cachedActive) setActiveDiscs(cachedActive);
        const cachedArchived = getCache(archivedCacheKey);
        if (cachedArchived) setArchivedDiscs(cachedArchived);

        const unsubscribeActive = subscribeToUserDiscs(currentUser.uid, (discs) => { setActiveDiscs(discs); setCache(activeCacheKey, discs); });
        const unsubscribeArchived = subscribeToArchivedUserDiscs(currentUser.uid, (discs) => { setArchivedDiscs(discs); setCache(archivedCacheKey, discs); });

        return () => { unsubscribeActive(); unsubscribeArchived(); };
    }, [currentUser]);

    // ✨ NEW: Handler to open the modal with the disc's data
    const handleOpenDiscModal = useCallback((disc) => {
        setSelectedDiscForModal(disc);
    }, []);

    // ✨ REFACTORED: Handler to close the new modal
    const handleCloseDiscModal = useCallback(() => {
        setSelectedDiscForModal(null);
    }, []);

    const openAddDiscModal = useCallback(() => setIsApiModalOpen(true), []);

    // ✨ REFACTORED: This handler is now for the form modal, not the new detail modal
    const openEditDiscModal = useCallback((disc) => {
        setCurrentDiscToEdit(disc);
        setPendingApiDisc(null);
        setIsDetailsModalOpen(true);
    }, []);

    const handleSelectDiscFromApi = useCallback((disc) => { setPendingApiDisc(disc); setIsApiModalOpen(false); setIsDetailsModalOpen(true); }, []);
    const handleDeleteDisc = useCallback((disc) => setDeleteModalState({ isOpen: true, disc }), []);

    const collapseAll = useCallback(() => {
        // ✨ REFACTORED: We no longer need to collapse discs individually
        setIsArchivedAccordionOpen(false);
    }, []);

    const closeModalAndReset = useCallback(() => {
        setIsDetailsModalOpen(false);
        setCurrentDiscToEdit(null);
        setPendingApiDisc(null);
    }, []);

    const cancelDeleteDisc = useCallback(() => setDeleteModalState({ isOpen: false, disc: null }), []);

    const handleDetailsSubmit = useCallback(async (detailsData) => {
        if (!currentUser?.uid) {
            toast.error("You must be logged in to save a disc.");
            return;
        }

        try {
            if (currentDiscToEdit) {
                await updateDiscInBag(currentUser.uid, currentDiscToEdit.id, detailsData);
                toast.success(`'${detailsData.name}' updated successfully!`);
            } else {
                await addDiscToBag(currentUser.uid, detailsData);
                toast.success(`'${detailsData.name}' added to your bag!`);
            }
            closeModalAndReset();
        } catch (error) {
            console.error("Error saving disc details:", error);
            toast.error("Failed to save disc. Please try again.");
        }
    }, [currentUser, currentDiscToEdit, closeModalAndReset]);

    // Logic for archiving, restoring, and confirming deletion is omitted for brevity as it remains the same.
    const handleArchiveDisc = useCallback(async (disc) => { /* ... */ }, [currentUser]);
    const handleRestoreDisc = useCallback(async (disc) => { /* ... */ }, [currentUser]);
    const confirmDeleteDisc = useCallback(async () => { /* ... */ }, [currentUser, deleteModalState.disc]);

    // ✨ NEW: Filtered discs logic using the new activeFilter state
    const sortedAndFilteredDiscs = useMemo(() => {
        let discs = [...activeDiscs]; // Clone the array
        if (activeFilter && activeFilter !== 'all') {
            discs = discs.filter(disc => (disc.type || 'Other') === activeFilter);
        }

        // Sort remaining discs by speed descending, then name ascending
        discs.sort((a, b) => {
            const speedA = parseInt(a.speed, 10) || 0;
            const speedB = parseInt(b.speed, 10) || 0;
            if (speedA !== speedB) return speedB - speedA;
            return (a.name || '').localeCompare(b.name || '');
        });
        return discs;
    }, [activeDiscs, activeFilter]);


    const listVariants = { visible: { transition: { staggerChildren: 0.07 } }, hidden: {} };
    const itemVariants = { visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }, hidden: { opacity: 0, y: 20, transition: { duration: 0.2 } } };

    if (!currentUser) return <div className="flex justify-center items-center h-screen"><p>Please log in to manage your bag.</p></div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8 pb-48">
            <h2 className="text-2xl font-bold text-center pt-5 mb-2">In Your Bag</h2>
            {activeDiscs.length > 0 && <p className="text-md text-gray-600 dark:text-gray-400 text-center mb-6">{activeDiscs.length} active discs</p>}

            <FilterControls
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />

            {sortedAndFilteredDiscs.length === 0 && activeDiscs.length > 0 ? (
                <div className="text-center text-gray-600 dark:text-gray-400 mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto">
                    <p>No discs match the selected filter.</p>
                </div>
            ) : (
                <motion.ul
                    className="grid grid-cols-2 gap-4"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {sortedAndFilteredDiscs.map(disc => (
                        <motion.li key={disc.id} variants={itemVariants} className="self-stretch relative focus-within:z-10">
                            <Tilt glareEnable={true} glareMaxOpacity={0.05} glarePosition="all" tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03} className="h-full">
                                {/* ✨ REFACTORED: DiscItem now just a clickable card that opens the modal */}
                                <DiscItem
                                    disc={disc}
                                    type="active"
                                    onOpenDetails={handleOpenDiscModal}
                                />
                            </Tilt>
                        </motion.li>
                    ))}
                </motion.ul>
            )}

            {archivedDiscs.length > 0 && (
                <>
                    <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
                    <Accordion title={`On the Shelf (${archivedDiscs.length} discs)`}
                        isOpen={isArchivedAccordionOpen}
                        onToggle={() => setIsArchivedAccordionOpen(prev => !prev)}
                    >
                        <motion.ul className="grid grid-cols-2 gap-4 mt-2" variants={listVariants} initial="hidden" animate="visible">
                            {archivedDiscs.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(disc => (
                                <motion.li key={disc.id} variants={itemVariants} className="self-stretch relative focus-within:z-10">
                                    <Tilt glareEnable={true} glareMaxOpacity={0.05} glarePosition="all" tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03} className="h-full">
                                        {/* ✨ REFACTORED: Archived discs also open the modal */}
                                        <DiscItem
                                            disc={disc}
                                            type="archived"
                                            onOpenDetails={handleOpenDiscModal}
                                        />
                                    </Tilt>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Accordion>
                </>
            )}

            {/* ✨ REFACTORED: The new detail modal is now rendered conditionally */}
            <DiscDetailModal
                disc={selectedDiscForModal}
                isOpen={!!selectedDiscForModal}
                onClose={handleCloseDiscModal}
                onEdit={openEditDiscModal}
                onArchive={handleArchiveDisc}
                onRestore={handleRestoreDisc}
                onDelete={handleDeleteDisc}
            />

            <button onClick={openAddDiscModal} className="fab-fix fixed bottom-24 right-4 !bg-blue-600 hover:!bg-blue-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50" title="Add New Disc"><span className="text-2xl">＋</span></button>
            <AddDiscFromAPImodal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} onSubmit={handleSelectDiscFromApi} apiDiscs={apiDiscs} isLoading={isApiLoading} fetchError={apiFetchError} />
            <DiscFormModal
                isOpen={isDetailsModalOpen}
                onClose={closeModalAndReset}
                onSubmit={handleDetailsSubmit}
                initialData={currentDiscToEdit || pendingApiDisc}
                discTypes={ALL_DISC_TYPES.filter(t => t !== 'Other')}
            />
            <DeleteConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={cancelDeleteDisc}
                onConfirm={confirmDeleteDisc}
                message={`Are you sure you want to permanently delete '${deleteModalState.disc?.name}'? This cannot be undone.`}
            />
        </div>
    );
}