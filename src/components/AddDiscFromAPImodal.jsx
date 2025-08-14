import React, { useState, useEffect, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Search } from 'lucide-react';

export default function AddDiscFromAPImodal({
    isOpen,
    onClose,
    onSubmit,
    apiDiscs,
    isLoading,
    fetchError,
    modalOrigin
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDisc, setSelectedDisc] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsAnimated(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimated(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSearchQuery('');
            setSelectedDisc(null);
        }
    }, [isOpen]);

    const filteredDiscs = useMemo(() => {
        if (!searchQuery) return [];
        return apiDiscs.filter(disc =>
            disc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            disc.brand.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 100);
    }, [searchQuery, apiDiscs]);

    const handleSelectDisc = (disc) => {
        setSelectedDisc(disc);
        setSearchTerm(`${disc.brand} ${disc.name}`);
        setSearchQuery('');
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSearchQuery(value);
        setSelectedDisc(null);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setSearchQuery('');
        setSelectedDisc(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedDisc) {
            const discData = {
                name: selectedDisc.name,
                manufacturer: selectedDisc.brand,
                type: selectedDisc.category,
                speed: selectedDisc.speed,
                glide: selectedDisc.glide,
                turn: selectedDisc.turn,
                fade: selectedDisc.fade,
                stability: selectedDisc.fade,
                plastic: '',
                color: '',
            };
            onSubmit(discData);
            onClose();
        }
    };

    const modalStyle = isAnimated
        ? {
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
            opacity: 1,
            backgroundColor: 'rgb(37, 99, 235)',
            transition: 'top 0.3s ease-in-out, left 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out, border-radius 0.3s ease-in-out, opacity 0.3s ease-in-out, background-color 0.3s ease-in-out',
        }
        : {
            top: modalOrigin?.top,
            left: modalOrigin?.left,
            width: modalOrigin?.width,
            height: modalOrigin?.height,
            borderRadius: '50%',
            opacity: 1,
            backgroundColor: 'rgb(37, 99, 235)',
            transition: 'top 0.3s ease-in-out, left 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out, border-radius 0.3s ease-in-out, opacity 0.3s ease-in-out, background-color 0.3s ease-in-out',
        };

    const contentClasses = `bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto transition-opacity duration-200 transform ${isAnimated ? 'opacity-100 delay-100' : 'opacity-0'}`;

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isAnimated ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div
                        className={`fixed flex items-center justify-center z-50 transition-all duration-300 ease-in-out`}
                        style={modalStyle}
                    >
                        <div className={contentClasses}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Add Disc from Database</h3>
                                <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by disc name or brand..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="w-full pl-10 pr-10 py-2 border rounded-md bg-white dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full !bg-transparent text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                                            aria-label="Clear search"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                                {isLoading && <p className="text-center text-gray-600 dark:text-gray-400 my-2">Loading disc database...</p>}
                                {fetchError && <p className="text-center text-red-500 my-2">{fetchError}</p>}
                                <div className={`overflow-y-auto border rounded-md bg-gray-50 dark:bg-gray-900 transition-all duration-300 ${selectedDisc ? 'h-28' : 'h-60'}`}>
                                    {selectedDisc ? (
                                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                            <p className="text-gray-600 dark:text-gray-400 mb-1">You've selected:</p>
                                            <p className="font-semibold text-lg text-gray-800 dark:text-white">{selectedDisc.brand} {selectedDisc.name}</p>
                                            <p className="text-sm text-gray-500">{selectedDisc.category} | {selectedDisc.speed} | {selectedDisc.glide} | {selectedDisc.turn} | {selectedDisc.fade}</p>
                                        </div>
                                    ) : filteredDiscs.length > 0 ? (
                                        <ul className="w-full">
                                            {filteredDiscs.map(disc => (
                                                <li key={disc.id} onClick={() => handleSelectDisc(disc)} className="p-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 border-b dark:border-gray-700">
                                                    <p className="font-semibold">{disc.brand} {disc.name}</p>
                                                    <p className="text-sm text-gray-500">{disc.category} | {disc.speed} | {disc.glide} | {disc.turn} | {disc.fade}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="p-4 text-center text-gray-500">
                                                {searchQuery ? 'No discs found.' : 'Start typing to search.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end mt-6">
                                    <button
                                        type="submit"
                                        className="!bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                        disabled={!selectedDisc}
                                    >
                                        Add Selected Disc
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}