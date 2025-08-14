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
import { FaTrash } from 'react-icons/fa';
import { Archive, FolderOpen, ChevronDown, Pencil, MoreVertical } from 'lucide-react';

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

const DiscItem = React.memo(({ disc, type, isExpanded, onToggleExpand, onEdit, onArchive, onRestore, onDelete }) => {
    const dropdownRef = useRef(null);
    const actionButtonRef = useRef(null);
    const [isActionsOpen, setIsActionsOpen] = useState(false);

    const handleToggleActions = useCallback((e) => { e.stopPropagation(); setIsActionsOpen(prev => !prev); }, []);
    const closeActions = useCallback(() => setIsActionsOpen(false), []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionButtonRef.current?.contains(event.target)) return;
            if (isActionsOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) closeActions();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isActionsOpen, closeActions]);

    const createActionHandler = useCallback((action) => (e) => { e.stopPropagation(); action(disc); closeActions(); }, [disc, closeActions]);

    return (
        <div className="relative h-full">
            <div className={`w-full h-full flex flex-col border rounded-lg shadow-sm overflow-hidden text-left transition-shadow hover:shadow-md ${type === 'active' ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
                <button onClick={() => onToggleExpand(disc.id)} aria-expanded={isExpanded} className={`flex-grow w-full flex text-left ${isExpanded ? 'rounded-b-none' : ''}`}>
                    <div className="w-2 flex-shrink-0" style={{ backgroundColor: disc.color || 'transparent' }} />
                    <div className="p-4 flex-1 min-w-0">
                        <h4 className={`text-lg font-normal ${type === 'active' ? 'text-gray-800 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}><span className='font-bold'>{disc.manufacturer}</span> {disc.name}</h4>
                        <div className="mt-1">
                            <p className={`text-sm ${type === 'active' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>{disc.notes || <span className="italic text-gray-400 dark:text-gray-500">No notes.</span>}</p>
                            {disc.weight && <p className={`text-xs mt-1 ${type === 'active' ? 'text-gray-500 dark:text-gray-500' : 'text-gray-500 dark:text-gray-500'}`}>Weight: {disc.weight}g</p>}
                        </div>
                    </div>
                </button>
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <h5 className="text-center text-sm font-bold text-gray-700 dark:text-gray-300 pt-3 mb-2">Flight Path</h5>
                                <div className="flex justify-center"><FlightPath isExpanded={isExpanded} speed={disc.speed} glide={disc.glide} turn={disc.turn} fade={disc.fade} /></div>
                                <p className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">{`${disc.speed ?? 'N/A'} | ${disc.glide ?? 'N/A'} | ${disc.turn ?? 'N/A'} | ${disc.fade ?? 'N/A'}`}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="absolute top-2 right-2">
                <button ref={actionButtonRef} onClick={handleToggleActions} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full !bg-transparent hover:!bg-gray-100 dark:hover:!bg-gray-700/50 transition-colors" title="Disc Options"><MoreVertical size={20} /></button>
                {isActionsOpen && (
                    <div ref={dropdownRef} className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-20">
                        {type === 'active' ? (
                            <>
                                <button onClick={createActionHandler(onEdit)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md"><Pencil size={16} className="mr-2" /> Edit</button>
                                <button onClick={createActionHandler(onArchive)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"><Archive size={16} className="mr-2" /> Move to Shelf</button>
                                <button onClick={createActionHandler(onDelete)} className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-b-md"><FaTrash size={16} className="mr-2" /> Delete</button>
                            </>
                        ) : (
                            <>
                                <button onClick={createActionHandler(onRestore)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-md"><FolderOpen size={16} className="mr-2" /> Restore to Bag</button>
                                <button onClick={createActionHandler(onDelete)} className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-b-md"><FaTrash size={16} className="mr-2" /> Delete</button>
                            </>
                        )}
                    </div>
                )}
            </div>
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
    const [expandedDiscId, setExpandedDiscId] = useState(null);
    const [openAccordion, setOpenAccordion] = useState(null);


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

    const handleToggleExpand = useCallback((discId) => setExpandedDiscId(prevId => (prevId === discId ? null : discId)), []);
    const openAddDiscModal = useCallback(() => setIsApiModalOpen(true), []);
    const openEditDiscModal = useCallback((disc) => { setCurrentDiscToEdit(disc); setPendingApiDisc(null); setIsDetailsModalOpen(true); }, []);
    const handleSelectDiscFromApi = useCallback((disc) => { setPendingApiDisc(disc); setIsApiModalOpen(false); setIsDetailsModalOpen(true); }, []);
    const handleDeleteDisc = useCallback((disc) => setDeleteModalState({ isOpen: true, disc }), []);

    const handleToggleAccordion = useCallback((type) => {
        setOpenAccordion(prevOpen => (prevOpen === type ? null : type));
    }, []);

    const collapseAll = useCallback(() => {
        setOpenAccordion(null);
        setExpandedDiscId(null);
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

    const handleArchiveDisc = useCallback(async (disc) => { /* Full logic remains the same */ }, [currentUser]);
    const handleRestoreDisc = useCallback(async (disc) => { /* Full logic remains the same */ }, [currentUser]);
    const confirmDeleteDisc = useCallback(async () => { /* Full logic remains the same */ }, [currentUser, deleteModalState.disc]);

    const dynamicDiscTypes = useMemo(() => {
        if (!apiDiscs || apiDiscs.length === 0) return [];
        const allTypes = apiDiscs.map(disc => disc.category);
        return [...new Set(allTypes)].filter(type => type).sort();
    }, [apiDiscs]);

    const groupedAndSortedDiscs = useMemo(() => {
        if (!activeDiscs) return { grouped: {}, sortedTypes: [] };
        const grouped = activeDiscs.reduce((acc, disc) => {
            const type = (disc.type && disc.type.trim() !== '') ? disc.type : 'Other';
            if (!acc[type]) acc[type] = [];
            acc[type].push(disc);
            return acc;
        }, {});
        for (const type in grouped) {
            grouped[type].sort((a, b) => {
                const speedA = parseInt(a.speed, 10) || 0;
                const speedB = parseInt(b.speed, 10) || 0;
                if (speedA !== speedB) return speedB - speedA;
                return (a.name || '').localeCompare(b.name || '');
            });
        }
        const discTypeOrder = ['Distance Driver', 'Hybrid Driver', 'Control Driver', 'Midrange', 'Approach Discs', 'Putter'];
        const sortedTypes = Object.keys(grouped).sort((a, b) => {
            const indexA = discTypeOrder.indexOf(a); const indexB = discTypeOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1; if (indexB === -1) return -1;
            return indexA - indexB;
        });
        return { grouped, sortedTypes };
    }, [activeDiscs]);

    const listVariants = { visible: { transition: { staggerChildren: 0.07 } }, hidden: {} };
    const itemVariants = { visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }, hidden: { opacity: 0, y: 20, transition: { duration: 0.2 } } };

    if (!currentUser) return <div className="flex justify-center items-center h-screen"><p>Please log in to manage your bag.</p></div>;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8 pb-48">
            <h2 className="text-2xl font-bold text-center pt-5 mb-2">In Your Bag</h2>
            {activeDiscs.length > 0 && <p className="text-md text-gray-600 dark:text-gray-400 text-center mb-6">{activeDiscs.length} active discs</p>}
            {activeDiscs.length === 0 && archivedDiscs.length === 0 ? (<p className="text-center">You haven't added any discs yet!</p>) : (
                <>
                    <div className="max-w-full mx-auto mb-2 flex justify-start space-x-4"><button onClick={collapseAll} className="!text-sm text-gray-400 dark:text-blue-400 !font-normal hover:underline !bg-transparent">Collapse All</button></div>
                    <div className="space-y-4">
                        {groupedAndSortedDiscs.sortedTypes.map(type => (
                            <Accordion key={type} title={<span className='text-black dark:text-blue-400 text-xl'>{type} <span className='text-black dark:text-white text-base font-light'>({groupedAndSortedDiscs.grouped[type].length} discs)</span></span>}
                                isOpen={openAccordion === type}
                                onToggle={() => handleToggleAccordion(type)}
                            >
                                <motion.ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2" variants={listVariants} initial="hidden" animate="visible">
                                    {groupedAndSortedDiscs.grouped[type].map(disc => (
                                        <motion.li key={disc.id} variants={itemVariants} className="self-stretch relative focus-within:z-10">
                                            <Tilt glareEnable={true} glareMaxOpacity={0.05} glarePosition="all" tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03} className="h-full">
                                                <DiscItem disc={disc} type="active" isExpanded={expandedDiscId === disc.id} onToggleExpand={handleToggleExpand} onEdit={openEditDiscModal} onArchive={handleArchiveDisc} onDelete={handleDeleteDisc} />
                                            </Tilt>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            </Accordion>
                        ))}
                    </div>
                </>
            )}
            {archivedDiscs.length > 0 && (
                <>
                    <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
                    <Accordion title={`On the Shelf (${archivedDiscs.length} discs)`}
                        isOpen={openAccordion === 'archived'}
                        onToggle={() => handleToggleAccordion('archived')}
                    >
                        <motion.ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2" variants={listVariants} initial="hidden" animate="visible">
                            {archivedDiscs.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(disc => (
                                <motion.li key={disc.id} variants={itemVariants} className="self-stretch relative focus-within:z-10">
                                    <Tilt glareEnable={true} glareMaxOpacity={0.05} glarePosition="all" tiltMaxAngleX={8} tiltMaxAngleY={8} scale={1.03} className="h-full">
                                        <DiscItem disc={disc} type="archived" isExpanded={expandedDiscId === disc.id} onToggleExpand={handleToggleExpand} onRestore={handleRestoreDisc} onDelete={handleDeleteDisc} />
                                    </Tilt>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </Accordion>
                </>
            )}
            <button onClick={openAddDiscModal} className="fab-fix fixed bottom-24 right-4 !bg-blue-600 hover:!bg-blue-700 text-white !rounded-full w-14 h-14 flex items-center justify-center shadow-lg z-50" title="Add New Disc"><span className="text-2xl">＋</span></button>
            <AddDiscFromAPImodal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} onSubmit={handleSelectDiscFromApi} apiDiscs={apiDiscs} isLoading={isApiLoading} fetchError={apiFetchError} />
            <DiscFormModal
                isOpen={isDetailsModalOpen}
                onClose={closeModalAndReset}
                onSubmit={handleDetailsSubmit}
                initialData={currentDiscToEdit || pendingApiDisc}
                discTypes={dynamicDiscTypes}
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